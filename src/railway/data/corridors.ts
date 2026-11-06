/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CorridorId, InfrastructureStatus } from "./types";

export interface LineTrackSpec {
  lineCode: string;
  lineName: string;
  purpose: "SLOW_LOCAL" | "FAST_THROUGH" | "HARBOUR_SUBURBAN" | "BRANCH" | "FREIGHT_BYPASS" | "YARD_LEAD";
  direction: "UP" | "DOWN" | "BIDIRECTIONAL";
  gaugeMeters: number;         // 1.676 m Indian Broad Gauge
  maxPermissibleSpeedKmh: number; // 80 - 105 km/h
  electrification: string;     // "25 kV AC 50 Hz OHE"
  signalling: "AUTOMATIC_BLOCK_MACLS" | "ABSOLUTE_BLOCK" | "ONE_TRAIN_ONLY";
}

export interface RailwayCorridorDefinition {
  id: CorridorId;
  name: string;
  nameDevanagari: string;
  zone: "CENTRAL_RAILWAY" | "WESTERN_RAILWAY";
  division: "MUMBAI_CR" | "MUMBAI_WR";
  operatingStatus: InfrastructureStatus;
  headquarters: string;
  terminalNorth: string;
  terminalSouth: string;
  originatingStation: string;
  terminatingStation: string;
  routeLengthKm: number;
  trackCount: number;
  tracks: LineTrackSpec[];
  interchanges: string[];
  historicalNotes: string;
}

