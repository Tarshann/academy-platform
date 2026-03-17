import { logger } from "./_core/logger";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";
import Fuse from "fuse.js";

// ============================================================================
// Types
// ============================================================================

interface RosterAthlete {
  id: number;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
}

export interface ExtractedMetric {
  metric: string;
  category: string;
  value: number;
  unit: string;
  rawCount?: string;
  confidence: "high" | "medium" | "low";
  source: "audio" | "visual" | "inferred";
}

export interface ExtractedAthlete {
  extractedName: string;
  matchedName: string;
  athleteId: number;
  nameConfidence: "high" | "medium" | "low";
  metrics: ExtractedMetric[];
  observations?: string;
}

export interface ExtractionResult {
  athletes: ExtractedAthlete[];
  sessionNotes?: string;
  rawTranscript?: string;
  unparsed?: string[];
}

// ============================================================================
// Known Metrics Map
// ============================================================================

const KNOWN_METRICS: Record<string, { category: string; unit: string }> = {
  "Vertical Jump": { category: "power", unit: "inches" },
  "40-Yard Dash": { category: "speed", unit: "seconds" },
  "Pro Agility": { category: "agility", unit: "seconds" },
  "Broad Jump": { category: "power", unit: "inches" },
  "L-Drill": { category: "agility", unit: "seconds" },
  "3-Cone Drill": { category: "agility", unit: "seconds" },
  "Shuttle Run": { category: "agility", unit: "seconds" },
  "Mile Run": { category: "endurance", unit: "minutes" },
  "Max Push-Ups": { category: "strength", unit: "reps" },
  "Max Pull-Ups": { category: "strength", unit: "reps" },
  "20-Yard Dash": { category: "speed", unit: "seconds" },
  "10-Yard Split": { category: "speed", unit: "seconds" },
  "Layup Accuracy": { category: "skill", unit: "%" },
  "Jumpshot Accuracy": { category: "skill", unit: "%" },
  "3-Point Accuracy": { category: "skill", unit: "%" },
  "Free Throw Accuracy": { category: "skill", unit: "%" },
  "Shooting Drill Score": { category: "skill", unit: "makes" },
  "Ball Handling Grade": { category: "skill", unit: "/10" },
  "Defensive Reads": { category: "skill", unit: "/10" },
  "Box Jump Height": { category: "power", unit: "inches" },
  "Box Jump Reps": { category: "power", unit: "reps" },
  "Jump Rope Count": { category: "endurance", unit: "reps" },
};

// ============================================================================
// Athlete Roster + Fuzzy Matching
// ============================================================================

export async function loadAthleteRoster(): Promise<RosterAthlete[]> {
  const { getDb } = await import("./db");
  const { users } = await import("../drizzle/schema");
  const db = await getDb();
  if (!db) return [];

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
    })
    .from(users);

  return allUsers
    .map((u: { id: number; name: string | null }) => {
      const parts = (u.name || "").trim().split(/\s+/);
      const firstName = parts[0] || null;
      const lastName = parts.length > 1 ? parts.slice(1).join(" ") : null;
      return {
        id: u.id,
        firstName,
        lastName,
        fullName: (u.name || "").trim(),
      };
    })
    .filter((u: RosterAthlete) => u.fullName.length > 0);
}

export function matchAthleteName(
  extractedName: string,
  roster: RosterAthlete[]
): { athleteId: number; matchedName: string; confidence: "high" | "medium" | "low" } {
  if (roster.length === 0) {
    return { athleteId: 0, matchedName: extractedName, confidence: "low" };
  }

  const fuse = new Fuse(roster, {
    keys: [
      { name: "firstName", weight: 0.6 },
      { name: "lastName", weight: 0.3 },
      { name: "fullName", weight: 0.1 },
    ],
    threshold: 0.4,
    includeScore: true,
  });

  const results = fuse.search(extractedName);
  if (results.length === 0) {
    return { athleteId: 0, matchedName: extractedName, confidence: "low" };
  }

  const best = results[0];
  const confidence =
    best.score! < 0.15 ? "high" : best.score! < 0.35 ? "medium" : "low";
  return {
    athleteId: best.item.id,
    matchedName: best.item.fullName,
    confidence,
  };
}

// ============================================================================
// LLM Response Parsing
// ============================================================================

function parseLLMResponse(responseText: string): any {
  const cleaned = responseText
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();
  return JSON.parse(cleaned);
}

