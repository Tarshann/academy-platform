-- Deactivate the duplicate "Skills Lab" program, keeping "Academy Skills Lab"
-- This addresses the iOS app showing both entries on the Programs page.
UPDATE programs SET "isActive" = false WHERE name = 'Skills Lab';
