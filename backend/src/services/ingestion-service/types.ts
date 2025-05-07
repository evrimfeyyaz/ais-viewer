/**
 * An PositionReport AIS message is used to report the vessel's current position, heading, speed,
 * and other relevant information to other vessels and coastal authorities. This message includes
 * the vessel's unique MMSI (Maritime Mobile Service Identity) number, the latitude and longitude of
 *  its current position, the vessel's course over ground (COG) and speed over ground (SOG), the
 * type of navigation status the vessel is in (e.g. underway using engine, anchored, etc.), and the
 * vessel's dimensional information (length, width, and type). This information is used to help
 * identify and track vessels in order to improve safety, efficiency, and compliance in the maritime
 * industry.
 *
 * Based on https://aisstream.io/documentation#PositionReport
 */
export type PositionReport = {
  Cog: number;
  CommunicationState: number;
  Latitude: number;
  Longitude: number;
  MessageID: number;
  NavigationalStatus: number;
  PositionAccuracy: boolean;
  Raim: boolean;
  RateOfTurn: number;
  RepeatIndicator: number;
  Sog: number;
  Spare: number;
  SpecialManoeuvreIndicator: number;
  Timestamp: number;
  TrueHeading: number;
  UserID: number;
  Valid: boolean;
};

type AISMetaData = {
  /** The Maritime Mobile Service Identity (MMSI) of the vessel. */
  MMSI: number;
  /** The name of the vessel. */
  ShipName: string;
  /** The latitude of the vessel. */
  latitude: number;
  /** The longitude of the vessel. */
  longitude: number;
  /** The timestamp of the AIS message. */
  time_utc: string;
};

/**
 * The message type passed for each AIS event. It contains metadata about the message such as the
 * position and ship name, the message type and the message field. The message field contains a JSON
 * object with the AIS message contained inside with the key being the AIS message type or in other
 * words the value of the MessageType key.
 *
 * Based on https://aisstream.io/documentation#AISMessage
 */
type AISMessage = {
  Message: Record<string, unknown>;
  MessageType: string;
  MetaData: AISMetaData;
};

export type PositionReportMessage = AISMessage & {
  MessageType: "PositionReport";
  Message: {
    PositionReport: PositionReport;
  };
};

/**
 * Type guard to check if a message is a PositionReportMessage.
 */
export function isPositionReportMessage(message: unknown): message is PositionReportMessage {
  if (typeof message !== "object" || message === null) return false;

  const { MessageType, Message, MetaData } = message as AISMessage;
  if (
    typeof MessageType !== "string" ||
    typeof Message !== "object" ||
    typeof MetaData !== "object"
  )
    return false;

  const positionReport = Message.PositionReport as PositionReport;
  if (typeof positionReport !== "object" || positionReport === null) return false;

  return (
    MessageType === "PositionReport" &&
    typeof positionReport.UserID === "number" &&
    typeof positionReport.Latitude === "number" &&
    typeof positionReport.Longitude === "number" &&
    typeof positionReport.Cog === "number" &&
    typeof positionReport.Sog === "number" &&
    typeof positionReport.RateOfTurn === "number" &&
    typeof positionReport.Timestamp === "number" &&
    typeof positionReport.TrueHeading === "number" &&
    typeof positionReport.Valid === "boolean" &&
    typeof MetaData.MMSI === "number" &&
    typeof MetaData.ShipName === "string" &&
    typeof MetaData.latitude === "number" &&
    typeof MetaData.longitude === "number" &&
    typeof MetaData.time_utc === "string"
  );
}
