-- Migration 0024: Seed NCAA March Madness 2026 trivia questions
-- Current tournament knowledge for youth athletes during March Madness

INSERT INTO "triviaQuestions" ("question", "optionA", "optionB", "optionC", "optionD", "correctOption", "category", "difficulty", "pointValue", "isActive")
VALUES
-- EASY: 2026 March Madness Basics
('How many teams are in the NCAA March Madness tournament bracket?', '32', '64', '68', '128', 'c', 'basketball', 'easy', 10, true),
('What is the nickname for the NCAA basketball tournament?', 'The Big Dance', 'March Madness', 'Hoops Mania', 'Both A and B', 'd', 'basketball', 'easy', 10, true),
('In March Madness, what is it called when a lower-seeded team beats a higher-seeded team?', 'A blowout', 'An upset', 'A shutout', 'A sweep', 'b', 'basketball', 'easy', 10, true),
('What are the four groups of teams in the NCAA tournament called?', 'Divisions', 'Regions', 'Conferences', 'Brackets', 'b', 'basketball', 'easy', 10, true),
('What is the name for the final four teams remaining in the NCAA tournament?', 'The Elite Eight', 'The Sweet Sixteen', 'The Final Four', 'The Championship Round', 'c', 'basketball', 'easy', 10, true),

-- MEDIUM: 2026 Tournament — No. 1 Seeds & Results
('Which four teams earned No. 1 seeds in the 2026 NCAA tournament?', 'Duke, Arizona, Michigan, Florida', 'Kansas, UConn, Houston, Purdue', 'Duke, Kansas, Houston, UConn', 'Arizona, Alabama, Tennessee, Florida', 'a', 'basketball', 'medium', 15, true),
('Which team is the No. 1 overall seed in the 2026 NCAA tournament?', 'Arizona', 'Florida', 'Duke', 'Michigan', 'c', 'basketball', 'medium', 15, true),
('Which school won the 2025 NCAA basketball championship (the defending champ in 2026)?', 'UConn', 'Florida', 'Duke', 'Houston', 'b', 'basketball', 'medium', 15, true),
('In the 2026 tournament, No. 12 seed High Point pulled off an upset by beating which No. 5 seed?', 'Marquette', 'Wisconsin', 'Clemson', 'Michigan State', 'b', 'basketball', 'medium', 15, true),
('No. 11 seed VCU came back from a 19-point deficit to beat which powerhouse in overtime?', 'Duke', 'Kansas', 'North Carolina', 'Kentucky', 'c', 'basketball', 'medium', 15, true),

-- MEDIUM: 2026 Players & Performances
('Which Duke star is widely considered the best player in college basketball in 2026?', 'Cooper Flagg', 'Cameron Boozer', 'Zion Williamson', 'Paolo Banchero', 'b', 'basketball', 'medium', 15, true),
('Kansas freshman Darryn Peterson scored how many points to lead his team past Cal Baptist in the 2026 tournament?', '18', '22', '28', '35', 'c', 'basketball', 'medium', 15, true),
('Purdue''s Braden Smith is on the verge of breaking whose all-time NCAA assists record?', 'Magic Johnson', 'Jason Kidd', 'Bobby Hurley', 'Steve Nash', 'c', 'basketball', 'medium', 15, true),
('Which No. 1 seed scored 114 points in their first-round game against Prairie View A&M?', 'Duke', 'Michigan', 'Florida', 'Arizona', 'c', 'basketball', 'medium', 15, true),
('Which No. 4 seed earned their first-ever NCAA tournament win in 2026?', 'Nebraska', 'Arkansas', 'Alabama', 'Maryland', 'a', 'basketball', 'medium', 15, true),

-- HARD: 2026 Tournament Deep Cuts
('No. 2 seed Houston advanced to the Sweet 16 for how many straight tournaments in 2026?', 'Three', 'Five', 'Seven', 'Four', 'c', 'basketball', 'hard', 20, true),
('Which No. 11 seed won three games in five days — including beating No. 3 Gonzaga — to reach the Sweet 16 in 2026?', 'VCU', 'Texas', 'Drake', 'New Mexico', 'b', 'basketball', 'hard', 20, true),
('Where is the 2026 Final Four being held?', 'NRG Stadium, Houston', 'Lucas Oil Stadium, Indianapolis', 'AT&T Stadium, Arlington', 'Caesars Superdome, New Orleans', 'b', 'basketball', 'hard', 20, true),
('Arizona''s Koa Peat scored 21 points in the Big 12 championship game against which opponent?', 'Kansas', 'Iowa State', 'Houston', 'Texas Tech', 'c', 'basketball', 'hard', 20, true),
('What was Duke''s overall record when they earned the No. 1 overall seed in 2026?', '30-3', '31-2', '32-2', '33-1', 'c', 'basketball', 'hard', 20, true),

-- MEDIUM: General March Madness Knowledge
('What does "Cinderella team" mean in March Madness?', 'A team with the best uniforms', 'An underdog team that goes on a surprising run', 'The team that hosts the Final Four', 'A team that has never been in the tournament', 'b', 'basketball', 'medium', 15, true),
('How many rounds does it take to go from 64 teams to a champion in March Madness?', '4', '5', '6', '7', 'c', 'basketball', 'medium', 15, true),
('What is a "bracket buster" in March Madness?', 'A team that breaks the backboard', 'An unexpected result that ruins predictions', 'A player who scores 50 points', 'A game that goes to triple overtime', 'b', 'basketball', 'medium', 15, true),
('In March Madness seeding, which seed is considered the best?', 'No. 16', 'No. 4', 'No. 1', 'No. 8', 'c', 'basketball', 'easy', 10, true),
('What is the "Selection Sunday" in college basketball?', 'The day players are drafted', 'The day the tournament bracket is revealed', 'The day coaches pick their starting lineup', 'The first day of the tournament', 'b', 'basketball', 'medium', 15, true)
ON CONFLICT DO NOTHING;
