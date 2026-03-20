-- Performance indexes for high-query columns
-- Targets: chat, DM, attendance, metrics, registrations, notifications, leads, push, games

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created ON "chatMessages" ("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation ON "dmMessages" ("conversationId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_dm_messages_user ON "dmMessages" ("userId");
CREATE INDEX IF NOT EXISTS idx_attendance_schedule ON "attendanceRecords" ("scheduleId");
CREATE INDEX IF NOT EXISTS idx_attendance_user ON "attendanceRecords" ("userId");
CREATE INDEX IF NOT EXISTS idx_metrics_athlete ON "athleteMetrics" ("athleteId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_session_registrations_schedule ON "sessionRegistrations" ("scheduleId");
CREATE INDEX IF NOT EXISTS idx_notification_logs_user ON "notificationLogs" ("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON "leads" ("email");
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON "pushSubscriptions" ("userId");
CREATE INDEX IF NOT EXISTS idx_game_entries_user ON "gameEntries" ("userId", "createdAt" DESC);
