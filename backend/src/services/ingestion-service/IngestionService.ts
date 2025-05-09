import { FastifyBaseLogger } from "fastify";
import * as http from "http";
import WebSocket from "ws";
import pool from "../../db.js";
import { isPositionReportMessage, PositionReportMessage } from "./types.js";
import { formatTimestampToISO, isValidPosition } from "./utils.js";

/**
 * The IngestionService class is responsible for ingesting AIS data from the AISStream server
 * and upserting it into the database.
 */
export class IngestionService {
  private static readonly AISSTREAM_URL = "wss://stream.aisstream.io/v0/stream";
  private static readonly RECONNECT_DELAY_MS = 10000;
  private static readonly PING_INTERVAL_MS = 30000;
  private static readonly PONG_TIMEOUT_MS = 10000;

  private apiKey: string;
  private ws: WebSocket | null = null;
  private heartBeatInterval: NodeJS.Timeout | null = null;
  private pongTimeout: NodeJS.Timeout | null = null;
  private readonly logger: FastifyBaseLogger;

  constructor(logger: FastifyBaseLogger) {
    this.logger = logger.child({ service: "IngestionService" });
    const apiKey = process.env.AISSTREAM_API_KEY;
    if (!apiKey) {
      this.logger.error(
        "[Ingestion] AISSTREAM_API_KEY not found in environment variables. Cannot start service.",
      );
      throw new Error(
        "[Ingestion] AISSTREAM_API_KEY not found in environment variables. Cannot start service.",
      );
    }
    this.apiKey = apiKey;
  }

  /**
   * Clears the heartbeat and pong timeout intervals.
   */
  private clearTimers() {
    if (this.heartBeatInterval) clearInterval(this.heartBeatInterval);
    if (this.pongTimeout) clearTimeout(this.pongTimeout);
  }

  /**
   * Schedules the heartbeat to send pings to the AISStream server.
   */
  private scheduleHeartbeat() {
    this.clearTimers();

    this.heartBeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.logger.info("[Ingestion] Sending WebSocket ping...");
        this.ws.ping();

        this.pongTimeout = setTimeout(() => {
          this.logger.warn(
            "[Ingestion] WebSocket pong timeout. Connection likely dead. Terminating.",
          );
          this.ws?.terminate(); // This will trigger the 'close' handler and attempt to reconnect.
        }, IngestionService.PONG_TIMEOUT_MS);
      } else {
        // If socket is not open, clear interval and let 'close' handler deal with it
        this.logger.info("[Ingestion] WebSocket not open, clearing heartbeat.");
        this.clearTimers();
      }
    }, IngestionService.PING_INTERVAL_MS);
  }

  /**
   * Upserts the vessel position data into the database.
   */
  private async upsertVesselPosition(
    mmsi: number,
    longitude: number,
    latitude: number,
    course: number,
    name: string,
    timestamp: string,
  ) {
    const upsertQuery = `
          INSERT INTO vessels (mmsi, timestamp, geom, course, name)
          VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, $5, $6)
          ON CONFLICT (mmsi) DO UPDATE
          SET timestamp = EXCLUDED.timestamp,
              geom = EXCLUDED.geom,
              course = EXCLUDED.course,
              name = EXCLUDED.name;
      `;

    try {
      await pool.query(upsertQuery, [mmsi, timestamp, longitude, latitude, course, name]);
    } catch (err) {
      this.logger.error({ err, mmsi }, `[Ingestion] Error upserting data for MMSI ${mmsi}`);
    }
  }

  private async processPositionReportMessage(message: PositionReportMessage) {
    const {
      UserID: mmsi,
      Latitude: latitude,
      Longitude: longitude,
      Cog: course,
    } = message.Message.PositionReport;
    const { ShipName: name, time_utc: timestamp } = message.MetaData;

    if (!isValidPosition(mmsi, latitude, longitude)) {
      return;
    }

    const formattedTimestamp = formatTimestampToISO(timestamp);

    await this.upsertVesselPosition(mmsi, longitude, latitude, course, name, formattedTimestamp);
  }

  private handleWebSocketOpen() {
    this.logger.info("[Ingestion] WebSocket connection opened. Subscribing to messages...");
    const subscriptionMessage = {
      APIKey: this.apiKey,
      BoundingBoxes: [
        // The whole world
        [
          [-90, -180],
          [90, 180],
        ],
      ],
      FilterMessageTypes: ["PositionReport"],
    };
    this.ws?.send(JSON.stringify(subscriptionMessage), (err) => {
      if (err) {
        this.logger.error({ err }, "[Ingestion] Error sending subscription message");
      }
    });
    this.scheduleHeartbeat();
  }

  private handleWebSocketPong() {
    this.logger.info("[Ingestion] WebSocket pong received.");
    if (this.pongTimeout) clearTimeout(this.pongTimeout);
  }

  private async handleWebSocketMessage(data: WebSocket.RawData) {
    try {
      const messageString = data.toString();
      const message = JSON.parse(messageString);

      if (isPositionReportMessage(message)) {
        await this.processPositionReportMessage(message);
      } else {
        this.logger.info(
          { messageType: message.MessageType },
          "[Ingestion] Received non-PositionReport message type",
        );
      }
    } catch (err) {
      this.logger.error(
        { err, rawData: data.toString() },
        "[Ingestion] Error processing received message",
      );
    }
  }

  private handleWebSocketError(error: Error) {
    this.logger.error({ error }, "[Ingestion] WebSocket error");
    this.ws?.terminate();
  }

  private handleWebSocketClose(code: number, reason: Buffer) {
    this.logger.info(
      { code, reason: reason ? reason.toString() : "No reason given" },
      `[Ingestion] WebSocket connection closed.`,
    );
    this.clearTimers();
    this.logger.info(
      `[Ingestion] Attempting to reconnect in ${IngestionService.RECONNECT_DELAY_MS / 1000} seconds...`,
    );
    setTimeout(() => this.connectToAISStream(), IngestionService.RECONNECT_DELAY_MS);
  }

  private handleWebSocketUnexpectedResponse(res: http.IncomingMessage) {
    this.logger.warn(
      { statusCode: res.statusCode, statusMessage: res.statusMessage },
      `[Ingestion] Unexpected HTTP response during WebSocket handshake`,
    );
    this.ws?.terminate();
  }

  private connectToAISStream() {
    this.logger.info("[Ingestion] Attempting to connect to AISStream...");
    this.ws = new WebSocket(IngestionService.AISSTREAM_URL);

    this.ws.on("open", () => this.handleWebSocketOpen());
    this.ws.on("pong", () => this.handleWebSocketPong());
    this.ws.on("message", (data) => this.handleWebSocketMessage(data));
    this.ws.on("error", (error) => this.handleWebSocketError(error));
    this.ws.on("close", (code, reason) => this.handleWebSocketClose(code, reason));
    this.ws.on("unexpected-response", (_req, res) => this.handleWebSocketUnexpectedResponse(res));
  }

  /**
   * Starts the ingestion service.
   */
  public start() {
    try {
      this.logger.info("[Ingestion] Starting AIS Ingestion Service...");
      this.connectToAISStream();
    } catch (error) {
      this.logger.error({ error }, "[Ingestion] Failed to start ingestion service");
      process.exit(1);
    }
  }
}
