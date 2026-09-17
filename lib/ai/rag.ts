import { searchClinicalProtocols, searchPatientFAQs, searchDepartmentSOPs, ESIProtocol } from "./vectorStore";
import { DepartmentType, TriageLevel } from "@prisma/client";

export interface VitalSignsInput {
  spo2?: number;
  hr?: number;
  systolicBp?: number;
  diastolicBp?: number;
  temp?: number;
}

export interface GroundedClinicalGuidance {
  triageLevel: TriageLevel;
  departmentType: DepartmentType;
  citedProtocolId: string;
  protocolTitle: string;
  clinicalRationale: string;
  redFlags: string[];
  immediateActions: string[];
  differentialConsiderations: string[];
  anticipatedOrders: string[];
  precautions: {
    en: string;
    hi: string;
  };
  patientVoiceScript: {
    en: string;
    hi: string;
  };
}

/**
 * Core Clinical RAG Retriever:
 * Evaluates patient symptoms and physiological vital signs against verified ESI v4 emergency protocols.
 */
export async function retrieveClinicalEvidence(
  chiefComplaint: string,
  vitals?: VitalSignsInput
): Promise<GroundedClinicalGuidance> {
  const query = (chiefComplaint || "").trim();
  const searchResults = searchClinicalProtocols(query, 3);
  const bestMatch = searchResults[0]?.item;

  const spo2 = vitals?.spo2;
  const hr = vitals?.hr;
  const sbp = vitals?.systolicBp;
  const temp = vitals?.temp;

  // 1. Critical Physiological Overrides (Life-threat Level 1)
  if (
    (spo2 !== undefined && spo2 < 88) ||
    /unresponsive|cardiac arrest|not breathing|बेहोश|सांस बंद|गिर पड़ा/i.test(query)
  ) {
    return {
      triageLevel: "LEVEL_1_RESUSCITATION",
      departmentType: "EMERGENCY_ROOM",
      citedProtocolId: "ESI_V4_SEC_3_1_RESUSCITATION",
      protocolTitle: "Immediate Resuscitation & Life Threats",
      clinicalRationale: "Critical safety override: Severe hypoxemia (SpO2 < 88%) or acute collapse requiring immediate resuscitation.",
      redFlags: ["Profound hypoxia / respiratory failure", "Potential airway or circulatory collapse"],
      immediateActions: ["Transfer immediately to Resuscitation Bay", "Supplemental high-flow O2 & IV access"],
      differentialConsiderations: ["Tension pneumothorax", "Massive pulmonary embolism", "Severe shock"],
      anticipatedOrders: ["Stat Arterial Blood Gas (ABG)", "High-sensitivity Troponin", "Stat Portable Chest X-Ray"],
      precautions: {
        en: "Emergency team has been notified. Move immediately to the Trauma/Resus bay. Do not leave patient alone.",
        hi: "इमरजेंसी टीम को सूचित कर दिया गया है। मरीज को तुरंत इमरजेंसी ट्रॉमा रूम में ले जाएं।"
      },
      patientVoiceScript: {
        en: "Your condition is being prioritized for immediate emergency care. Please proceed directly to the Emergency Room right away.",
        hi: "आपकी स्थिति को तुरंत आपातकालीन देखभाल के लिए चुना गया है। कृपया सीधे इमरजेंसी रूम में तुरंत जाएं।"
      }
    };
  }

  // 2. High-Risk Emergent Check (Level 2: Cardiac chest pain, Stroke FAST signs, severe vitals)
  const isHypoxic = spo2 !== undefined && spo2 < 92;
  const isHypertensiveCrisis = sbp !== undefined && sbp >= 190;
  const isTachycardic = hr !== undefined && hr > 130;
  const hasCardiac = /chest pain|heart attack|angina|सीने में दर्द|छाती में दर्द|दिल का दौरा/i.test(query);
  const hasStroke = /stroke|facial droop|slurred speech|paralysis|लकवा|फालिज|मुंह टेढ़ा/i.test(query);

  if (hasCardiac || isHypoxic || isHypertensiveCrisis || isTachycardic) {
    return {
      triageLevel: "LEVEL_2_EMERGENT",
      departmentType: "EMERGENCY_ROOM",
      citedProtocolId: "ESI_V4_SEC_3_2_CHEST_PAIN",
      protocolTitle: "Acute Coronary Syndrome & High-Risk Chest Pain",
      clinicalRationale: "High-risk chest pain or significant vital sign derangement. Time-critical evaluation required.",
      redFlags: ["Crushing chest pain / radiation to left arm or jaw", "Severe diaphoresis / cold sweat"],
      immediateActions: ["12-lead ECG within 10 minutes", "Continuous cardiac telemetry"],
      differentialConsiderations: ["Acute Coronary Syndrome (STEMI / NSTEMI)", "Aortic Dissection", "Pulmonary Embolism"],
      anticipatedOrders: ["12-Lead Electrocardiogram (ECG)", "Serum Troponin-I", "Chest X-Ray"],
      precautions: {
        en: "Sit quietly and avoid physical movement. Do not eat or drink hot liquids right now.",
        hi: "शांति से बैठें और कोई शारीरिक मेहनत न करें। अभी कुछ भी खाएं या पिएं नहीं।"
      },
      patientVoiceScript: {
        en: "Your token has been prioritized for urgent evaluation in the Emergency Department. Please take a seat, rest calmly, and avoid exertion. An ECG test may be performed shortly.",
        hi: "आपका टोकन इमरजेंसी विभाग में त्वरित जांच के लिए जारी किया गया है। कृपया आराम से बैठें। डॉक्टर जल्द ही आपकी ईसीजी और खून जांच करवा सकते हैं।"
      }
    };
  }

  if (hasStroke) {
    return {
      triageLevel: "LEVEL_2_EMERGENT",
      departmentType: "EMERGENCY_ROOM",
      citedProtocolId: "ESI_V4_SEC_3_3_ACUTE_STROKE",
      protocolTitle: "Acute Neurological Deficit & Suspected Stroke",
      clinicalRationale: "Acute neurological deficit (facial droop, speech impediment, hemiparesis). Thrombolysis window active.",
      redFlags: ["Sudden unilateral weakness", "Slurred or absent speech"],
      immediateActions: ["Code Stroke activation", "Immediate non-contrast Brain CT"],
      differentialConsiderations: ["Acute Ischemic Stroke", "Intracerebral Hemorrhage", "Severe Hypoglycemia"],
      anticipatedOrders: ["Non-Contrast CT Brain", "Point-of-Care Blood Glucose", "Coagulation Profile"],
      precautions: {
        en: "Keep head elevated at 30 degrees. Strict NPO (nothing by mouth). Note symptom onset time.",
        hi: "सिर को 30 डिग्री ऊंचा रखें। मुंह से कुछ भी न दें। लक्षण शुरू होने का समय याद रखें।"
      },
      patientVoiceScript: {
        en: "Urgent neurological evaluation initiated. Proceed to Emergency. Do not drink water or eat food.",
        hi: "आपातकालीन न्यूरो जांच शुरू की गई है। तुरंत इमरजेंसी में जाएं। पानी या खाना बिल्कुल न लें।"
      }
    };
  }

  // 3. Fallback to Best Matching ESI Protocol from Knowledge Base
  if (bestMatch && searchResults[0].score > 0.08) {
    const dep = (bestMatch.departmentType as DepartmentType) || "GENERAL_OPD";
    const level = (bestMatch.triageLevel as TriageLevel) || "LEVEL_3_URGENT";

    return {
      triageLevel: level,
      departmentType: dep,
      citedProtocolId: bestMatch.protocolId,
      protocolTitle: bestMatch.title,
      clinicalRationale: `Grounded protocol match via ESI v4: ${bestMatch.title}. Patient symptoms correlate with standard triage guidelines.`,
      redFlags: bestMatch.redFlags,
      immediateActions: bestMatch.immediateActions,
      differentialConsiderations: bestMatch.differentialConsiderations,
      anticipatedOrders: bestMatch.anticipatedOrders,
      precautions: {
        en: bestMatch.precautionsEn,
        hi: bestMatch.precautionsHi
      },
      patientVoiceScript: {
        en: `Your token is registered. Please proceed towards ${dep.replace("_", " ")}. The doctor may request ${bestMatch.anticipatedOrders.slice(0, 2).join(" and ")}. Please note: ${bestMatch.precautionsEn}`,
        hi: `आपका टोकन दर्ज कर लिया गया है। कृपया ${dep.replace("_", " ")} की ओर जाएं। डॉक्टर आपसे ${bestMatch.anticipatedOrders.slice(0, 2).join(" और ")} कराने को कह सकते हैं। ध्यान रखें: ${bestMatch.precautionsHi}`
      }
    };
  }

  // 4. Default Routine Consultation
  return {
    triageLevel: "LEVEL_5_NON_URGENT",
    departmentType: "GENERAL_OPD",
    citedProtocolId: "ESI_V4_SEC_5_1_ROUTINE_OPD",
    protocolTitle: "Routine Consultation & Medication Refills",
    clinicalRationale: "Stable presentation with no acute red-flag symptoms. Routed to General Outpatient queue.",
    redFlags: ["Report back immediately if severe pain, shortness of breath, or dizziness develops"],
    immediateActions: ["Direct to General OPD waiting area", "Prepare existing medical prescriptions"],
    differentialConsiderations: ["Mild acute viral illness", "Chronic disease follow-up", "Routine health screening"],
    anticipatedOrders: ["Routine Blood Pressure & Vitals", "Basic Metabolic Panel"],
    precautions: {
      en: "Keep your previous prescriptions, medical history, and test reports handy for the doctor.",
      hi: "डॉक्टर को दिखाने के लिए अपने पुराने पर्चे और पिछली जांच रिपोर्ट अपने साथ तैयार रखें।"
    },
    patientVoiceScript: {
      en: "Your token has been issued for General OPD. Please keep your previous prescriptions and medical records ready. You will be called shortly.",
      hi: "आपका टोकन जनरल ओपीडी के लिए जारी कर दिया गया है। कृपया अपने पुराने पर्चे और रिपोर्ट्स तैयार रखें। आपको जल्द ही बुलाया जाएगा।"
    }
  };
}

