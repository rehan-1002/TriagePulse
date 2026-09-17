import esiProtocols from "./knowledge/esi_v4_protocols.json";
import departmentSops from "./knowledge/department_sops.json";
import patientFaqs from "./knowledge/patient_faqs.json";

export interface ESIProtocol {
  protocolId: string;
  title: string;
  triageLevel: string;
  departmentType: string;
  vitalLimits?: {
    spo2Min?: number;
    hrMin?: number;
    hrMax?: number;
    systolicBpMax?: number;
    tempMax?: number;
  };
  redFlags: string[];
  immediateActions: string[];
  differentialConsiderations: string[];
  anticipatedOrders: string[];
  precautionsEn: string;
  precautionsHi: string;
  keywords: string[];
}

export interface DepartmentSOP {
  department: string;
  name: string;
  location: string;
  inclusionCriteria: string[];
  operatingHours: string;
  prerequisites: string;
  standardTurnaroundMins: number;
}

export interface PatientFAQ {
  faqId: string;
  category: string;
  keywords: string[];
  questionEn: string;
  answerEn: string;
  questionHi: string;
  answerHi: string;
}

export interface ScoredResult<T> {
  item: T;
  score: number;
  matchedTerms: string[];
}

/**
 * Tokenize and normalize input string across English and Hindi.
 */
function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

/**
 * Compute cosine-like TF-IDF semantic overlap score between query terms and document content.
 */
function calculateSimilarityScore(
  queryTokens: string[],
  docTokens: string[],
  boostKeywords: string[] = []
): { score: number; matchedTerms: string[] } {
  if (queryTokens.length === 0 || docTokens.length === 0) {
    return { score: 0, matchedTerms: [] };
  }

  const docFreqMap = new Map<string, number>();
  for (const token of docTokens) {
    docFreqMap.set(token, (docFreqMap.get(token) || 0) + 1);
  }

  let matchScore = 0;
  const matchedTerms: string[] = [];
  const boostSet = new Set(boostKeywords.map((k) => k.toLowerCase()));

  for (const q of queryTokens) {
    // Exact or substring match in document tokens
    if (docFreqMap.has(q)) {
      const termFreq = docFreqMap.get(q)!;
      const weight = boostSet.has(q) ? 3.0 : 1.5;
      matchScore += weight * Math.log(1 + termFreq);
      matchedTerms.push(q);
    } else {
      // Partial prefix/stem match
      for (const [dToken] of docFreqMap) {
        if (dToken.startsWith(q) || q.startsWith(dToken)) {
          matchScore += 0.8;
          matchedTerms.push(q);
          break;
        }
      }
    }
  }

  // Length normalization
  const normalizedScore = matchScore / (Math.sqrt(queryTokens.length) * Math.sqrt(docTokens.length) + 1e-5);
  return { score: normalizedScore, matchedTerms: Array.from(new Set(matchedTerms)) };
}

/**
 * Clinical Protocol Vector Retrieval
 */
export function searchClinicalProtocols(query: string, topK = 3): ScoredResult<ESIProtocol>[] {
  const queryTokens = tokenize(query);
  const protocols = esiProtocols as ESIProtocol[];

  const scored: ScoredResult<ESIProtocol>[] = protocols.map((protocol) => {
    const docText = [
      protocol.title,
      protocol.departmentType,
      protocol.triageLevel,
      ...protocol.redFlags,
      ...protocol.differentialConsiderations,
      ...protocol.anticipatedOrders,
      ...protocol.keywords,
      protocol.precautionsEn,
      protocol.precautionsHi,
    ].join(" ");

    const docTokens = tokenize(docText);
    const { score, matchedTerms } = calculateSimilarityScore(
      queryTokens,
      docTokens,
      protocol.keywords
    );

    return {
      item: protocol,
      score,
      matchedTerms,
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Hospital Department SOP Retrieval
 */
export function searchDepartmentSOPs(query: string, topK = 2): ScoredResult<DepartmentSOP>[] {
  const queryTokens = tokenize(query);
  const sops = departmentSops as DepartmentSOP[];

  const scored: ScoredResult<DepartmentSOP>[] = sops.map((sop) => {
    const docText = [
      sop.name,
      sop.department,
      sop.location,
      sop.prerequisites,
      ...sop.inclusionCriteria,
    ].join(" ");

    const docTokens = tokenize(docText);
    const { score, matchedTerms } = calculateSimilarityScore(queryTokens, docTokens);

    return {
      item: sop,
      score,
      matchedTerms,
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Patient Bilingual FAQ Retrieval
 */
export function searchPatientFAQs(
  query: string,
  topK = 2
): ScoredResult<PatientFAQ>[] {
  const queryTokens = tokenize(query);
  const faqs = patientFaqs as PatientFAQ[];

  const scored: ScoredResult<PatientFAQ>[] = faqs.map((faq) => {
    const docText = [
      faq.questionEn,
      faq.answerEn,
      faq.questionHi,
      faq.answerHi,
      ...faq.keywords,
    ].join(" ");

    const docTokens = tokenize(docText);
    const { score, matchedTerms } = calculateSimilarityScore(
      queryTokens,
      docTokens,
      faq.keywords
    );

    return {
      item: faq,
      score,
      matchedTerms,
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
