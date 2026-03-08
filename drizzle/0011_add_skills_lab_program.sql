-- Add Skills Lab program to programs table (if not already present)
INSERT INTO "programs" ("name", "slug", "description", "price", "category", "ageMin", "ageMax", "maxParticipants", "isActive", "createdAt", "updatedAt")
SELECT 'Academy Skills Lab', 'skills-lab-dropin', 'Drop-in session for fundamentals, movement warmups, skill stations, and competitive games. All ages welcome. No commitment required.', 10.00, 'group', 5, 18, NULL, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "programs" WHERE "slug" = 'skills-lab-dropin');
