import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mic, Camera, Square, Loader2, Check, X } from "lucide-react";

type CaptureMode = "idle" | "recording" | "uploading" | "processing" | "review";

interface ExtractedMetric {
  metric: string;
  category: string;
  value: number;
  unit: string;
  rawCount?: string;
  confidence: "high" | "medium" | "low";
  source: "audio" | "visual" | "inferred";
}

interface ExtractedAthlete {
  extractedName: string;
  matchedName: string;
  athleteId: number;
  nameConfidence: "high" | "medium" | "low";
  metrics: ExtractedMetric[];
  observations?: string;
}

interface ExtractionData {
  captureId: number;
  athletes: ExtractedAthlete[];
  sessionNotes?: string;
  rawTranscript?: string;
  unparsed?: string[];
  processingTimeMs: number;
}

// Which individual metrics are checked for confirmation
type CheckedMap = Record<string, boolean>; // key: `${athleteIdx}-${metricIdx}`

const CONFIDENCE_COLORS = {
  high: "text-green-600",
  medium: "text-yellow-600",
  low: "text-red-600",
};

const CONFIDENCE_ICONS = {
  high: "🟢",
  medium: "🟡",
  low: "🔴",
};

async function uploadCaptureMedia(
  blob: Blob,
  filename: string,
  token: string
): Promise<{ url: string; mimeType: string }> {
  const formData = new FormData();
  formData.append("file", blob, filename);
  formData.append("token", token);

  const response = await fetch("/api/capture/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error || "Upload failed");
  }

  return response.json();
}