function mapExtractedAthletes(
  parsed: any,
  roster: RosterAthlete[],
  source: "audio" | "visual"
): ExtractedAthlete[] {
  return (parsed.athletes || []).map((a: any) => {
    const match = matchAthleteName(a.name, roster);
    return {
      extractedName: a.name,
      matchedName: match.matchedName,
      athleteId: match.athleteId,
      nameConfidence: match.confidence,
      metrics: (a.metrics || []).map((m: any) => {
        const known = KNOWN_METRICS[m.metric];
        return {
          metric: m.metric,
          category: known?.category || m.category || "skill",
          value: Number(m.value),
          unit: known?.unit || m.unit || "",
          rawCount: m.rawCount || undefined,
          confidence: m.confidence || "medium",
          source,
        };
      }),
      observations: a.observations || undefined,
    };
  });
}

// ============================================================================
// Voice Extraction
// ============================================================================

export async function extractFromVoice(audioUrl: string): Promise<ExtractionResult> {
  const startTime = Date.now();

  // Step 1: Transcribe audio
  const transcription = await transcribeAudio({ audioUrl, language: "en" });

  if ("error" in transcription) {
    throw new Error(`Transcription failed: ${transcription.error}`);
  }

  const transcript = transcription.text;
  logger.info("[vision-capture/voice] Transcript:", transcript);

  // Step 2: Load roster for name injection
  const roster = await loadAthleteRoster();
  const rosterNames = roster.map((r) => r.fullName).join(", ");

  // Step 3: Send transcript to LLM for structured extraction
  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: buildVoicePrompt(rosterNames),
      },
      {
        role: "user",
        content: `Transcript from coach after training session:\n\n"${transcript}"`,
      },
    ],
    maxTokens: 2000,
  });

  // Step 4: Parse LLM response
  const choice = result.choices?.[0];
  if (!choice) {
    throw new Error("AI returned no response. Please try again.");
  }

  const responseText =
    typeof choice.message.content === "string"
      ? choice.message.content
      : Array.isArray(choice.message.content)
        ? choice.message.content
            .filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => p.text)
            .join("")
        : "";

  let parsed: any;
  try {
    parsed = parseLLMResponse(responseText);
  } catch {
    logger.error("[vision-capture/voice] Failed to parse LLM response:", responseText);
    throw new Error(
      "AI could not extract structured data from the audio. Try speaking more clearly with athlete names and numbers."
    );
  }

  // Step 5: Fuzzy match athlete names
  const athletes = mapExtractedAthletes(parsed, roster, "audio");

  const processingTime = Date.now() - startTime;
  logger.info(
    `[vision-capture/voice] Extracted ${athletes.length} athletes in ${processingTime}ms`
  );

  return {
    athletes,
    sessionNotes: parsed.sessionNotes || undefined,
    rawTranscript: transcript,
    unparsed: parsed.unparsed || [],
  };
}

// ============================================================================
// Photo Extraction
// ============================================================================

export async function extractFromPhoto(imageUrl: string): Promise<ExtractionResult> {
  const startTime = Date.now();
  const roster = await loadAthleteRoster();
  const rosterNames = roster.map((r) => r.fullName).join(", ");

  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: buildPhotoPrompt(rosterNames),
      },
      {
        role: "user",
        content: [
          {
            type: "image_url" as const,
            image_url: { url: imageUrl, detail: "high" as const },
          },
          {
            type: "text" as const,
            text: "Extract all performance data visible in this image. This is from a youth athletic training session.",
          },
        ],
      },
    ],
    maxTokens: 2000,
  });

  const choice = result.choices?.[0];
  if (!choice) {
    throw new Error("AI returned no response. Please try again.");
  }

  const responseText =
    typeof choice.message.content === "string"
      ? choice.message.content
      : Array.isArray(choice.message.content)
        ? choice.message.content
            .filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => p.text)
            .join("")
        : "";

  let parsed: any;
  try {
    parsed = parseLLMResponse(responseText);
  } catch {
    logger.error("[vision-capture/photo] Failed to parse LLM response:", responseText);
    throw new Error(
      "AI could not extract data from this image. Try a clearer photo of the measurement or numbers."
    );
  }

  const athletes = mapExtractedAthletes(parsed, roster, "visual");

  const processingTime = Date.now() - startTime;
  logger.info(
    `[vision-capture/photo] Extracted ${athletes.length} athletes in ${processingTime}ms`
  );

  return {
    athletes,
    sessionNotes: parsed.sessionNotes || undefined,
    unparsed: parsed.unparsed || [],
  };
}

// ============================================================================
// LLM Prompts
// ============================================================================

