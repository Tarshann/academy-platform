-- Migration 0018: Seed basketball trivia questions
-- Basketball knowledge-building questions for youth athletes (gamified learning)

INSERT INTO "triviaQuestions" ("question", "optionA", "optionB", "optionC", "optionD", "correctOption", "category", "difficulty", "pointValue", "isActive")
VALUES
-- EASY: Basketball Basics
('What is the standard height of an NBA basketball hoop?', '9 feet', '10 feet', '11 feet', '12 feet', 'b', 'basketball', 'easy', 10, true),
('How many players from one team are on the court at a time?', '4', '5', '6', '7', 'b', 'basketball', 'easy', 10, true),
('What is it called when you move with the ball without dribbling?', 'Carrying', 'Traveling', 'Double dribble', 'Palming', 'b', 'basketball', 'easy', 10, true),
('How many points is a free throw worth?', '1 point', '2 points', '3 points', 'It varies', 'a', 'basketball', 'easy', 10, true),
('What is the name of the line you shoot free throws from?', 'Half court line', 'Free throw line', 'Baseline', 'Three-point line', 'b', 'basketball', 'easy', 10, true),
('What does ''dribbling'' mean in basketball?', 'Passing the ball', 'Bouncing the ball while moving', 'Shooting the ball', 'Blocking a shot', 'b', 'basketball', 'easy', 10, true),
('Which line is furthest from the basket on a basketball court?', 'Free throw line', 'Three-point line', 'Half court line', 'Baseline', 'c', 'basketball', 'easy', 10, true),
('What is a ''rebound'' in basketball?', 'A stolen ball', 'Catching a missed shot', 'A fast break', 'A timeout', 'b', 'basketball', 'easy', 10, true),
('What happens when a player commits 5 fouls in a game (high school/college)?', 'Free throws for the other team', 'They are fouled out', 'A warning is given', 'The team loses a point', 'b', 'basketball', 'easy', 10, true),
('How many quarters are in a standard basketball game?', '2', '3', '4', '5', 'c', 'basketball', 'easy', 10, true),

-- MEDIUM: Skills & Strategy
('What is a ''pick and roll''?', 'A defensive play', 'When a player sets a screen then rolls to the basket', 'A fast break strategy', 'A type of free throw', 'b', 'basketball', 'medium', 15, true),
('What is the ''triple threat'' position?', 'When a player can shoot, pass, or dribble', 'When three players guard one', 'A three-pointer attempt', 'A triple double stat line', 'a', 'basketball', 'medium', 15, true),
('What does ''boxing out'' mean?', 'Fighting in basketball', 'Positioning your body to get a rebound', 'Guarding the three-point line', 'A fast break defense', 'b', 'basketball', 'medium', 15, true),
('What is a ''crossover'' dribble?', 'Switching the ball from one hand to the other in front of you', 'Dribbling between your legs', 'Spinning while dribbling', 'Passing behind your back', 'a', 'basketball', 'medium', 15, true),
('What is a ''double-double'' in basketball?', 'Scoring double digits in 2 stat categories', 'Scoring 22 points', 'Getting 2 blocks and 2 steals', 'Making 2 three-pointers', 'a', 'basketball', 'medium', 15, true),
('What is the purpose of a ''pump fake''?', 'To pass the ball quickly', 'To fake a shot and get the defender in the air', 'To call a timeout', 'To request a substitution', 'b', 'basketball', 'medium', 15, true),
('What is a ''fast break''?', 'A foul during a breakaway', 'Quickly pushing the ball up court before the defense sets up', 'A timeout during the game', 'A half-court shot', 'b', 'basketball', 'medium', 15, true),
('In a zone defense, players guard:', 'A specific opponent', 'An area of the court', 'Only the paint', 'Only the three-point line', 'b', 'basketball', 'medium', 15, true),
('What is the ''key'' or ''paint'' on a basketball court?', 'The three-point area', 'The rectangular area near the basket', 'The half-court circle', 'The bench area', 'b', 'basketball', 'medium', 15, true),
('What is an ''and-one'' in basketball?', 'A bonus free throw after making a basket while being fouled', 'Scoring one extra point', 'A one-on-one drill', 'A type of defense', 'a', 'basketball', 'medium', 15, true),

