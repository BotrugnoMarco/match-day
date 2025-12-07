-- Utenti (Giocatori)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),
    skill_rating DECIMAL(3, 1) DEFAULT 6.0,
    -- Voto medio (es. 6.5)
    role VARCHAR(20) DEFAULT 'player' -- 'admin' or 'player'
);
CREATE TABLE IF NOT EXISTS user_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    sport_type ENUM('soccer', 'volleyball', 'padel', 'tennis') NOT NULL,
    rating DECIMAL(3, 1) DEFAULT 6.0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, sport_type)
);
-- Partite
CREATE TABLE IF NOT EXISTS matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date_time DATETIME NOT NULL,
    location VARCHAR(100),
    sport_type ENUM('soccer', 'volleyball', 'padel', 'tennis') NOT NULL,
    status ENUM('open', 'locked', 'finished', 'voting') DEFAULT 'open',
    winner ENUM('A', 'B', 'Draw'),
    price_total DECIMAL(10, 2),
    -- Costo campo
    max_players INT DEFAULT 10,
    -- Limite giocatori
    creator_id INT,
    FOREIGN KEY (creator_id) REFERENCES users(id)
);
-- Partecipazione (Logistica)
CREATE TABLE IF NOT EXISTS participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT,
    user_id INT,
    team ENUM('A', 'B'),
    status ENUM('confirmed', 'declined', 'maybe', 'waitlist') DEFAULT 'maybe',
    has_paid BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(match_id, user_id) -- Un utente non può iscriversi due volte allo stesso match
);
-- Voti (Gamification)
CREATE TABLE IF NOT EXISTS votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT,
    voter_id INT,
    -- Chi vota
    target_id INT,
    -- Chi viene votato
    rating INT CHECK (
        rating >= 1
        AND rating <= 10
    ),
    tags VARCHAR(255),
    -- Es: "MVP,Muro"
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (voter_id) REFERENCES users(id),
    FOREIGN KEY (target_id) REFERENCES users(id)
);
-- Notifiche
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    -- 'info', 'warning', 'success'
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    related_match_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (related_match_id) REFERENCES matches(id)
);