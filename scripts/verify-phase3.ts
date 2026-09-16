/**
 * Verification Script for Phase 3:
 * Validates audio announcement milestone triggers, proximity logic (5 ahead, 2 ahead, called),
 * and anti-repetition guards.
 */

function getAnnouncementForMilestone(
  status: "WAITING" | "CALLED" | "SERVING",
  peopleAhead: number,
  tokenNumber: string,
  counterName: string = "Room 1",
  lang: "hi-IN" | "en-IN" = "hi-IN"
): { trigger: string | null; text: string | null } {
  if (status === "CALLED" || status === "SERVING") {
    return {
      trigger: "CALLED",
      text:
        lang === "hi-IN"
          ? `टोकन नंबर ${tokenNumber}, आपका नंबर आ गया है! कृपया ${counterName} में तुरंत जाएं।`
          : `Token ${tokenNumber}, your turn has arrived! Please proceed to ${counterName} immediately.`,
    };
  }

  if (status === "WAITING") {
    if (peopleAhead <= 2 && peopleAhead > 0) {
      return {
        trigger: "2_AHEAD",
        text:
          lang === "hi-IN"
            ? `सावधान! टोकन ${tokenNumber}, आपके आगे केवल 2 मरीज़ हैं। कृपया डॉक्टर के कमरे के बाहर आ जाएं।`
            : `Attention! Token ${tokenNumber}, only 2 patients ahead. Please wait right outside the doctor's room.`,
      };
    } else if (peopleAhead <= 5 && peopleAhead > 2) {
      return {
        trigger: "5_AHEAD",
        text:
          lang === "hi-IN"
            ? `कृपया ध्यान दें, टोकन ${tokenNumber}, आपके आगे केवल 5 मरीज़ हैं। कृपया ओपीडी एरिया के पास आ जाएं।`
            : `Please note, token ${tokenNumber}, only 5 patients ahead. Please move near the OPD waiting area.`,
      };
    }
  }

  return { trigger: null, text: null };
}

class AnnouncementTracker {
  private lastAnnounced: string = "";
  public announcementLog: string[] = [];

  public evaluate(status: "WAITING" | "CALLED" | "SERVING", peopleAhead: number, tokenNumber: string, lang: "hi-IN" | "en-IN" = "hi-IN") {
    const { trigger, text } = getAnnouncementForMilestone(status, peopleAhead, tokenNumber, "कमरा नंबर 1", lang);
    if (!trigger || !text) return;

    if (trigger === "CALLED" && this.lastAnnounced !== "CALLED") {
      this.lastAnnounced = "CALLED";
      this.announcementLog.push(`[ANNOUNCED: CALLED] ${text}`);
    } else if (trigger === "2_AHEAD") {
      if (this.lastAnnounced !== "2_AHEAD" && this.lastAnnounced !== "CALLED") {
        this.lastAnnounced = "2_AHEAD";
        this.announcementLog.push(`[ANNOUNCED: 2_AHEAD] ${text}`);
      }
    } else if (trigger === "5_AHEAD") {
      if (this.lastAnnounced !== "5_AHEAD" && this.lastAnnounced !== "2_AHEAD" && this.lastAnnounced !== "CALLED") {
        this.lastAnnounced = "5_AHEAD";
        this.announcementLog.push(`[ANNOUNCED: 5_AHEAD] ${text}`);
      }
    }
  }
}

async function runVerification() {
  console.log("=================================================");
  console.log("RUNNING PHASE 3 PROXIMITY ANNOUNCEMENT VALIDATION");
  console.log("=================================================");

  const tracker = new AnnouncementTracker();
  const token = "A-108";

  console.log("\n1. Testing Patient entering queue far behind (10 ahead)...");
  tracker.evaluate("WAITING", 10, token);
  console.log(`Announcements triggered: ${tracker.announcementLog.length}`);
  if ((tracker.announcementLog.length as number) > 0) throw new Error("Should not announce at 10 ahead");

  console.log("\n2. Testing Proximity Milestone: 5 Ahead Trigger in Hindi...");
  tracker.evaluate("WAITING", 5, token, "hi-IN");
  console.log(`Latest announcement: ${tracker.announcementLog[tracker.announcementLog.length - 1]}`);
  if (!tracker.announcementLog[0].includes("केवल 5 मरीज़ हैं")) {
    throw new Error("Milestone 5 ahead failed to trigger correctly");
  }

  console.log("\n3. Testing Anti-Repetition: Polling at 4 ahead (still within 5-ahead tier)...");
  tracker.evaluate("WAITING", 4, token, "hi-IN");
  tracker.evaluate("WAITING", 3, token, "hi-IN");
  console.log(`Total announcements so far: ${tracker.announcementLog.length} (Expected 1)`);
  if (tracker.announcementLog.length !== 1) throw new Error("Spam prevention failed: re-announced inside 5-ahead tier");

  console.log("\n4. Testing Proximity Milestone: 2 Ahead Trigger in Hindi...");
  tracker.evaluate("WAITING", 2, token, "hi-IN");
  console.log(`Latest announcement: ${tracker.announcementLog[tracker.announcementLog.length - 1]}`);
  if (!tracker.announcementLog[1].includes("केवल 2 मरीज़ हैं")) {
    throw new Error("Milestone 2 ahead failed to trigger correctly");
  }

  console.log("\n5. Testing Anti-Repetition: Polling at 1 ahead...");
  tracker.evaluate("WAITING", 1, token, "hi-IN");
  console.log(`Total announcements so far: ${tracker.announcementLog.length} (Expected 2)`);
  if (tracker.announcementLog.length !== 2) throw new Error("Spam prevention failed: re-announced inside 2-ahead tier");

  console.log("\n6. Testing Final Milestone: Called/Serving Trigger in Hindi...");
  tracker.evaluate("CALLED", 0, token, "hi-IN");
  console.log(`Latest announcement: ${tracker.announcementLog[tracker.announcementLog.length - 1]}`);
  if (!tracker.announcementLog[2].includes("आपका नंबर आ गया है")) {
    throw new Error("Milestone CALLED failed to trigger correctly");
  }

  console.log("\n7. Testing Anti-Repetition after Called...");
  tracker.evaluate("CALLED", 0, token, "hi-IN");
  tracker.evaluate("SERVING", 0, token, "hi-IN");
  console.log(`Total announcements so far: ${tracker.announcementLog.length} (Expected 3)`);
  if (tracker.announcementLog.length !== 3) throw new Error("Repeated announcement on CALLED/SERVING");

  console.log("\n8. Testing English voice synthesis formatting...");
  const englishCalled = getAnnouncementForMilestone("CALLED", 0, "B-205", "Counter 3", "en-IN");
  console.log(`English announcement: ${englishCalled.text}`);
  if (!englishCalled.text?.includes("your turn has arrived")) {
    throw new Error("English announcement formatting failed");
  }

  console.log("\n✅ ALL PHASE 3 VOICE PROXIMITY ANNOUNCEMENT TESTS PASSED!");
  console.log("=================================================\n");
}

runVerification().catch((err) => {
  console.error("❌ Phase 3 verification error:", err);
  process.exit(1);
});
