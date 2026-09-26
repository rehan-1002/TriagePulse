# 🏆 TriagePulse — Hackathon 5-Minute Championship Pitch & Demo Guide

> **MUSA CodeX Hackathon 2025**  
> **Team:** Rehan Ansari · Patel Afifa · Poonawala Mansoor · Preetam Pandey · Nomaan Ali Shaikh  
> **Target Pitch Duration:** 5 Minutes (300 Seconds)

---

## 📺 Pre-Pitch Screen Setup (Before Judges Walk Up)

Arrange your workstation into **3 synchronized screens**:
- **Screen 1 (Laptop Left Tab):** Staff Operator Cockpit (`/counter`)
- **Screen 2 (Laptop Right Tab or External TV/Monitor):** Airport TV Display (`/display`) *(Click the "Test Audio" button once so browser autoplay is unlocked!)*
- **Screen 3 (Mobile Phone Browser):** Visitor Intake (`/join`)

---

## ⏱️ Minute-by-Minute 5-Minute Master Pitch Script

### 0:00 – 0:45 | The Hook (The Hidden Lethal Crisis)
**Speaker:**
> "Respected Judges, in an emergency room, seconds dictate survival. But in almost every hospital in our country today, physical queues are **clinically blind**."
>
> "Picture this: A 55-year-old man suffering from an acute myocardial infarction — a heart attack — stands in the exact same slow, paper-token line behind a college student who just wants a routine prescription refill."
>
> "Existing solutions like Qmatic or Qtrac cost **₹5 to ₹10 Lakhs** per lobby in bulky touchscreen kiosks, assume full literacy, and have **zero clinical intelligence**. A piece of paper cannot detect if a patient is about to collapse."
>
> "We built **TriagePulse** — a zero-hardware, AI-orchestrated clinical queue engine that transforms chaotic hospital lobbies into an intelligent, life-saving care stream."

---

### 0:45 – 1:45 | Zero-Hardware Live Voice Intake (The "Wow" Moment)
**Speaker:**
> "Here is how a patient arrives at our hospital:  
> There are no expensive kiosks. Just a single printable QR code poster on the wall. The patient points any smartphone — **no app to download, no account to create, no login**."
>
> "Now, imagine an elderly or illiterate patient who cannot read or type in English."

`[ACTION]:` Tap the pulsing microphone button on `/join` and speak clearly:
> **"सीने में बहुत तेज दर्द हो रहा है और पसीना आ रहा है।"** *(Acute chest pain and heavy sweating).*

`[ACTION]:` Submit.

**Speaker:**
> "Watch what just happened in under 200 milliseconds:
> 1. Our native Web Speech API transcribed the Hindi symptoms live.
> 2. Our **Clinical RAG Engine**, strictly bound to the **AHRQ / CDC ESI Version 4 protocol**, classified this patient as **Level 2: EMERGENT (Cardiac)**.
> 3. It didn't hallucinate a random guess — it cited verified medical protocols, routed them directly to Emergency Cardiology, generated immediate patient precautions, and placed token **PT-104** at the very top of the priority queue."

---

### 1:45 – 2:45 | The Tri-Screen Real-Time Symphony
**Speaker:**
> "Now let's look at the operational ecosystem. We have three screens working in perfect harmony:  
> Over here is the **Staff Operator Cockpit (`/counter`)**, here is the **Lobby TV Board (`/display`)**, and on the phone is the **Patient's Virtual Live Pass**."
>
> "The triage doctor sees the red emergent cardiac flag at the top of their queue. Watch what happens when the doctor calls this patient."

`[ACTION]:` On `/counter`, click **"CALL NEXT PATIENT"** (or press Spacebar).

*(Audio Chime rings: Ding-Dong! Followed by voice: "Patient P T 104, please proceed to Doctor Cabin 1.")*

