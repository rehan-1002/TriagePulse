export interface HospitalTriageQuestion {
  id: string;
  hindiTitle: string;
  englishTitle: string;
  hindiSub: string;
  englishSub: string;
  severity: "EMERGENCY" | "URGENT" | "STANDARD";
  severityLabelHindi: string;
  severityLabelEnglish: string;
  colorBorder: string;
  colorBg: string;
  colorText: string;
  defaultComplaint: string;
  preferredQueueCode: string;
  departmentName: string;
}

export interface HospitalQueueConfig {
  code: string;
  name: string;
  department: string;
  description: string;
  estimatedServiceTime: number;
}

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
  triageQuestions: HospitalTriageQuestion[];
  queueConfigs: HospitalQueueConfig[];
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
    accentColor: "#10b981",
    tagline: "National Referral & Level-1 Trauma Center",
    specialties: ["Emergency Trauma", "Cardiology", "Neurology", "General Medicine", "Oncology"],
    queueConfigs: [
      { code: "ED", name: "AIIMS Level-1 Red Resuscitation", department: "EMERGENCY_ROOM", description: "Immediate polytrauma, acute MI, hemorrhagic shock", estimatedServiceTime: 12 },
      { code: "TR", name: "AIIMS Acute Intake & Rapid Vitals", department: "TRIAGE_DESK", description: "Nurse-led vitals, ESI scoring, priority tagging", estimatedServiceTime: 4 },
      { code: "OPD", name: "AIIMS Apex Specialty Consultation", department: "GENERAL_OPD", description: "Consultant physicians, oncologists, cardiologists", estimatedServiceTime: 9 },
      { code: "DX", name: "AIIMS National Diagnostic & PET Lab", department: "PATHOLOGY_LAB", description: "Stat arterial blood gas, high-resolution CT, biomarkers", estimatedServiceTime: 6 },
      { code: "RX", name: "AIIMS Central Subsidized Pharmacy", department: "CENTRAL_PHARMACY", description: "Life-saving formulations, generic dispensations", estimatedServiceTime: 5 },
    ],
    triageQuestions: [
      {
        id: "aiims-cardiac-sos",
        hindiTitle: "सीने में तेज दबाव व पसीना",
        englishTitle: "Acute Coronary / Cardiac Arrest Risk",
        hindiSub: "सीने में असहनीय दर्द, बाएं हाथ में दर्द, सांस फूलना",
        englishSub: "Crushing chest pain, radiation to left arm, diaphoresis",
        severity: "EMERGENCY",
        severityLabelHindi: "आपातकाल (ESI 1)",
        severityLabelEnglish: "CRITICAL ESI-1",
        colorBorder: "border-red-500",
        colorBg: "bg-red-950/40 hover:bg-red-950/60",
        colorText: "text-red-400",
        defaultComplaint: "AIIMS Trauma: Acute Chest Pain, Diaphoresis, Suspected Myocardial Infarction",
        preferredQueueCode: "ED",
        departmentName: "AIIMS Emergency Resuscitation",
      },
      {
        id: "aiims-polytrauma",
        hindiTitle: "सड़क दुर्घटना / गंभीर चोट",
        englishTitle: "Level-1 Polytrauma & Severe Hemorrhage",
        hindiSub: "दुर्घटना, बेहोशी, भारी रक्तस्राव, फ्रैक्चर",
        englishSub: "Vehicular accident, blunt trauma, uncontrolled bleeding",
        severity: "EMERGENCY",
        severityLabelHindi: "आपातकाल (ESI 1)",
        severityLabelEnglish: "CRITICAL ESI-1",
        colorBorder: "border-red-500",
        colorBg: "bg-red-950/40 hover:bg-red-950/60",
        colorText: "text-red-400",
        defaultComplaint: "AIIMS Trauma: Polytrauma following road traffic collision with heavy blood loss",
        preferredQueueCode: "ED",
        departmentName: "AIIMS Apex Trauma Hall",
      },
      {
        id: "aiims-neuro-stroke",
        hindiTitle: "अचानक लकवा / बोलने में लड़खड़ाहट",
        englishTitle: "Acute Neuro Stroke / FAST Protocol",
        hindiSub: "चेहरा टेढ़ा, एक तरफ कमजोरी, बेहोशी",
        englishSub: "Facial droop, arm weakness, slurred speech (Window < 4.5 hrs)",
        severity: "EMERGENCY",
        severityLabelHindi: "तत्काल सहायता",
        severityLabelEnglish: "EMERGENT ESI-2",
        colorBorder: "border-amber-500",
        colorBg: "bg-amber-950/40 hover:bg-amber-950/60",
        colorText: "text-amber-400",
        defaultComplaint: "AIIMS Stroke Unit: Sudden onset unilateral weakness and aphasia",
        preferredQueueCode: "TR",
        departmentName: "AIIMS Acute Neurology Triage",
      },
      {
        id: "aiims-oncology-fever",
        hindiTitle: "कैंसर मरीज को तेज बुखार व दर्द",
        englishTitle: "Oncology Emergency / Febrile Neutropenia",
        hindiSub: "कीमोथेरेपी चल रही है, तेज बुखार, कंपकंपी",
        englishSub: "Active chemotherapy, Temp > 101F, extreme lethargy",
        severity: "URGENT",
        severityLabelHindi: "ऑन्कोलॉजी वार्ड",
        severityLabelEnglish: "URGENT ESI-3",
        colorBorder: "border-purple-500",
        colorBg: "bg-purple-950/40 hover:bg-purple-950/60",
        colorText: "text-purple-400",
        defaultComplaint: "AIIMS IRCH: Cancer patient with post-chemo febrile neutropenia alert",
        preferredQueueCode: "OPD",
        departmentName: "AIIMS Cancer Specialty OPD",
      },
      {
        id: "aiims-routine-specialty",
        hindiTitle: "विशेषज्ञ डॉक्टर परामर्श / फॉलो-अप",
        englishTitle: "Tertiary Sub-Specialty Consultation",
        hindiSub: "एम्स पुरानी फाइल, टेस्ट रिपोर्ट, दवा नवीनीकरण",
        englishSub: "Chronic care review, superspecialty OPD registration",
        severity: "STANDARD",
        severityLabelHindi: "सामान्य ओपीडी",
        severityLabelEnglish: "ROUTINE ESI-4",
        colorBorder: "border-emerald-500",
        colorBg: "bg-emerald-950/30 hover:bg-emerald-950/50",
        colorText: "text-emerald-400",
        defaultComplaint: "AIIMS General OPD: Chronic condition follow-up and prescription review",
        preferredQueueCode: "OPD",
        departmentName: "AIIMS General Outpatient Wing",
      },
    ],
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
    accentColor: "#06b6d4",
    tagline: "24/7 Super-Specialty Emergency & Burn Center",
    specialties: ["Emergency Resuscitation", "Burns & Plastic", "Orthopedics", "Pediatrics"],
    queueConfigs: [
      { code: "ED", name: "Safdarjung Burns & Trauma Casualty", department: "EMERGENCY_ROOM", description: "Acute burn resuscitation, compound trauma, disaster triage", estimatedServiceTime: 10 },
      { code: "TR", name: "Safdarjung Emergency Triage Desk", department: "TRIAGE_DESK", description: "Initial clinical evaluation, rapid burn staging", estimatedServiceTime: 3 },
      { code: "OPD", name: "Safdarjung General & Orthopedic Clinics", department: "GENERAL_OPD", description: "Orthopedic plaster room, pediatric medicine, general surgery", estimatedServiceTime: 7 },
      { code: "DX", name: "Safdarjung 24x7 Emergency Biochemistry", department: "PATHOLOGY_LAB", description: "Electrolytes, cross-match, digital X-Ray", estimatedServiceTime: 5 },
      { code: "RX", name: "Safdarjung Central Dispensary", department: "CENTRAL_PHARMACY", description: "Burn dressings, antibiotics, essential drugs", estimatedServiceTime: 4 },
    ],
    triageQuestions: [
      {
        id: "sfd-burns",
        hindiTitle: "आग या केमिकल से जलना",
        englishTitle: "Burn Injuries & Inhalation Smoke Shock",
        hindiSub: "जलने से तेज जलन, फफोले, सांस में धुआं",
        englishSub: "Thermal, electrical, or chemical burn trauma with severe pain",
        severity: "EMERGENCY",
        severityLabelHindi: "आपातकाल बर्न वार्ड",
        severityLabelEnglish: "BURNS ESI-1",
        colorBorder: "border-red-500",
        colorBg: "bg-red-950/40 hover:bg-red-950/60",
        colorText: "text-red-400",
        defaultComplaint: "Safdarjung Burns Center: Acute high-degree thermal burns and smoke inhalation",
        preferredQueueCode: "ED",
        departmentName: "Safdarjung Dedicated Burns ICU",
      },
      {
        id: "sfd-ortho-fracture",
        hindiTitle: "हड्डी टूटना / भारी चोट",
        englishTitle: "Acute Fracture & Dislocation Trauma",
        hindiSub: "हाथ या पैर की हड्डी टूटकर बाहर आना, चलने में असमर्थ",
        englishSub: "Open compound fracture, deformed limb, excruciating pain",
        severity: "URGENT",
        severityLabelHindi: "हड्डी रोग आपातकाल",
        severityLabelEnglish: "ORTHO ESI-2",
        colorBorder: "border-amber-500",
        colorBg: "bg-amber-950/40 hover:bg-amber-950/60",
        colorText: "text-amber-400",
        defaultComplaint: "Safdarjung Ortho: Acute limb fracture with severe swelling and open wound",
        preferredQueueCode: "TR",
        departmentName: "Safdarjung Plaster & Trauma Desk",
      },
      {
        id: "sfd-pediatric-fever",
        hindiTitle: "बच्चे को तेज बुखार व दौरे",
        englishTitle: "Pediatric Febrile Convulsion & Illness",
        hindiSub: "शिशु बेहोश, दूध न पीना, अत्यधिक रोना",
        englishSub: "Infant high fever, febrile seizure, severe dehydration",
        severity: "URGENT",
        severityLabelHindi: "बाल रोग आपातकाल",
        severityLabelEnglish: "PEDIATRIC ESI-2",
        colorBorder: "border-blue-500",
        colorBg: "bg-blue-950/40 hover:bg-blue-950/60",
        colorText: "text-blue-400",
        defaultComplaint: "Safdarjung Pediatrics: Infant with high spike fever and suspected febrile seizure",
        preferredQueueCode: "TR",
        departmentName: "Safdarjung Pediatric Acute Ward",
      },
      {
        id: "sfd-general-medicine",
        hindiTitle: "बुखार, खांसी व कमजोरी",
        englishTitle: "Acute Viral Fever & Respiratory Infection",
        hindiSub: "3-4 दिन से बुखार, शरीर में दर्द, जुकाम",
        englishSub: "Persistent pyrexia, body ache, productive cough",
        severity: "STANDARD",
        severityLabelHindi: "सामान्य ओपीडी",
        severityLabelEnglish: "GENERAL OPD ESI-4",
        colorBorder: "border-emerald-500",
        colorBg: "bg-emerald-950/30 hover:bg-emerald-950/50",
        colorText: "text-emerald-400",
        defaultComplaint: "Safdarjung Medicine: Seasonal viral syndrome with persistent fever",
        preferredQueueCode: "OPD",
        departmentName: "Safdarjung Medicine OPD Hall",
      },
    ],
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
    accentColor: "#8b5cf6",
    tagline: "JCI Accredited Multi-Organ Transplant & Critical Care",
    specialties: ["Interventional Cardiology", "Critical Care", "Gastroenterology", "Pulmonology"],
    queueConfigs: [
      { code: "ED", name: "Apollo Critical Care & Cath Lab Unit", department: "EMERGENCY_ROOM", description: "Immediate angiogram, ECMO, critical stabilization", estimatedServiceTime: 8 },
      { code: "TR", name: "Apollo Premium Triage & Vitals Pod", department: "TRIAGE_DESK", description: "Direct nurse assessment, instant 12-lead ECG", estimatedServiceTime: 2 },
      { code: "OPD", name: "Apollo Super-Specialty Executive Suites", department: "GENERAL_OPD", description: "Private physician cabins, organ-specific specialists", estimatedServiceTime: 6 },
      { code: "DX", name: "Apollo Advanced Imaging & 3T MRI Lab", department: "PATHOLOGY_LAB", description: "Immediate cardiac CT, high-speed automated blood panels", estimatedServiceTime: 4 },
      { code: "RX", name: "Apollo 24/7 Digital Pharmacy", department: "CENTRAL_PHARMACY", description: "Imported pharmaceuticals, robotic dispensing", estimatedServiceTime: 3 },
    ],
    triageQuestions: [
      {
        id: "apl-interventional-cardiac",
        hindiTitle: "हार्ट अटैक / सीने में तेज घुटन",
        englishTitle: "Acute STEMI / Emergency Cath Lab Express",
        hindiSub: "सांस रुकना, जबड़े और पीठ में दर्द, भारी पसीना",
        englishSub: "Suspected acute STEMI, cardiogenic shock, door-to-balloon < 60 min",
        severity: "EMERGENCY",
        severityLabelHindi: "अति आवश्यक (आपातकाल)",
        severityLabelEnglish: "CRITICAL ESI-1",
        colorBorder: "border-red-500",
        colorBg: "bg-red-950/40 hover:bg-red-950/60",
        colorText: "text-red-400",
        defaultComplaint: "Apollo Cardiac: Acute STEMI protocol triggered, urgent Cath Lab mobilization",
        preferredQueueCode: "ED",
        departmentName: "Apollo Emergency Cath Lab",
      },
      {
        id: "apl-gi-bleed",
        hindiTitle: "खून की उल्टी / पेट में भयंकर दर्द",
        englishTitle: "Acute Gastrointestinal Bleed & Sepsis",
        hindiSub: "काले दस्त, खून की उल्टी, पेट में असहनीय मरोड़",
        englishSub: "Hematemesis, melena, severe acute abdomen, hemodynamic instability",
        severity: "EMERGENCY",
        severityLabelHindi: "आपातकाल गैस्ट्रो",
        severityLabelEnglish: "EMERGENT ESI-2",
        colorBorder: "border-rose-500",
        colorBg: "bg-rose-950/40 hover:bg-rose-950/60",
        colorText: "text-rose-400",
        defaultComplaint: "Apollo Gastro: Upper GI Bleed with hemodynamic tachycardia",
        preferredQueueCode: "ED",
        departmentName: "Apollo Critical Care Triage",
      },
      {
        id: "apl-pulmonary-failure",
        hindiTitle: "सांस की गंभीर बीमारी (SpO2 < 90%)",
        englishTitle: "Severe Acute Asthma / Hypoxemic Crisis",
        hindiSub: "सांस न आना, होंठ नीले पड़ना, ऑक्सीजन लेवल गिरना",
        englishSub: "Status asthmaticus, acute COPD exacerbation, oxygen desaturation",
        severity: "URGENT",
        severityLabelHindi: "पल्मोनोलॉजी यूनिट",
        severityLabelEnglish: "PULMONOLOGY ESI-2",
        colorBorder: "border-cyan-500",
        colorBg: "bg-cyan-950/40 hover:bg-cyan-950/60",
        colorText: "text-cyan-400",
        defaultComplaint: "Apollo Pulmo: Acute asthma exacerbation with SpO2 86% on room air",
        preferredQueueCode: "TR",
        departmentName: "Apollo Respiratory Pod",
      },
      {
        id: "apl-executive-check",
        hindiTitle: "सुपर-स्पेशियलिटी डॉक्टर कंसल्टेशन",
        englishTitle: "Apollo Executive Health & Specialist Review",
        hindiSub: "वरिष्ठ चिकित्सक से परामर्श, रिपोर्ट रिव्यू",
        englishSub: "Consultant physician, diabetes & wellness evaluation",
        severity: "STANDARD",
        severityLabelHindi: "प्रीमियम ओपीडी",
        severityLabelEnglish: "EXECUTIVE OPD ESI-4",
        colorBorder: "border-purple-500",
        colorBg: "bg-purple-950/30 hover:bg-purple-950/50",
        colorText: "text-purple-400",
        defaultComplaint: "Apollo Private: Senior Consultant review and comprehensive metabolic panel",
        preferredQueueCode: "OPD",
        departmentName: "Apollo Executive Suites",
      },
    ],
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
    accentColor: "#f59e0b",
    tagline: "District Public Healthcare & Immunization Hub",
    specialties: ["General OPD", "Maternal Care", "Pathology", "Routine Immunization"],
    queueConfigs: [
      { code: "ED", name: "Civil Casualty & Emergency Ward", department: "EMERGENCY_ROOM", description: "First-aid, snake bite anti-venom, acute stabilization", estimatedServiceTime: 6 },
      { code: "TR", name: "Civil Maternity & General Triage", department: "TRIAGE_DESK", description: "Antenatal screening, rapid vitals, token registration", estimatedServiceTime: 2 },
      { code: "OPD", name: "Civil Outpatient Polyclinic", department: "GENERAL_OPD", description: "General physicians, pediatricians, eye & ENT", estimatedServiceTime: 5 },
      { code: "DX", name: "Civil District Diagnostic Lab", department: "PATHOLOGY_LAB", description: "Malaria smear, dengue NS1, CBC, sputum examination", estimatedServiceTime: 4 },
      { code: "RX", name: "Civil Jan Aushadhi Kendra", department: "CENTRAL_PHARMACY", description: "Free government medication and maternal supplements", estimatedServiceTime: 3 },
    ],
    triageQuestions: [
      {
        id: "cvl-maternity-labour",
        hindiTitle: "डिलीवरी / प्रसव पीड़ा",
        englishTitle: "Active Maternal Labour & Antenatal Emergency",
        hindiSub: "तेज पेट दर्द, प्रसव संकुचन, रक्तस्राव",
        englishSub: "Imminent labour, premature rupture of membranes, fetal distress",
        severity: "EMERGENCY",
        severityLabelHindi: "प्रसूति वार्ड (आपातकाल)",
        severityLabelEnglish: "MATERNITY ESI-1",
        colorBorder: "border-red-500",
        colorBg: "bg-red-950/40 hover:bg-red-950/60",
        colorText: "text-red-400",
        defaultComplaint: "Civil Hospital Maternity: Active labour contractions with maternal distress",
        preferredQueueCode: "TR",
        departmentName: "Civil Maternal Emergency Suite",
      },
      {
        id: "cvl-dengue-fever",
        hindiTitle: "डेंगू / मलेरिया तेज बुखार व कंपकंपी",
        englishTitle: "Vector-Borne Crisis (Dengue / Malaria Alert)",
        hindiSub: "तेज बुखार, आंखों के पीछे दर्द, प्लेटलेट कम होना",
        englishSub: "High fever, retro-orbital headache, thrombocytopenia rash",
        severity: "URGENT",
        severityLabelHindi: "संक्रामक वार्ड",
        severityLabelEnglish: "INFECTIOUS ESI-2",
        colorBorder: "border-amber-500",
        colorBg: "bg-amber-950/40 hover:bg-amber-950/60",
        colorText: "text-amber-400",
        defaultComplaint: "Civil Hospital Epidemic: Suspected severe Dengue with low platelets",
        preferredQueueCode: "TR",
        departmentName: "Civil Fever Triage Desk",
      },
      {
        id: "cvl-dog-bite",
        hindiTitle: "कुत्ते या जानवर का काटना (रेबीज सुई)",
        englishTitle: "Animal Bite / Rabies & Tetanus Prophylaxis",
        hindiSub: "कुत्ता, बिल्ली या बंदर ने काटा, गहरा घाव",
        englishSub: "Category 3 animal bite, immediate anti-rabies vaccine (ARV)",
        severity: "URGENT",
        severityLabelHindi: "एंटी-रेबीज क्लिनिक",
        severityLabelEnglish: "ARV CLINIC ESI-3",
        colorBorder: "border-blue-500",
        colorBg: "bg-blue-950/40 hover:bg-blue-950/60",
        colorText: "text-blue-400",
        defaultComplaint: "Civil Hospital Casualty: Category III stray dog bite wound requiring ARV",
        preferredQueueCode: "ED",
        departmentName: "Civil ARV Emergency Counter",
      },
      {
        id: "cvl-routine-opd",
        hindiTitle: "सामान्य पर्ची / डॉक्टर परामर्श",
        englishTitle: "District General OPD & Free Medications",
        hindiSub: "सामान्य जांच, बीपी, शुगर, जन औषधि दवा",
        englishSub: "Routine family physician consultation and refill",
        severity: "STANDARD",
        severityLabelHindi: "सामान्य ओपीडी",
        severityLabelEnglish: "GENERAL OPD ESI-4",
        colorBorder: "border-emerald-500",
        colorBg: "bg-emerald-950/30 hover:bg-emerald-950/50",
        colorText: "text-emerald-400",
        defaultComplaint: "Civil Hospital OPD: General medical consultation and routine prescription",
        preferredQueueCode: "OPD",
        departmentName: "Civil Main OPD Hall",
      },
    ],
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
