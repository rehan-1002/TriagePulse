export interface Hospital {
  id: string;
  name: string;
  shortName: string;
  code: string;
  city: string;
  address: string;
  type: "GOVERNMENT_APEX" | "PUBLIC_DISTRICT" | "PRIVATE_SUPER" | "COMMUNITY";
  bedCapacity: number;
  totalCounters: number;
  activeDoctors: number;
  currentWaitMin: number;
  status: "NORMAL" | "MODERATE" | "SURGE" | "CRITICAL";
  emergencyAvailable: boolean;
  phone: string;
  accentColor: string;
  tagline: string;
  specialties: string[];
}

export const HOSPITALS: Hospital[] = [
  {
    id: "aiims-delhi",
    name: "AIIMS New Delhi (Apex Trauma & Research)",
    shortName: "AIIMS New Delhi",
    code: "AIIMS",
    city: "New Delhi",
    address: "Sri Aurobindo Marg, Ansari Nagar, New Delhi 110029",
    type: "GOVERNMENT_APEX",
    bedCapacity: 2478,
    totalCounters: 18,
    activeDoctors: 42,
    currentWaitMin: 45,
    status: "SURGE",
    emergencyAvailable: true,
    phone: "011-26588500",
    accentColor: "#10b981", // Emerald
    tagline: "National Referral & Level-1 Trauma Center",
    specialties: ["Emergency Trauma", "Cardiology", "Neurology", "General Medicine", "Oncology"],
  },
  {
    id: "safdarjung",
    name: "VMM & Safdarjung Hospital (Emergency & Burns)",
    shortName: "Safdarjung Hospital",
    code: "SFD",
    city: "New Delhi",
    address: "Ring Road, Opposite AIIMS, New Delhi 110029",
    type: "PUBLIC_DISTRICT",
    bedCapacity: 2800,
    totalCounters: 14,
    activeDoctors: 31,
    currentWaitMin: 22,
    status: "NORMAL",
    emergencyAvailable: true,
    phone: "011-26165060",
    accentColor: "#06b6d4", // Cyan
    tagline: "24/7 Super-Specialty Emergency & Burn Center",
    specialties: ["Emergency Resuscitation", "Burns & Plastic", "Orthopedics", "Pediatrics"],
  },
  {
    id: "apollo-delhi",
    name: "Indraprastha Apollo Super-Specialty Hospital",
    shortName: "Apollo Hospital",
    code: "APL",
    city: "New Delhi",
    address: "Sarita Vihar, Delhi-Mathura Road, New Delhi 110076",
    type: "PRIVATE_SUPER",
    bedCapacity: 710,
    totalCounters: 12,
    activeDoctors: 28,
    currentWaitMin: 12,
    status: "NORMAL",
    emergencyAvailable: true,
    phone: "011-26925858",
    accentColor: "#8b5cf6", // Purple
    tagline: "JCI Accredited Multi-Organ Transplant & Critical Care",
    specialties: ["Interventional Cardiology", "Critical Care", "Gastroenterology", "Pulmonology"],
  },
  {
    id: "civil-gurgaon",
    name: "Civil Hospital Sector 10 (District Healthcare)",
    shortName: "Civil Hospital GGN",
    code: "CVL",
    city: "Gurugram",
    address: "Sector 10A, Near Hero Honda Chowk, Gurugram 122001",
    type: "COMMUNITY",
    bedCapacity: 450,
    totalCounters: 8,
    activeDoctors: 16,
    currentWaitMin: 9,
    status: "NORMAL",
    emergencyAvailable: true,
    phone: "0124-2222220",
    accentColor: "#f59e0b", // Amber
    tagline: "District Public Healthcare & Immunization Hub",
    specialties: ["General OPD", "Maternal Care", "Pathology", "Routine Immunization"],
  },
];

export const DEFAULT_HOSPITAL_ID = "aiims-delhi";

export function getHospitalById(id: string): Hospital {
  return HOSPITALS.find((h) => h.id === id) || HOSPITALS[0];
}

export function isTokenForHospital(token: any, hospitalCode: string): boolean {
  if (!hospitalCode) return true;

  // 1. Check riskFlags if present
  if (Array.isArray(token?.riskFlags) && token.riskFlags.includes(`HOSPITAL_${hospitalCode}`)) {
    return true;
  }

  // 2. Check visitorName / patientName
  const name = token?.visitorName || token?.patientName || "";
  if (name.includes(`[${hospitalCode}]`)) {
    return true;
  }

  // 3. Fallback: If token has no hospital tag at all, attribute to default hospital (AIIMS)
  if (!name.includes("[") && hospitalCode === "AIIMS") {
    return true;
  }

  return false;
}