**Speaker:**
> "Instantly:
> - The Lobby TV rings a dual-tone acoustic chime (587Hz–880Hz) to cut through ambient noise and announces the token aloud.
> - Notice the compliance: to protect patient dignity under **HIPAA and NDHM standards**, the TV displays only de-identified initials, not their medical condition.
> - Simultaneously, the patient's phone pass flashes emerald green, vibrates, and gives live spoken directions to Doctor Cabin 1.
> - All of this synchronized in **sub-second latency without a single page refresh**."

---

### 2:45 – 3:45 | Doctor Clinical Copilot & Admin AI Director
**Speaker:**
> "Now, the patient walks into Doctor Cabin 1. TriagePulse doesn't stop at queueing — it acts as clinical decision support."

`[ACTION]:` Point to the **Doctor Clinical Copilot** panel on `/counter`.

**Speaker:**
> "Inside the consultation room, the doctor gets the **Doctor Clinical Copilot**:
> - It surfaces differential diagnoses to rule out (acute coronary syndrome, aortic dissection).
> - Pre-checked diagnostic checklist — with 1-click 'Send to Blood Lab' or 'Send to Imaging' orders."
>
> "Meanwhile, on the executive side..."

`[ACTION]:` Switch tab to `/admin` (AI Command Center).

**Speaker:**
> "Hospital administrators get live stage dwell times — tracking how long patients spend in Triage vs Doctor vs Lab vs Pharmacy.
>
> Our built-in **Starvation Watchdog** flags anyone waiting over 45 minutes.
>
> And with one click, our **Gemini 1.5 Flash AI Director** analyzes real-time telemetry to output actionable tactical directives — like reassigning staff when an OPD queue begins to overflow."

---

### 3:45 – 4:30 | Why TriagePulse Wins (Competitive Advantage)
**Speaker:**
> "Why can't hospitals just use existing queue systems?
> 1. **Zero Capital Expenditure:** Competitors charge lakhs for proprietary hardware. TriagePulse deploys with a single printed sheet of paper.
> 2. **Clinical Urgency, Not FIFO:** Standard systems treat people as First-In, First-Out numbers. TriagePulse prioritizes patients by medical severity.
> 3. **Offline & Resilient Architecture:** Our clinical RAG and TF-IDF similarity store run locally. Even if hospital internet fluctuates, patient triage and queue progress never stall.
> 4. **Enterprise Concurrency:** Every state transition is an atomic Prisma ACID database transaction — eliminating race conditions, double-calls, and audit discrepancies."

---

### 4:30 – 5:00 | The Unforgettable Finale
**Speaker:**
> "In summary, Judges:
>
> TriagePulse brings clinical intelligence to the very first second a patient steps foot into a hospital.
>
> It protects the critical patient, guides the elderly, empowers the physician, and optimizes the institution — all with zero hardware.
>
> We are team **TriagePulse**, and we are ready for your questions. Thank you!"

---

## 🛡️ Tough Judge Questions & Power Answers

### Q1: *"What about patients who do not have a smartphone?"*
> **Answer:**  
> "Healthcare equity is central to our design. Non-smartphone users are supported in 3 ways:  
> 1. **Lobby TV Signage & Audio Chimes (`/display`):** Patients simply listen for the acoustic chime and vocal announcement, exactly like an airport terminal.  
> 2. **Assisted Helpdesk / Nurse Tablet (`/counter`):** A lobby desk nurse holds the microphone for the patient to speak in Hindi or regional language, and hands them their token number or printed thermal slip.  
> 3. **Resource Reallocation:** By shifting smartphone users to self-service on their own devices, we eliminate 80% of reception congestion, freeing up hospital staff to give **100% of their physical attention** to elderly, phoneless, or distressed patients."

### Q2: *"Can the AI hallucinate and give dangerous medical advice?"*
> **Answer:**  
> "No. We do **not** use generative LLMs for triage. Our triage core is a deterministic RAG engine strictly bound to the **AHRQ / CDC ESI Version 4 protocol** using an offline TF-IDF vector store. Every triage output cites a verified protocol ID, red flags, and standard diagnostic tests. Generative AI (Gemini Flash) is only used on the administrative side for operational hospital bottleneck reports."