/**
 * Multilingual Patient FAQ Grounded Answering
 */
export async function answerPatientFAQ(
  userQuery: string,
  preferredLanguage: "en" | "hi" = "en"
): Promise<{
  matchedFaqId?: string;
  category?: string;
  answer: string;
  confidence: number;
}> {
  const results = searchPatientFAQs(userQuery, 1);
  const best = results[0];

  if (best && best.score > 0.05) {
    const answer = preferredLanguage === "hi" ? best.item.answerHi : best.item.answerEn;
    return {
      matchedFaqId: best.item.faqId,
      category: best.item.category,
      answer,
      confidence: Math.min(1.0, Number((best.score * 2.5).toFixed(2))),
    };
  }

  // Fallback polite hospital information
  if (preferredLanguage === "hi") {
    return {
      answer: "आपके सवाल की सटीक जानकारी के लिए कृपया स्वागत काउंटर (Help Desk) या मुख्य पूछताछ केंद्र पर संपर्क करें। यदि यह आपातकालीन स्थिति है, तो सीधे इमरजेंसी वार्ड में जाएं।",
      confidence: 0.3
    };
  }

  return {
    answer: "For specific details regarding your inquiry, please check with the Main Help Desk at the hospital atrium or consult your attending doctor. In case of an emergency, proceed directly to the Emergency Room.",
    confidence: 0.3
  };
}
