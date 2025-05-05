import WebSocket from "ws";
import {
  handleWebSocketClose,
  handleWebSocketError,
  handleWebSocketMessage,
  handleWebSocketOpen,
  handleWebSocketUnexpectedResponse,
} from "./websocket-handlers";

const AISSTREAM_URL = "wss://stream.aisstream.io/v0/stream";

function connectToAISStream() {
  const apiKey = process.env.AISSTREAM_API_KEY;
  if (!apiKey) {
    throw new Error(
      "[Ingestion] AISSTREAM_API_KEY not found in environment variables. Cannot start service.",
    );
  }

  console.log("[Ingestion] Attempting to connect to AISStream...");
  const ws = new WebSocket(AISSTREAM_URL);

  ws.on("open", () => handleWebSocketOpen(ws, apiKey));
  ws.on("message", handleWebSocketMessage);
  ws.on("error", handleWebSocketError);
  ws.on("close", (code, reason) => handleWebSocketClose(ws, code, reason, connectToAISStream));
  ws.on("unexpected-response", (req, res) => handleWebSocketUnexpectedResponse(ws, req, res));
}

export function startIngestionService() {
  try {
    console.log("[Ingestion] Starting AIS Ingestion Service...");
    connectToAISStream();
  } catch (error) {
    console.error("[Ingestion] Failed to start ingestion service:", error);
    process.exit(1);
  }
}