### Q3: *"What are HIPAA and NDHM, and how do you comply?"*
> **Answer:**  
> "- **HIPAA (US benchmark)** & **NDHM / ABDM (National Digital Health Mission, India)** mandate patient data privacy and confidentiality.  
> - On our public TV signage (`/display`), we **never** show full names or medical complaints. The screen only shows de-identified initials: `PT-104 (R. A.)`.  
> - Tokens are ephemeral and session-isolated. No Aadhaar or password is required to join.  
> - All inputs are sanitized with isomorphic DOMPurify, and transitions are logged into an immutable Prisma audit ledger."

### Q4: *"What if the hospital Wi-Fi drops or is slow?"*
> **Answer:**  
> "Our Clinical RAG Engine, ESI protocols, and TF-IDF similarity store run locally on the server without external API dependencies. Furthermore, our frontend uses native browser `BroadcastChannel` for instantaneous (<1ms) cross-screen communication, backed by automatic 2-second background reconciliation so screens never fall out of sync."

---

## 🎬 60-Second AI Product Video Master Prompt

*(Use this prompt in InVideo AI, Runway Gen-3, Luma Dream Machine, or Sora)*

```text
Cinematic 60-second high-energy tech product commercial for "TriagePulse", an AI-powered zero-hardware clinical queue and hospital triage engine. Modern cybernetic dark aesthetic with emerald green neon accents (#10b981) and clean glassmorphism UI.

Act 1 - The Crisis: Chaotic, crowded hospital emergency lobby with distressed patients, crying children, paper tokens scattered, and an opaque static LED board. A 55-year-old man clutches his chest in agony, waiting behind someone asking for a routine cough prescription. Text overlay: "Hospitals manage queues. They don't manage urgency."

Act 2 - The Zero-Hardware Entry: Seamless transition to an ultra-modern hospital lobby. No bulky ₹10-Lakh kiosks. A single sleek printed QR poster on the wall. A worried family scans the QR code with any smartphone—zero app download, zero login. The patient taps a glowing pulsing mic button and speaks in Hindi: "सीने में बहुत तेज दर्द हो रहा है" (Acute chest pain).

Act 3 - Clinical ESI v4 RAG Core: Futuristic holographic digital data stream showing real-time clinical triage: CDC ESI v4 protocol matches in 200ms. It flags "Level 2 Emergent: Acute Coronary Syndrome", generates precautionary care instructions, anticipated ECG and Troponin tests, and dynamically elevates the patient's token "PT-104" to priority #1.

Act 4 - The Tri-Screen Ecosystem: Fast split-screen showing real-time sub-second sync:
- Screen 1 (Doctor Cockpit): Emergency triage nurse clicks "Call Next Patient" with a Doctor Clinical Copilot showing differential red flags.
- Screen 2 (Airport TV Signage): Overhead 4K display chimes with a crisp dual-tone alert (587Hz-880Hz) and announces: "Patient P T 104, please proceed to Doctor Cabin 1."
- Screen 3 (Mobile Live Pass): The patient's phone vibrates, flashes emerald green, and provides spoken voice directions to Cabin 1.

Act 5 - Admin Intelligence & Outro: Cut to the Hospital AI Command Center displaying Gemini 1.5 Flash bottleneck watchdog analytics, stage dwell times, and operational balance directives. 
Closing hero shot of the cybernetic TriagePulse logo with tagline: "TriagePulse // Zero Hardware. Clinical Urgency. Lives Saved."
```

---

## ✅ Pre-Flight Checklist for 10:00 AM Tomorrow

- [ ] Laptop charger plugged in.
- [ ] Laptop volume turned to 80–100%.
- [ ] Open `/display` in a tab and click **"Test Audio"** once to ensure the chime rings clearly through speakers.
- [ ] Open `/counter` in another tab and verify active counters.
- [ ] Have `/join` ready on your mobile phone to do the live Hindi voice test.
- [ ] Pre-seed 3–5 realistic patients in the queue so the dashboard looks active when judges walk up.
- [ ] Remember: One person drives the demo clicks, one person speaks looking at the judges.