function buildVoicePrompt(knownAthleteNames: string): string {
  return `You are parsing a youth basketball coach's voice recap of a training session at The Academy in Gallatin, Tennessee.

The coach is stating athlete names and their performance results after drills. Your job is to extract every athlete-metric pair mentioned.

KNOWN ATHLETES (fuzzy match names to these when possible):
${knownAthleteNames}

KNOWN METRICS (use these exact names when the context matches):
Shooting:
- "went X for Y on threes/3s" → "3-Point Accuracy", value = (X/Y)*100, unit = "%", rawCount = "X/Y"
- "hit X of Y layups" → "Layup Accuracy", value = (X/Y)*100, unit = "%", rawCount = "X/Y"
- "went X for Y" (jumpshots/mid-range) → "Jumpshot Accuracy", value = (X/Y)*100, unit = "%", rawCount = "X/Y"
- "hit X of Y free throws" → "Free Throw Accuracy", value = (X/Y)*100, unit = "%", rawCount = "X/Y"
- "made X shots" (no attempt count) → "Shooting Drill Score", value = X, unit = "makes"

Performance:
- "vertical/vert of X inches" → "Vertical Jump", value = X, unit = "inches"
- "cleared X inches" (box jump context) → "Box Jump Height", value = X, unit = "inches"
- "did X box jumps" → "Box Jump Reps", value = X, unit = "reps"
- "ran a X" (40-yard context) → "40-Yard Dash", value = X, unit = "seconds"
- "did X push-ups/pull-ups" → "Max Push-Ups" or "Max Pull-Ups", value = X, unit = "reps"
- "jumped rope X times" → "Jump Rope Count", value = X, unit = "reps"

Qualitative (no numeric metric — observations only):
- "handle is getting better" → observation, not a metric
- "needs work on left hand" → observation, not a metric

PARSING RULES:
- Handle informal speech: "seven for ten" = 7/10, "went four of eight" = 4/8
- "left hand" / "right hand" → include in observations, not in metric name
- "from the wing" / "from the corner" / "catch and shoot" → include in observations
- If coach says a number without clear context, set confidence to "low"
- NEVER fabricate data. If uncertain, omit the metric.
- For shooting drills, ALWAYS calculate percentage as value and include rawCount

Return ONLY valid JSON with no markdown formatting, no backticks, no preamble:
{
  "athletes": [
    {
      "name": "string (first name or full name as spoken)",
      "metrics": [
        {
          "metric": "string (use preset name from list above)",
          "category": "skill|speed|power|agility|endurance|strength|flexibility",
          "value": number,
          "unit": "string",
          "rawCount": "string (e.g. '7/10' for shooting — include when applicable)",
          "confidence": "high|medium|low"
        }
      ],
      "observations": "string (qualitative notes about this athlete from the coach's comments, if any)"
    }
  ],
  "sessionNotes": "string (any general session-level comments)",
  "unparsed": ["any statements you could not convert to structured data"]
}`;
}

function buildPhotoPrompt(knownAthleteNames: string): string {
  return `You are analyzing a photo from a youth athletic training session at The Academy in Gallatin, Tennessee. Extract all performance data visible.

KNOWN ATHLETES: ${knownAthleteNames}

WHAT YOU MIGHT SEE:
- Stopwatch or timer display → extract the time (e.g., "5.23 seconds")
- Vertical jump measurement strip or Vertec → extract height in inches
- Whiteboard or notebook with handwritten results → extract all name-number pairs
- Measurement tape or device → extract the measurement
- Score sheet or tally marks → extract counts
- Phone screen showing a timing app → extract the displayed time

KNOWN METRICS (use these names):
Speed: "40-Yard Dash", "20-Yard Dash", "10-Yard Split", "Shuttle Run" (unit: seconds)
Power: "Vertical Jump", "Broad Jump", "Box Jump Height" (unit: inches)
Agility: "Pro Agility", "L-Drill", "3-Cone Drill" (unit: seconds)
Strength: "Max Push-Ups", "Max Pull-Ups" (unit: reps)
Skill: "Shooting Drill Score" (unit: makes)

RULES:
- If you see numbers but no athlete names, return the data with name "Unknown" — the coach will assign the athlete.
- If handwriting is illegible, set confidence to "low".
- If you see multiple measurements, extract ALL of them.
- Never guess at numbers you can't read clearly.

Return ONLY valid JSON with no markdown:
{
  "athletes": [
    {
      "name": "string (from whiteboard/notes, or 'Unknown' if not visible)",
      "metrics": [
        {
          "metric": "string (preset name)",
          "category": "string",
          "value": number,
          "unit": "string",
          "confidence": "high|medium|low"
        }
      ]
    }
  ],
  "sessionNotes": "string (description of what's visible in the image)",
  "unparsed": ["anything visible but not extractable as a metric"]
}`;
}
