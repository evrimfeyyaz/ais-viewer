import * as http from "http";
import WebSocket from "ws";
import { processPositionReportMessage } from "./message-processors.js";
import { isPositionReportMessage } from "./types.js";

const RECONNECT_DELAY_MS = 10000; // 10 seconds
const PING_INTERVAL_MS = 30000; // Send a ping every 30 seconds
const PONG_TIMEOUT_MS = 10000;

let heartBeatInterval: NodeJS.Timeout;
let pongTimeout: NodeJS.Timeout;

function clearTimers() {
  if (heartBeatInterval) clearInterval(heartBeatInterval);
  if (pongTimeout) clearTimeout(pongTimeout);
}

function scheduleHeartbeat(ws: WebSocket) {
  clearTimers();

  heartBeatInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      console.log("[Ingestion] Sending WebSocket ping...");
      ws.ping();

      pongTimeout = setTimeout(() => {
        console.warn("[Ingestion] WebSocket pong timeout. Connection likely dead. Terminating.");
        ws.terminate(); // This will trigger the 'close' handler and attempt to reconnect.
      }, PONG_TIMEOUT_MS);
    } else {
      // If socket is not open, clear interval and let 'close' handler deal with it
      console.log("[Ingestion] WebSocket not open, clearing heartbeat.");
      clearTimers();
    }
  }, PING_INTERVAL_MS);
}

export function handleWebSocketOpen(ws: WebSocket, apiKey: string) {
  console.log("[Ingestion] WebSocket connection opened. Subscribing to messages...");
  const subscriptionMessage = {
    APIKey: apiKey,
    BoundingBoxes: [
      [
        [-180, -90],
        [180, 90],
      ],
    ],
    FilterMessageTypes: ["PositionReport"],
  };
  ws.send(JSON.stringify(subscriptionMessage), (err) => {
    if (err) {
      console.error("[Ingestion] Error sending subscription message:", err);
    }
  });
  scheduleHeartbeat(ws);
}

export function handleWebSocketPong() {
  console.log("[Ingestion] WebSocket pong received.");
  clearTimeout(pongTimeout);
}

export async function handleWebSocketMessage(data: WebSocket.RawData) {
  try {
    const messageString = data.toString();
    const message = JSON.parse(messageString);

    if (isPositionReportMessage(message)) {
      await processPositionReportMessage(message);
    } else {
      console.log("[Ingestion] Received non-PositionReport message type:", message.MessageType);
    }
  } catch (err) {
    console.error("[Ingestion] Error processing received message:", err);
    console.error("Raw data:", data.toString());
  }
}

export function handleWebSocketError(ws: WebSocket, error: Error) {
  console.error("[Ingestion] WebSocket error:", error.message);
  ws.terminate();
}

export function handleWebSocketClose(
  ws: WebSocket,
  code: number,
  reason: Buffer,
  reconnectFn: () => void,
) {
  console.log(
    `[Ingestion] WebSocket connection closed. Code: ${code}, Reason: ${reason ? reason.toString() : "No reason given"}`,
  );
  clearTimers();
  console.log(`[Ingestion] Attempting to reconnect in ${RECONNECT_DELAY_MS / 1000} seconds...`);
  setTimeout(reconnectFn, RECONNECT_DELAY_MS);
}

export function handleWebSocketUnexpectedResponse(ws: WebSocket, res: http.IncomingMessage) {
  console.warn(
    `[Ingestion] Unexpected HTTP response during WebSocket handshake: ${res.statusCode} ${res.statusMessage}`,
  );
  ws.terminate();
}