-- MEDIUM: Basketball IQ & Rules
('How long does a team have to advance the ball past half court?', '5 seconds', '8 seconds', '10 seconds', '15 seconds', 'c', 'basketball', 'medium', 15, true),
('What is a ''charge'' in basketball?', 'An offensive foul for running into a set defender', 'A fast break play', 'A type of timeout', 'A defensive foul', 'a', 'basketball', 'medium', 15, true),
('What does ''spacing'' mean on offense?', 'Taking breaks between plays', 'Spreading players out to create driving lanes and open shots', 'Standing close together', 'Running fast', 'b', 'basketball', 'medium', 15, true),
('What is the ''weak side'' of the court?', 'The side with fewer players', 'The side away from the ball', 'The defensive end', 'The bench side', 'b', 'basketball', 'medium', 15, true),
('What is a ''screen'' or ''pick'' in basketball?', 'A defensive steal', 'Standing still to block a defender''s path', 'A type of shot', 'A passing technique', 'b', 'basketball', 'medium', 15, true),

-- HARD: Advanced Basketball Knowledge
('What is a ''euro step''?', 'A step-back three pointer', 'A two-step layup where you change direction mid-air', 'A European style free throw', 'A defensive slide drill', 'b', 'basketball', 'hard', 20, true),
('What is ''help-side defense''?', 'When a coach helps with defense', 'Positioning away from your man to help stop drives to the basket', 'A full-court press', 'Guarding two players at once', 'b', 'basketball', 'hard', 20, true),
('What does ''reading the defense'' mean?', 'Studying the playbook', 'Analyzing the defense to make the best offensive decision', 'Watching game film', 'Counting defensive players', 'b', 'basketball', 'hard', 20, true),
('What is a ''high post'' vs ''low post'' position?', 'Standing vs sitting', 'Near the free throw line vs near the basket block', 'Above the rim vs below it', 'First half vs second half', 'b', 'basketball', 'hard', 20, true),
('What is the ''shot clock'' designed to prevent?', 'Too many shots', 'Teams stalling and not attempting to score', 'Players arguing with refs', 'Too many substitutions', 'b', 'basketball', 'hard', 20, true),

-- EASY: Fitness & Training
('Why is stretching before basketball important?', 'It makes you taller', 'It helps prevent injuries and improves flexibility', 'It makes you faster immediately', 'It is not important', 'b', 'general', 'easy', 10, true),
('What should you drink to stay hydrated during a game?', 'Soda', 'Water', 'Coffee', 'Juice only', 'b', 'general', 'easy', 10, true),
('How many hours of sleep do teen athletes need per night?', '4-5 hours', '6-7 hours', '8-10 hours', '12+ hours', 'c', 'general', 'easy', 10, true),
('What is the best way to improve your basketball shooting?', 'Watch videos only', 'Consistent practice with proper form', 'Play video games', 'Just play games, no practice', 'b', 'general', 'easy', 10, true),
('What does ''good sportsmanship'' include?', 'Arguing every call', 'Respecting opponents, officials, and teammates', 'Only celebrating your own success', 'Ignoring your coach', 'b', 'general', 'easy', 10, true),

-- MEDIUM: Basketball History & Culture
('Who is known as the greatest basketball player of all time by many fans?', 'LeBron James', 'Michael Jordan', 'Kobe Bryant', 'Stephen Curry', 'b', 'basketball', 'medium', 15, true),
('What does NBA stand for?', 'National Ball Association', 'National Basketball Association', 'North Basketball Alliance', 'National Basketball Academy', 'b', 'basketball', 'medium', 15, true),
('Which NBA team has won the most championships?', 'Chicago Bulls', 'Los Angeles Lakers', 'Boston Celtics', 'Golden State Warriors', 'c', 'basketball', 'medium', 15, true),
('What year was basketball invented?', '1850', '1891', '1920', '1945', 'b', 'basketball', 'medium', 15, true),
('Who invented the game of basketball?', 'Michael Jordan', 'James Naismith', 'LeBron James', 'Wilt Chamberlain', 'b', 'basketball', 'medium', 15, true)
ON CONFLICT DO NOTHING;
