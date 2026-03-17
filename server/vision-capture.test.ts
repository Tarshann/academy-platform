import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock dependencies before importing the module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

vi.mock("./_core/voiceTranscription", () => ({
  transcribeAudio: vi.fn(),
}));

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

vi.mock("../drizzle/schema", () => ({
  users: { id: "id", firstName: "firstName", lastName: "lastName" },
}));

import { matchAthleteName, loadAthleteRoster, extractFromVoice, extractFromPhoto } from "./vision-capture";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";

const mockInvokeLLM = vi.mocked(invokeLLM);
const mockTranscribe = vi.mocked(transcribeAudio);

// Test roster for fuzzy matching
const TEST_ROSTER = [
  { id: 1, firstName: "Jaylen", lastName: "Williams", fullName: "Jaylen Williams" },
  { id: 2, firstName: "Marcus", lastName: "Johnson", fullName: "Marcus Johnson" },
  { id: 3, firstName: "DeShawn", lastName: "Carter", fullName: "DeShawn Carter" },
];

describe("matchAthleteName", () => {
  it("matches exact first name with high confidence", () => {
    const result = matchAthleteName("Jaylen", TEST_ROSTER);
    expect(result.athleteId).toBe(1);
    expect(result.matchedName).toBe("Jaylen Williams");
    expect(result.confidence).not.toBe("low");
  });

  it("matches full name with high confidence", () => {
    const result = matchAthleteName("Jaylen Williams", TEST_ROSTER);
    expect(result.athleteId).toBe(1);
    expect(result.matchedName).toBe("Jaylen Williams");
    expect(result.confidence).toBe("high");
  });

  it("fuzzy matches partial name", () => {
    const result = matchAthleteName("Jay", TEST_ROSTER);
    // Should match to Jaylen Williams
    expect(result.athleteId).toBe(1);
    expect(result.matchedName).toBe("Jaylen Williams");
  });

  it("returns low confidence for unknown names", () => {
    const result = matchAthleteName("Unknown Kid", TEST_ROSTER);
    expect(result.confidence).toBe("low");
  });

  it("returns athleteId 0 for empty roster", () => {
    const result = matchAthleteName("Jaylen", []);
    expect(result.athleteId).toBe(0);
    expect(result.confidence).toBe("low");
  });
});

