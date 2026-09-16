# RAG Clinical Architecture & Roadmap for TriagePulse

## Overview
This document specifies the technical design, data structures, and implementation roadmap for integrating **Retrieval-Augmented Generation (RAG)** into TriagePulse.

---

## 1. Objectives & Clinical Rationale
1. **Evidence-Based Triage (Zero Hallucination)**:
   - Ground LLM decisions in verified emergency triage guidelines (Emergency Severity Index - ESI v4 and hospital SOPs).
   - Require citations (handbook section, SOP protocol ID) for every triage priority and department recommendation.
2. **Doctor Workstation Decision Support**:
   - Provide clinicians in `/counter` with differential considerations, preliminary lab checklists, and red flags before calling the patient.
3. **Multilingual Patient Mobile Assistance**:
   - Enable conversational FAQ answering on `/ticket/[id]` in Hindi & English, resolving patient confusion about fasting, lab locations, and documents.

---

## 2. High-Level Architecture

```
                                  [ CLINICAL DATA SOURCES ]
                                ┌───────────────────────────┐
                                │ • ESI v4 Triage Handbook  │
                                │ • Hospital Department SOPs│
                                │ • Red-Flag Protocols      │
                                │ • Patient Care Handbooks  │
                                └─────────────┬─────────────┘
                                              │ Chunk & Embed
                                              ▼
                                   [ VECTOR DATABASE / EMBED ]
                                ┌─────────────────────────────┐
                                │ Model: embed-multilingual   │
                                │ Store: pgvector / SQLite    │
                                └─────────────┬───────────────┘
                                              │
                    ┌─────────────────────────┴────────────────────────┐
                    │ Vector Similarity Search (Cosine Distance)       │
                    ▼                                                  ▼
     [ CLINICIAN / INTAKE PIPELINE ]                    [ PATIENT MOBILE TICKET ]
 ┌──────────────────────────────────────┐        ┌──────────────────────────────────────┐
 │ Patient Complaint + Vitals           │        │ Patient Query (Hindi / English)      │
 │            │                         │        │            │                         │
 │ Top-3 Clinical Protocols Retrieved   │        │ Relevant Hospital FAQ Retrieved      │
 │            │                         │        │            │                         │
 │ Cohere/Gemini Structured Inference   │        │ Grounded Contextual Answer           │
 │            │                         │        │            │                         │
 │ Output: ESI Level + SOP Citation     │        │ Output: Plain-Language Guidance      │
 └──────────────────────────────────────┘        └──────────────────────────────────────┘
```

---

## 3. Core Knowledge Base Collections

### Collection A: `clinical_triage_guidelines`
- **Source**: ESI v4 (Emergency Severity Index) implementation manual.
- **Attributes**:
  - `protocolId`: e.g. `ESI_V4_CHEST_PAIN_3_2`
  - `title`: Acute Coronary Syndrome & High-Risk Chest Pain
  - `triageLevel`: `LEVEL_2_EMERGENT`
  - `vitalLimits`: `{ spo2Min: 90, hrMax: 120, sbpMax: 180 }`
  - `recommendedDepartment`: `EMERGENCY_ROOM`
  - `immediateActions`: `["12-lead ECG within 10 min", "Troponin-I stat", "IV access"]`
  - `chunkText`: Markdown explanation with red flags and decision trees.

### Collection B: `departmental_routing_directory`
- **Source**: Hospital clinical directories and specialty referral matrices.
- **Attributes**:
  - `department`: e.g. `CARDIOLOGY`, `ORTHOPEDICS`, `PATHOLOGY_LAB`
  - `criteria`: Inclusion/exclusion clinical parameters.
  - `operatingHours`: Timing & token capacity.
  - `prerequisites`: Required preliminary labs or fasting state.

### Collection C: `patient_care_faqs`
- **Source**: Patient information handbook (Bilingual Hindi/English).
- **Attributes**:
  - `topic`: e.g. `FASTING_REQUIREMENTS`, `PHARMACY_HOURS`, `IMAGING_PREP`
  - `questionHi`: क्या मुझे ब्लड टेस्ट के लिए भूखे पेट आना होगा?
  - `questionEn`: Do I need to fast before a blood test?
  - `answerHi`: शुगर और लिपिड प्रोफाइल टेस्ट के लिए 8-10 घंटे का उपवास आवश्यक है।
  - `answerEn`: Fasting of 8-10 hours is required for fasting glucose and lipid profile tests.

---

## 4. Technical Stack Proposal

1. **Embedding Model**:
   - `embed-multilingual-v3.0` (Cohere) or `text-embedding-004` (Google Gemini).
   - High accuracy across cross-lingual queries (Hindi query matching English clinical protocol).
2. **Vector Store**:
   - Option A: PostgreSQL with `pgvector` extension (when deployed to production Supabase/Neon/RDS).
   - Option B: Embedded in-memory / local vector similarity engine using dot-product cosine similarity for zero infrastructure overhead.
3. **Inference Pipeline**:
   - `retrieveRelevantProtocols(complaint, vitals, topK = 3)`
   - Format prompt:
     ```
     You are a clinical decision support system.
     Patient Data: {{patientComplaint}}, Vitals: {{vitals}}
     
     Retrieved Hospital SOPs:
     {{retrievedEvidence}}
     
     Classify the patient according to the retrieved protocols.
     You MUST cite the protocol ID and rationale.
     ```

---

## 5. Implementation Phases

1. **Phase RAG-1: Knowledge Base Preparation**
   - Curate verified Markdown files for ESI v4, department SOPs, and hospital FAQs.
   - Build embedding script to generate vector embeddings.
2. **Phase RAG-2: Intake Decision Support**
   - Wire `classifyPatientSymptoms` in `lib/ai/cohere.ts` to perform vector retrieval before prompt synthesis.
   - Pass citation and rationale to token record in Prisma (`clinicalRationale`, `citedProtocolId`).
3. **Phase RAG-3: Doctor Cabin Copilot UI**
   - Display retrieved clinical evidence, preliminary lab orders, and differential considerations in `app/counter/page.tsx`.
4. **Phase RAG-4: Patient Mobile FAQ Assistant**
   - Add a lightweight conversational drawer to `app/ticket/[id]/page.tsx` for natural language questions.
