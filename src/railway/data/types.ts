/**
 * Railway Network Types & Schemas
 * Compliant with Session 03 Mumbai Suburban Railway Infrastructure specifications.
 */

export type InfrastructureStatus =
  | "EXISTING_COMMISSIONED"
  | "UNDER_CONSTRUCTION"
  | "SANCTIONED_NOT_STARTED"
  | "PROPOSED"
  | "HISTORICAL_REMOVED";

export type VerificationStatus =
  | "VERIFIED"
  | "PARTIALLY_VERIFIED"
  | "PROVISIONAL"
  | "UNKNOWN";

export type CorridorId =
  | "CENTRAL"
  | "KASARA_BRANCH"
  | "KARJAT_BRANCH"
  | "KHOPOLI_BRANCH"
  | "WESTERN"
  | "HARBOUR"
  | "HARBOUR_WESTERN_CHORD";

export type TrackLayoutType =
  | "DOUBLE"
  | "QUAD"
  | "SIX_LINE"
  | "JUNCTION"
  | "TERMINAL"
  | "YARD"
  | "PROVISIONAL";

export interface SourceReference {
  title: string;
  organization: string;
  url?: string;
  publicationDate?: string;
  section?: string;
  attributeSupported: string;
  confidence: "OFFICIAL_GOVERNMENT" | "RDSO_STANDARD" | "MRVC_PROJECT" | "TIMETABLE_VERIFIED" | "RESEARCH_ESTIMATE";
  verificationStatus: VerificationStatus;
}

export interface StationRecord {
  stationId: string;
  stationName: string;
  stationNameDevanagari: string;
  stationCode: string;
  corridors: CorridorId[];
  stationSequence: number;

  /** WGS-84 Geographic Coordinates (from IR GIS / Survey) */
  latitude: number | null;
  longitude: number | null;
  elevation: number | null;

  /** Passenger platforms verified by official records (null if unknown) */
  passengerPlatformCount: number | null;
  /** Main running tracks passing through (null if unverified) */
  runningTrackCount: number | null;
  /** Maintenance pit lines with pits beneath rails */
  pitLineCount: number | null;
  /** Stabling lines for empty rakes */
  stablingLineCount: number | null;
  /** Sick lines for damaged coach repair */
  sickLineCount: number | null;

  platformArrangement: string | null;
  trackLayout: TrackLayoutType;
  junctionConnections?: string[];

  infrastructureStatus: InfrastructureStatus;
  verificationStatus: VerificationStatus;
  sourceReferences: SourceReference[];
  effectiveDate: string | null;
  notes?: string;
}

export interface InfrastructureProjectRecord {
  id: string;
  name: string;
  corridor: CorridorId | "MULTI_CORRIDOR";
  status: InfrastructureStatus;
  scope: string;
  sanctionYear?: string;
  executingAgency: "MRVC" | "CENTRAL_RAILWAY" | "WESTERN_RAILWAY" | "IRCON";
  verifiedSource: string;
  notes?: string;
}

export type TrackLineType =
  | "LOCAL_UP"
  | "LOCAL_DN"
  | "THROUGH_UP"
  | "THROUGH_DN"
  | "BRANCH_UP"
  | "BRANCH_DN"
  | "PIT_LINE"
  | "STABLING_LINE"
  | "SICK_LINE"
  | "CROSSOVER"
  | "PROVISIONAL";

export interface TrackSegment {
  id: string;
  corridor: CorridorId;
  lineType: TrackLineType;
  startStationId: string;
  endStationId: string;
  startPoint: [number, number, number];
  endPoint: [number, number, number];
  curvePoints?: [number, number, number][];
  lengthMeters: number;
  gaugeMeters: number; // 1.676 broad gauge
  status: InfrastructureStatus;
  verificationStatus: VerificationStatus;
  electrified: boolean; // 25kV AC OHE
}