describe("extractFromVoice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts structured data from voice transcript", async () => {
    mockTranscribe.mockResolvedValue({
      task: "transcribe" as const,
      language: "en",
      duration: 10,
      text: "Jaylen went 7 for 10 on threes",
      segments: [],
    });

    mockInvokeLLM.mockResolvedValue({
      id: "test",
      created: Date.now(),
      model: "gemini-2.5-flash",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify({
              athletes: [
                {
                  name: "Jaylen",
                  metrics: [
                    {
                      metric: "3-Point Accuracy",
                      category: "skill",
                      value: 70,
                      unit: "%",
                      rawCount: "7/10",
                      confidence: "high",
                    },
                  ],
                  observations: "Left wing, catch-and-shoot",
                },
              ],
              sessionNotes: "3-point shooting drill",
              unparsed: [],
            }),
          },
          finish_reason: "stop",
        },
      ],
    });

    const result = await extractFromVoice("https://example.com/audio.mp4");

    expect(result.athletes).toHaveLength(1);
    expect(result.athletes[0].metrics[0].metric).toBe("3-Point Accuracy");
    expect(result.athletes[0].metrics[0].value).toBe(70);
    expect(result.athletes[0].metrics[0].unit).toBe("%");
    expect(result.athletes[0].metrics[0].rawCount).toBe("7/10");
    expect(result.athletes[0].metrics[0].source).toBe("audio");
    expect(result.rawTranscript).toBe("Jaylen went 7 for 10 on threes");
  });

  it("extracts multiple athletes from voice", async () => {
    mockTranscribe.mockResolvedValue({
      task: "transcribe" as const,
      language: "en",
      duration: 15,
      text: "Jaylen 7 for 10, Marcus 5 for 10",
      segments: [],
    });

    mockInvokeLLM.mockResolvedValue({
      id: "test",
      created: Date.now(),
      model: "gemini-2.5-flash",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify({
              athletes: [
                {
                  name: "Jaylen",
                  metrics: [{ metric: "3-Point Accuracy", category: "skill", value: 70, unit: "%", rawCount: "7/10", confidence: "high" }],
                },
                {
                  name: "Marcus",
                  metrics: [{ metric: "3-Point Accuracy", category: "skill", value: 50, unit: "%", rawCount: "5/10", confidence: "high" }],
                },
              ],
              unparsed: [],
            }),
          },
          finish_reason: "stop",
        },
      ],
    });

    const result = await extractFromVoice("https://example.com/audio.mp4");
    expect(result.athletes).toHaveLength(2);
    expect(result.athletes[0].metrics[0].value).toBe(70);
    expect(result.athletes[1].metrics[0].value).toBe(50);
  });

  it("handles mixed metric types", async () => {
    mockTranscribe.mockResolvedValue({
      task: "transcribe" as const,
      language: "en",
      duration: 12,
      text: "Jaylen 7 for 10 on threes, box jump 24 inches",
      segments: [],
    });

    mockInvokeLLM.mockResolvedValue({
      id: "test",
      created: Date.now(),
      model: "gemini-2.5-flash",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify({
              athletes: [
                {
                  name: "Jaylen",
                  metrics: [
                    { metric: "3-Point Accuracy", category: "skill", value: 70, unit: "%", rawCount: "7/10", confidence: "high" },
                    { metric: "Box Jump Height", category: "power", value: 24, unit: "inches", confidence: "high" },
                  ],
                },
              ],
              unparsed: [],
            }),
          },
          finish_reason: "stop",
        },
      ],
    });

    const result = await extractFromVoice("https://example.com/audio.mp4");
    expect(result.athletes[0].metrics).toHaveLength(2);
    expect(result.athletes[0].metrics[0].category).toBe("skill");
    expect(result.athletes[0].metrics[1].category).toBe("power");
  });

  it("throws on malformed LLM response", async () => {
    mockTranscribe.mockResolvedValue({
      task: "transcribe" as const,
      language: "en",
      duration: 5,
      text: "some audio",
      segments: [],
    });

    mockInvokeLLM.mockResolvedValue({
      id: "test",
      created: Date.now(),
      model: "gemini-2.5-flash",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "This is not JSON at all",
          },
          finish_reason: "stop",
        },
      ],
    });

    await expect(extractFromVoice("https://example.com/audio.mp4")).rejects.toThrow(
      /AI could not extract structured data/
    );
  });

  it("handles empty extraction gracefully", async () => {
    mockTranscribe.mockResolvedValue({
      task: "transcribe" as const,
      language: "en",
      duration: 3,
      text: "just some background noise",
      segments: [],
    });

    mockInvokeLLM.mockResolvedValue({
      id: "test",
      created: Date.now(),
      model: "gemini-2.5-flash",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify({ athletes: [], unparsed: ["just some background noise"] }),
          },
          finish_reason: "stop",
        },
      ],
    });

    const result = await extractFromVoice("https://example.com/audio.mp4");
    expect(result.athletes).toHaveLength(0);
    expect(result.unparsed).toContain("just some background noise");
  });

  it("handles transcription failure", async () => {
    mockTranscribe.mockResolvedValue({
      error: "Failed to download audio file",
      code: "INVALID_FORMAT" as const,
    });

    await expect(extractFromVoice("https://example.com/audio.mp4")).rejects.toThrow(
      /Transcription failed/
    );
  });
});

describe("extractFromPhoto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts metric from photo", async () => {
    mockInvokeLLM.mockResolvedValue({
      id: "test",
      created: Date.now(),
      model: "gemini-2.5-flash",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify({
              athletes: [
                {
                  name: "Unknown",
                  metrics: [
                    { metric: "40-Yard Dash", category: "speed", value: 5.23, unit: "seconds", confidence: "high" },
                  ],
                },
              ],
              sessionNotes: "Stopwatch showing 5.23 seconds",
              unparsed: [],
            }),
          },
          finish_reason: "stop",
        },
      ],
    });

    const result = await extractFromPhoto("https://example.com/stopwatch.jpg");
    expect(result.athletes).toHaveLength(1);
    expect(result.athletes[0].metrics[0].metric).toBe("40-Yard Dash");
    expect(result.athletes[0].metrics[0].value).toBe(5.23);
    expect(result.athletes[0].metrics[0].source).toBe("visual");
  });

  it("throws on malformed LLM response for photo", async () => {
    mockInvokeLLM.mockResolvedValue({
      id: "test",
      created: Date.now(),
      model: "gemini-2.5-flash",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "I cannot read this image",
          },
          finish_reason: "stop",
        },
      ],
    });

    await expect(extractFromPhoto("https://example.com/blurry.jpg")).rejects.toThrow(
      /AI could not extract data from this image/
    );
  });
});