export const MUMBAI_RAILWAY_CORRIDORS: Record<CorridorId, RailwayCorridorDefinition> = {
  CENTRAL: {
    id: "CENTRAL",
    name: "Central Railway Main Line",
    nameDevanagari: "मध्य रेल्वे मुख्य मार्ग",
    zone: "CENTRAL_RAILWAY",
    division: "MUMBAI_CR",
    operatingStatus: "EXISTING_COMMISSIONED",
    headquarters: "Chhatrapati Shivaji Maharaj Terminus (CSMT)",
    terminalSouth: "CSMT",
    terminalNorth: "Kalyan Junction (KYN)",
    originatingStation: "CSMT",
    terminatingStation: "KYN",
    routeLengthKm: 53.8,
    trackCount: 6,
    tracks: [
      {
        lineCode: "CR_SL_DN",
        lineName: "Down Suburban Slow Line (Track 3)",
        purpose: "SLOW_LOCAL",
        direction: "DOWN",
        gaugeMeters: 1.676,
        maxPermissibleSpeedKmh: 80,
        electrification: "25 kV AC 50 Hz OHE",
        signalling: "AUTOMATIC_BLOCK_MACLS",
      },
      {
        lineCode: "CR_SL_UP",
        lineName: "Up Suburban Slow Line (Track 2)",
        purpose: "SLOW_LOCAL",
        direction: "UP",
        gaugeMeters: 1.676,
        maxPermissibleSpeedKmh: 80,
        electrification: "25 kV AC 50 Hz OHE",
        signalling: "AUTOMATIC_BLOCK_MACLS",
      },
      {
        lineCode: "CR_TH_DN",
        lineName: "Down Fast Through Line (Track 4)",
        purpose: "FAST_THROUGH",
        direction: "DOWN",
        gaugeMeters: 1.676,
        maxPermissibleSpeedKmh: 105,
        electrification: "25 kV AC 50 Hz OHE",
        signalling: "AUTOMATIC_BLOCK_MACLS",
      },
      {
        lineCode: "CR_TH_UP",
        lineName: "Up Fast Through Line (Track 1)",
        purpose: "FAST_THROUGH",
        direction: "UP",
        gaugeMeters: 1.676,
        maxPermissibleSpeedKmh: 105,
        electrification: "25 kV AC 50 Hz OHE",
        signalling: "AUTOMATIC_BLOCK_MACLS",
      },
      {
        lineCode: "CR_5TH",
        lineName: "5th Line (Suburban/Long Distance Mail/Express)",
        purpose: "FAST_THROUGH",
        direction: "BIDIRECTIONAL",
        gaugeMeters: 1.676,
        maxPermissibleSpeedKmh: 100,
        electrification: "25 kV AC 50 Hz OHE",
        signalling: "AUTOMATIC_BLOCK_MACLS",
      },
      {
        lineCode: "CR_6TH",
        lineName: "6th Line (Suburban/Long Distance Mail/Express)",
        purpose: "FAST_THROUGH",
        direction: "BIDIRECTIONAL",
        gaugeMeters: 1.676,
        maxPermissibleSpeedKmh: 100,
        electrification: "25 kV AC 50 Hz OHE",
        signalling: "AUTOMATIC_BLOCK_MACLS",
      },
    ],
    interchanges: [
      "Western Railway at Dadar (Central PF 1-8 <-> Western PF 1-7)",
      "Harbour Line at Sandhurst Road and Kurla",
      "Trans-Harbour Line at Thane",
      "Parel Carriage Workshop Siding",
      "Matunga Carriage & Wagon Workshop",
    ],
    historicalNotes:
      "First passenger railway in Asia opened on 16 April 1853 (Bori Bunder to Tannah, 34 km). Converted from 1.5 kV DC to 25 kV AC in June 2015.",
  },

  WESTERN: {
    id: "WESTERN",
    name: "Western Railway Suburban Line",
    nameDevanagari: "पश्चिम रेल्वे उपनगरीय मार्ग",
    zone: "WESTERN_RAILWAY",
    division: "MUMBAI_WR",
    operatingStatus: "EXISTING_COMMISSIONED",
    headquarters: "Churchgate (CCG)",
    terminalSouth: "Churchgate (CCG)",
    terminalNorth: "Dahanu Road (DRD)",
    originatingStation: "CCG",
    terminatingStation: "VR",
    routeLengthKm: 59.8,
    trackCount: 5,
    tracks: [
      {
        lineCode: "WR_SL_DN",
        lineName: "Down Suburban Slow Line (Track 1)",
        purpose: "SLOW_LOCAL",
        direction: "DOWN",
        gaugeMeters: 1.676,
        maxPermissibleSpeedKmh: 90,
        electrification: "25 kV AC 50 Hz OHE",
        signalling: "AUTOMATIC_BLOCK_MACLS",
      },
      {
        lineCode: "WR_SL_UP",
        lineName: "Up Suburban Slow Line (Track 2)",
        purpose: "SLOW_LOCAL",
        direction: "UP",
        gaugeMeters: 1.676,
        maxPermissibleSpeedKmh: 90,
        electrification: "25 kV AC 50 Hz OHE",
        signalling: "AUTOMATIC_BLOCK_MACLS",
      },
      {
        lineCode: "WR_TH_DN",
        lineName: "Down Fast Through Line (Track 3)",
        purpose: "FAST_THROUGH",
        direction: "DOWN",
        gaugeMeters: 1.676,
        maxPermissibleSpeedKmh: 105,
        electrification: "25 kV AC 50 Hz OHE",
        signalling: "AUTOMATIC_BLOCK_MACLS",
      },
      {
        lineCode: "WR_TH_UP",
        lineName: "Up Fast Through Line (Track 4)",
        purpose: "FAST_THROUGH",
        direction: "UP",
        gaugeMeters: 1.676,
        maxPermissibleSpeedKmh: 105,
        electrification: "25 kV AC 50 Hz OHE",
        signalling: "AUTOMATIC_BLOCK_MACLS",
      },
      {
        lineCode: "WR_5TH",
        lineName: "5th Line (Bandra to Borivali / Mumbai Central to Borivali)",
        purpose: "FAST_THROUGH",
        direction: "BIDIRECTIONAL",
        gaugeMeters: 1.676,
        maxPermissibleSpeedKmh: 100,
        electrification: "25 kV AC 50 Hz OHE",
        signalling: "AUTOMATIC_BLOCK_MACLS",
      },
    ],
    interchanges: [
      "Central Railway at Dadar (Western PF 1-7 <-> Central PF 1-8)",
      "Harbour Line via Mahim Junction Chord",
      "Vasai-Diva bypass line at Vasai Road",
      "Lower Parel Carriage Workshop",
      "Kandivali EMU Car Shed",
    ],
    historicalNotes:
      "Originally Bombay, Baroda and Central India Railway (BB&CI). Direct connection between Nariman Point / Churchgate and North Mumbai.",
  },

  HARBOUR: {
    id: "HARBOUR",
    name: "Harbour Line",
    nameDevanagari: "हार्बर मार्ग",
    zone: "CENTRAL_RAILWAY",
    division: "MUMBAI_CR",
    operatingStatus: "EXISTING_COMMISSIONED",
    headquarters: "CSMT (Harbour Terminus PF 1 & 2)",
    terminalSouth: "CSMT",
    terminalNorth: "Panvel (PNVL)",
    originatingStation: "CSMT",
    terminatingStation: "PNVL",
    routeLengthKm: 48.9,
    trackCount: 2,
    tracks: [
      {
        lineCode: "HB_DN",
        lineName: "Down Harbour Line",
        purpose: "HARBOUR_SUBURBAN",
        direction: "DOWN",
        gaugeMeters: 1.676,
        maxPermissibleSpeedKmh: 80,
        electrification: "25 kV AC 50 Hz OHE",
        signalling: "AUTOMATIC_BLOCK_MACLS",
      },
      {
        lineCode: "HB_UP",
        lineName: "Up Harbour Line",
        purpose: "HARBOUR_SUBURBAN",
        direction: "UP",
        gaugeMeters: 1.676,
        maxPermissibleSpeedKmh: 80,
        electrification: "25 kV AC 50 Hz OHE",
        signalling: "AUTOMATIC_BLOCK_MACLS",
      },
    ],
    interchanges: [
      "Central Main Line at Sandhurst Road (elevated crossover) and Kurla Junction",
      "Western Railway via Wadala Road - King's Circle - Mahim Junction chord",
      "Trans-Harbour Line at Vashi, Sanpada, Nerul, and Belapur",
      "Sanpada EMU Car Shed",
    ],
    historicalNotes:
      "Opened in 1910 from Kurla to Reay Road, extended to Victoria Terminus in 1925 (first electrified suburban railway in India).",
  },

  HARBOUR_WESTERN_CHORD: {
    id: "HARBOUR_WESTERN_CHORD",
    name: "Harbour-Western Cross-Corridor Chord",
    nameDevanagari: "हार्बर-पश्चिम जोड मार्ग",
    zone: "CENTRAL_RAILWAY",
    division: "MUMBAI_CR",
    operatingStatus: "EXISTING_COMMISSIONED",
    headquarters: "Wadala Road (VDLR)",
    terminalSouth: "Wadala Road (VDLR)",
    terminalNorth: "Goregaon / Borivali (via Mahim Junction)",
    originatingStation: "VDLR",
    terminatingStation: "MM",
    routeLengthKm: 4.2,
    trackCount: 2,
    tracks: [
      {
        lineCode: "HWC_DN",
        lineName: "Down Harbour-Western Chord",
        purpose: "HARBOUR_SUBURBAN",
        direction: "DOWN",
        gaugeMeters: 1.676,
        maxPermissibleSpeedKmh: 65,
        electrification: "25 kV AC 50 Hz OHE",
        signalling: "AUTOMATIC_BLOCK_MACLS",
      },
      {
        lineCode: "HWC_UP",
        lineName: "Up Harbour-Western Chord",
        purpose: "HARBOUR_SUBURBAN",
        direction: "UP",
        gaugeMeters: 1.676,
        maxPermissibleSpeedKmh: 65,
        electrification: "25 kV AC 50 Hz OHE",
        signalling: "AUTOMATIC_BLOCK_MACLS",
      },
    ],
    interchanges: [
      "Harbour Line at Wadala Road (VDLR)",
      "King's Circle Station (KCE)",
      "Western Railway at Mahim Junction (MM)",
    ],
    historicalNotes:
      "Allows Harbour EMUs departing CSMT to run directly onto Western Railway lines through to Bandra, Andheri, and Goregaon.",
  },

  KASARA_BRANCH: {
    id: "KASARA_BRANCH",
    name: "Central Line North-East Branch (Thal Ghat Section)",
    nameDevanagari: "कल्याण-कसारा मार्ग (थळ घाट)",
    zone: "CENTRAL_RAILWAY",
    division: "MUMBAI_CR",
    operatingStatus: "EXISTING_COMMISSIONED",
    headquarters: "Kalyan Junction",
    terminalSouth: "Kalyan Junction (KYN)",
    terminalNorth: "Kasara (KSRA)",
    originatingStation: "KYN",
    terminatingStation: "KSRA",
    routeLengthKm: 67.4,
    trackCount: 2,
    tracks: [
      {
        lineCode: "KAS_DN",
        lineName: "Down Main North-East",
        purpose: "BRANCH",
        direction: "DOWN",
        gaugeMeters: 1.676,
        maxPermissibleSpeedKmh: 100,
        electrification: "25 kV AC 50 Hz OHE",
        signalling: "AUTOMATIC_BLOCK_MACLS",
      },
      {
        lineCode: "KAS_UP",
        lineName: "Up Main North-East",
        purpose: "BRANCH",
        direction: "UP",
        gaugeMeters: 1.676,
        maxPermissibleSpeedKmh: 100,
        electrification: "25 kV AC 50 Hz OHE",
        signalling: "AUTOMATIC_BLOCK_MACLS",
      },
    ],
    interchanges: ["Titwala, Asangaon suburban turnaround platforms"],
    historicalNotes: "Gateway to Northern India through the Sahyadri mountains (Thal Ghat).",
  },

  KARJAT_BRANCH: {
    id: "KARJAT_BRANCH",
    name: "Central Line South-East Branch (Bhor Ghat Section)",
    nameDevanagari: "कल्याण-कर्जत मार्ग (भोर घाट)",
    zone: "CENTRAL_RAILWAY",
    division: "MUMBAI_CR",
    operatingStatus: "EXISTING_COMMISSIONED",
    headquarters: "Kalyan Junction",
    terminalSouth: "Kalyan Junction (KYN)",
    terminalNorth: "Karjat Junction (KJT)",
    originatingStation: "KYN",
    terminatingStation: "KJT",
    routeLengthKm: 45.6,
    trackCount: 2,
    tracks: [
      {
        lineCode: "KAR_DN",
        lineName: "Down Main South-East",
        purpose: "BRANCH",
        direction: "DOWN",
        gaugeMeters: 1.676,
        maxPermissibleSpeedKmh: 100,
        electrification: "25 kV AC 50 Hz OHE",
        signalling: "AUTOMATIC_BLOCK_MACLS",
      },
      {
        lineCode: "KAR_UP",
        lineName: "Up Main South-East",
        purpose: "BRANCH",
        direction: "UP",
        gaugeMeters: 1.676,
        maxPermissibleSpeedKmh: 100,
        electrification: "25 kV AC 50 Hz OHE",
        signalling: "AUTOMATIC_BLOCK_MACLS",
      },
    ],
    interchanges: ["Badlapur, Neral (Matheran Toy Train interchange)", "Khopoli branch connection at Karjat"],
    historicalNotes: "Southern mainline connecting Mumbai to Pune and Southern India.",
  },

  KHOPOLI_BRANCH: {
    id: "KHOPOLI_BRANCH",
    name: "Karjat-Khopoli Single Line Branch",
    nameDevanagari: "कर्जत-खोपोली शाखा",
    zone: "CENTRAL_RAILWAY",
    division: "MUMBAI_CR",
    operatingStatus: "EXISTING_COMMISSIONED",
    headquarters: "Karjat Junction",
    terminalSouth: "Karjat Junction (KJT)",
    terminalNorth: "Khopoli (KHPI)",
    originatingStation: "KJT",
    terminatingStation: "KHPI",
    routeLengthKm: 15.0,
    trackCount: 1,
    tracks: [
      {
        lineCode: "KHOP_BRANCH",
        lineName: "Khopoli Branch Single Line",
        purpose: "BRANCH",
        direction: "BIDIRECTIONAL",
        gaugeMeters: 1.676,
        maxPermissibleSpeedKmh: 65,
        electrification: "25 kV AC 50 Hz OHE",
        signalling: "ONE_TRAIN_ONLY",
      },
    ],
    interchanges: ["Karjat Junction"],
    historicalNotes: "Single line branch serving industrial Khopoli at the base of the Khandala ghat.",
  },

  TRANS_HARBOUR: {
    id: "TRANS_HARBOUR",
    name: "Trans-Harbour Corridor (Thane ⇄ Vashi / Panvel)",
    nameDevanagari: "ट्रान्स-हार्बर मार्ग",
    zone: "CENTRAL_RAILWAY",
    division: "MUMBAI_CR",
    operatingStatus: "EXISTING_COMMISSIONED",
    headquarters: "Thane (TNA)",
    terminalSouth: "Panvel (PNVL)",
    terminalNorth: "Thane (TNA)",
    originatingStation: "TNA",
    terminatingStation: "PNVL",
    routeLengthKm: 38.5,
    trackCount: 2,
    tracks: [
      {
        lineCode: "TH_DN",
        lineName: "Down Trans-Harbour Line",
        purpose: "HARBOUR_SUBURBAN",
        direction: "DOWN",
        gaugeMeters: 1.676,
        maxPermissibleSpeedKmh: 80,
        electrification: "25 kV AC 50 Hz OHE",
        signalling: "AUTOMATIC_BLOCK_MACLS",
      },
      {
        lineCode: "TH_UP",
        lineName: "Up Trans-Harbour Line",
        purpose: "HARBOUR_SUBURBAN",
        direction: "UP",
        gaugeMeters: 1.676,
        maxPermissibleSpeedKmh: 80,
        electrification: "25 kV AC 50 Hz OHE",
        signalling: "AUTOMATIC_BLOCK_MACLS",
      },
    ],
    interchanges: [
      "Central Main Line at Thane Junction",
      "Harbour Line at Vashi, Sanpada, Nerul, Belapur, and Panvel",
      "Sanpada EMU Car Shed",
    ],
    historicalNotes: "Commissioned in 2004 connecting Thane on Central Railway to Navi Mumbai.",
  },

  WESTERN_DAHANU: {
    id: "WESTERN_DAHANU",
    name: "Western Railway Northern Extension (Virar ⇄ Dahanu Road)",
    nameDevanagari: "पश्चिम रेल्वे उत्तर विस्तार (विरार-डहाणू रोड)",
    zone: "WESTERN_RAILWAY",
    division: "MUMBAI_WR",
    operatingStatus: "EXISTING_COMMISSIONED",
    headquarters: "Virar (VR)",
    terminalSouth: "Virar (VR)",
    terminalNorth: "Dahanu Road (DRD)",
    originatingStation: "VR",
    terminatingStation: "DRD",
    routeLengthKm: 64.0,
    trackCount: 2,
    tracks: [
      {
        lineCode: "WR_DAH_DN",
        lineName: "Down Main North Extension",
        purpose: "FAST_THROUGH",
        direction: "DOWN",
        gaugeMeters: 1.676,
        maxPermissibleSpeedKmh: 100,
        electrification: "25 kV AC 50 Hz OHE",
        signalling: "AUTOMATIC_BLOCK_MACLS",
      },
      {
        lineCode: "WR_DAH_UP",
        lineName: "Up Main North Extension",
        purpose: "FAST_THROUGH",
        direction: "UP",
        gaugeMeters: 1.676,
        maxPermissibleSpeedKmh: 100,
        electrification: "25 kV AC 50 Hz OHE",
        signalling: "AUTOMATIC_BLOCK_MACLS",
      },
    ],
    interchanges: ["Virar Suburban Terminus", "Palghar District Headquarters", "Boisar Industrial Zone"],
    historicalNotes: "Extended suburban EMU service commissioned in April 2013 connecting Virar to Dahanu Road.",
  },
};
