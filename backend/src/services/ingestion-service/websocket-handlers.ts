import * as http from "http";
import WebSocket from "ws";
import { processPositionReport } from "./message-processors.js";
import { isPositionReportMessage } from "./types.js";

const RECONNECT_DELAY_MS = 10000; // 10 seconds

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
}

export async function handleWebSocketMessage(data: WebSocket.RawData) {
  try {
    const messageString = data.toString();
    const message = JSON.parse(messageString);

    if (isPositionReportMessage(message)) {
      await processPositionReport(message.Message.PositionReport);
    } else {
      console.log("[Ingestion] Received non-PositionReport message type:", message.MessageType);
    }
  } catch (err) {
    console.error("[Ingestion] Error processing received message:", err);
    console.error("Raw data:", data.toString());
  }
}

export function handleWebSocketError(error: Error) {
  console.error("[Ingestion] WebSocket error:", error.message);
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
  console.log(`[Ingestion] Attempting to reconnect in ${RECONNECT_DELAY_MS / 1000} seconds...`);
  ws.terminate(); // Ensure connection is fully terminated before retrying
  setTimeout(reconnectFn, RECONNECT_DELAY_MS);
}

export function handleWebSocketUnexpectedResponse(
  ws: WebSocket,
  _req: http.ClientRequest,
  res: http.IncomingMessage,
) {
  console.warn(
    `[Ingestion] Unexpected HTTP response during WebSocket handshake: ${res.statusCode} ${res.statusMessage}`,
  );
  ws.terminate();
}