export function VisionCaptureManager() {
  const [mode, setMode] = useState<CaptureMode>("idle");
  const [extraction, setExtraction] = useState<ExtractionData | null>(null);
  const [checked, setChecked] = useState<CheckedMap>({});
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [recordingTime, setRecordingTime] = useState(0);
  const [drillContext, setDrillContext] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: members } = trpc.admin.members.list.useQuery();
  const chatTokenQuery = trpc.auth.chatToken.useQuery(undefined, { staleTime: 5 * 60_000 });
  const { data: recentCaptures, refetch: refetchCaptures } =
    trpc.visionCapture.listRecent.useQuery({ limit: 10 });

  const extractMutation = trpc.visionCapture.extract.useMutation({
    onSuccess: (data) => {
      const result = data as ExtractionData;
      setExtraction(result);
      // Auto-check all metrics
      const checks: CheckedMap = {};
      result.athletes.forEach((a, ai) => {
        a.metrics.forEach((_, mi) => {
          checks[`${ai}-${mi}`] = true;
        });
      });
      setChecked(checks);
      setMode("review");
      refetchCaptures();
    },
    onError: (err) => {
      toast.error(err.message || "Extraction failed");
      setMode("idle");
    },
  });

  const confirmMutation = trpc.visionCapture.confirm.useMutation({
    onSuccess: (data) => {
      const prMsg =
        data.prsDetected > 0
          ? ` ${data.prsDetected} new PR${data.prsDetected > 1 ? "s" : ""} detected!`
          : "";
      toast.success(
        `${data.metricsCreated} metric${data.metricsCreated > 1 ? "s" : ""} saved.${prMsg}`
      );
      setExtraction(null);
      setMode("idle");
      setChecked({});
      refetchCaptures();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save metrics");
    },
  });

  // ── Voice Recording ──

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setMode("uploading");

        try {
          const token = chatTokenQuery.data?.token;
          if (!token) {
            toast.error("Authentication required. Please refresh.");
            setMode("idle");
            return;
          }

          const { url, mimeType } = await uploadCaptureMedia(blob, "voice-capture.webm", token);

          setMode("processing");
          extractMutation.mutate({
            mediaUrl: url,
            mediaType: (mimeType || "audio/webm") as "audio/wav",
            mode: "voice",
            drillContext: drillContext || undefined,
          });
        } catch {
          toast.error("Failed to upload audio");
          setMode("idle");
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => {
          if (t >= 119) {
            stopRecording();
            return t;
          }
          return t + 1;
        });
      }, 1000);
      setMode("recording");
    } catch {
      toast.error("Microphone access denied. Please allow microphone access.");
    }
  }, [drillContext, chatTokenQuery.data?.token]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── Photo Upload ──

  const handlePhotoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setMode("uploading");

      try {
        const token = chatTokenQuery.data?.token;
        if (!token) {
          toast.error("Authentication required. Please refresh.");
          setMode("idle");
          return;
        }

        const { url } = await uploadCaptureMedia(file, file.name, token);

        setMode("processing");
        extractMutation.mutate({
          mediaUrl: url,
          mediaType: file.type as "image/jpeg" | "image/png" | "image/webp",
          mode: "photo",
          drillContext: drillContext || undefined,
        });
      } catch {
        toast.error("Failed to upload image");
        setMode("idle");
      }
    },
    [drillContext, chatTokenQuery.data?.token]
  );

  // ── Review Helpers ──

  const toggleCheck = (key: string) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateAthleteId = (athleteIdx: number, newId: number) => {
    if (!extraction) return;
    const updated = { ...extraction };
    const member = (members as any[])?.find((m: any) => m.id === newId);
    updated.athletes = [...updated.athletes];
    updated.athletes[athleteIdx] = {
      ...updated.athletes[athleteIdx],
      athleteId: newId,
      matchedName: member?.name || updated.athletes[athleteIdx].matchedName,
      nameConfidence: "high",
    };
    setExtraction(updated);
  };

  const updateMetricValue = (
    athleteIdx: number,
    metricIdx: number,
    field: string,
    value: any
  ) => {
    if (!extraction) return;
    const updated = { ...extraction };
    updated.athletes = [...updated.athletes];
    updated.athletes[athleteIdx] = { ...updated.athletes[athleteIdx] };
    updated.athletes[athleteIdx].metrics = [
      ...updated.athletes[athleteIdx].metrics,
    ];
    updated.athletes[athleteIdx].metrics[metricIdx] = {
      ...updated.athletes[athleteIdx].metrics[metricIdx],
      [field]: value,
    };
    setExtraction(updated);
  };

  const handleConfirm = () => {
    if (!extraction) return;

    const metrics: any[] = [];
    extraction.athletes.forEach((athlete, ai) => {
      athlete.metrics.forEach((metric, mi) => {
        if (checked[`${ai}-${mi}`] && athlete.athleteId > 0) {
          metrics.push({
            athleteId: athlete.athleteId,
            metricName: metric.metric,
            category: metric.category,
            value: String(metric.value),
            unit: metric.unit,
            notes: athlete.observations || undefined,
            sessionDate: new Date(sessionDate).toISOString(),
          });
        }
      });
    });

    if (metrics.length === 0) {
      toast.error("No metrics selected for confirmation. Assign athletes and check metrics.");
      return;
    }

    confirmMutation.mutate({
      captureId: extraction.captureId,
      metrics,
      sessionNotes: extraction.sessionNotes,
    });
  };

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── Render ──

  if (mode === "review" && extraction) {
    const totalMetrics = extraction.athletes.reduce(
      (s, a) => s + a.metrics.length,
      0
    );
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              Review — {extraction.athletes.length} Athlete
              {extraction.athletes.length !== 1 ? "s" : ""} Detected
            </h3>
            <p className="text-sm text-muted-foreground">
              {totalMetrics} metric{totalMetrics !== 1 ? "s" : ""} &middot;
              Processed in {(extraction.processingTimeMs / 1000).toFixed(1)}s
              {extraction.rawTranscript && " &middot; Voice Recap"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setExtraction(null);
              setMode("idle");
              setChecked({});
            }}
          >
            Discard
          </Button>
        </div>

        {extraction.rawTranscript && (
          <Card className="bg-muted/30">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground italic">
                "{extraction.rawTranscript}"
              </p>
            </CardContent>
          </Card>
        )}

        {extraction.athletes.map((athlete, ai) => (
          <Card key={ai}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{CONFIDENCE_ICONS[athlete.nameConfidence]}</span>
                  <span className="font-medium">
                    {athlete.nameConfidence === "high"
                      ? athlete.matchedName
                      : `${athlete.extractedName} → ${athlete.matchedName}?`}
                  </span>
                </div>
                <Select
                  value={String(athlete.athleteId || "")}
                  onValueChange={(v) => updateAthleteId(ai, parseInt(v))}
                >
                  <SelectTrigger className="w-48 h-8">
                    <SelectValue placeholder="Assign athlete" />
                  </SelectTrigger>
                  <SelectContent>
                    {(members as any[])?.map((m: any) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {athlete.metrics.map((metric, mi) => {
                const key = `${ai}-${mi}`;
                return (
                  <div
                    key={mi}
                    className="flex items-center gap-2 p-2 rounded bg-muted/20"
                  >
                    <Button
                      variant={checked[key] ? "default" : "outline"}
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => toggleCheck(key)}
                    >
                      {checked[key] ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Input
                          className="h-7 text-sm w-40"
                          value={metric.metric}
                          onChange={(e) =>
                            updateMetricValue(ai, mi, "metric", e.target.value)
                          }
                        />
                        <Input
                          className="h-7 text-sm w-20"
                          type="number"
                          value={metric.value}
                          onChange={(e) =>
                            updateMetricValue(
                              ai,
                              mi,
                              "value",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {metric.unit}
                          {metric.rawCount ? ` (${metric.rawCount})` : ""}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${CONFIDENCE_COLORS[metric.confidence]}`}
                    >
                      {metric.confidence}
                    </Badge>
                  </div>
                );
              })}
              {athlete.observations && (
                <p className="text-xs text-muted-foreground pl-9">
                  📝 {athlete.observations}
                </p>
              )}
            </CardContent>
          </Card>
        ))}

        {extraction.sessionNotes && (
          <Card className="bg-muted/30">
            <CardContent className="p-3">
              <p className="text-sm">💡 {extraction.sessionNotes}</p>
            </CardContent>
          </Card>
        )}

        {extraction.unparsed && extraction.unparsed.length > 0 && (
          <Card className="bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="p-3">
              <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                Could not parse:
              </p>
              {extraction.unparsed.map((u, i) => (
                <p key={i} className="text-xs text-yellow-600 dark:text-yellow-500">
                  • {u}
                </p>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-3">
          <Label>Session Date:</Label>
          <Input
            type="date"
            className="w-40"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSessionDate(new Date().toISOString().slice(0, 10))}
          >
            Today
          </Button>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleConfirm}
            disabled={confirmMutation.isPending || checkedCount === 0}
          >
            {confirmMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Confirm {checkedCount} Metric{checkedCount !== 1 ? "s" : ""}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setExtraction(null);
              setMode("idle");
              setChecked({});
            }}
          >
            Discard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Quick Capture</h2>
        <p className="text-sm text-muted-foreground">
          Record training results in seconds using voice or photo.
        </p>
      </div>

      {/* Capture buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Voice Recap */}
        <Card
          className={`cursor-pointer transition-colors hover:bg-accent/50 ${mode === "recording" ? "ring-2 ring-red-500" : ""}`}
        >
          <CardContent className="p-6 text-center space-y-3">
            {mode === "recording" ? (
              <>
                <div className="h-12 w-12 mx-auto rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center animate-pulse">
                  <Mic className="h-6 w-6 text-red-600" />
                </div>
                <p className="text-2xl font-mono font-bold text-red-600">
                  {formatTime(recordingTime)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Say names and numbers clearly
                </p>
                <Button variant="destructive" size="sm" onClick={stopRecording}>
                  <Square className="h-4 w-4 mr-1" /> Stop
                </Button>
              </>
            ) : (
              <>
                <div className="h-12 w-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                  <Mic className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">Voice Recap</h3>
                <p className="text-xs text-muted-foreground">
                  Speak results after a drill
                </p>
                <Button
                  size="sm"
                  onClick={startRecording}
                  disabled={mode !== "idle"}
                >
                  Start Recording
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Photo Capture */}
        <Card className="cursor-pointer transition-colors hover:bg-accent/50">
          <CardContent className="p-6 text-center space-y-3">
            <div className="h-12 w-12 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Camera className="h-6 w-6" />
            </div>
            <h3 className="font-semibold">Photo Capture</h3>
            <p className="text-xs text-muted-foreground">
              Stopwatch, whiteboard, or measurement
            </p>
            <label>
              <Button size="sm" asChild disabled={mode !== "idle"}>
                <span>Upload Photo</span>
              </Button>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={mode !== "idle"}
              />
            </label>
          </CardContent>
        </Card>
      </div>

      {/* Processing indicator */}
      {(mode === "uploading" || mode === "processing") && (
        <Card>
          <CardContent className="p-6 text-center space-y-3">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
            <p className="text-sm font-medium">
              {mode === "uploading"
                ? "Uploading..."
                : "Analyzing capture..."}
            </p>
            <p className="text-xs text-muted-foreground">
              This may take a few seconds
            </p>
          </CardContent>
        </Card>
      )}

      {/* Drill context */}
      {mode === "idle" && (
        <div className="flex items-center gap-3">
          <Label className="whitespace-nowrap">Drill context:</Label>
          <Input
            placeholder="e.g., 3pt shooting, agility drills"
            className="max-w-xs"
            value={drillContext}
            onChange={(e) => setDrillContext(e.target.value)}
          />
        </div>
      )}

      {/* Recent Captures */}
      {recentCaptures && recentCaptures.length > 0 && mode === "idle" && (
        <div>
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
            Recent Captures
          </h3>
          <div className="space-y-1.5">
            {recentCaptures.map((c: any) => (
              <div
                key={c.id}
                className="flex items-center gap-2 text-sm p-2 rounded bg-muted/20"
              >
                <span>
                  {c.status === "confirmed"
                    ? "✅"
                    : c.status === "failed"
                      ? "❌"
                      : c.status === "ready"
                        ? "🔵"
                        : "⏳"}
                </span>
                <span className="capitalize">{c.mode}</span>
                <span className="text-muted-foreground">•</span>
                <span>
                  {c.athleteCount} athlete{c.athleteCount !== 1 ? "s" : ""}
                </span>
                <span className="text-muted-foreground">•</span>
                <span>
                  {c.metricCount} metric{c.metricCount !== 1 ? "s" : ""}
                </span>
                {c.status === "failed" && c.errorMessage && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-red-500 text-xs truncate max-w-32">
                      {c.errorMessage}
                    </span>
                  </>
                )}
                <span className="text-muted-foreground ml-auto text-xs">
                  {new Date(c.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
