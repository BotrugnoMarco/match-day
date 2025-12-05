# ⚽🏐 MatchDay - MEVN Stack (Lightweight)

**Project Goal:** WebApp Mobile-First per gestione partite amatoriali (Logistica + Gamification).
**Architecture:** Decoupled Monorepo (o repo separati). Il Backend espone REST API JSON consumate dal Frontend.

## 1. Tech Stack

### Frontend (Client)
- **Framework:** Vue 3 (Vite Setup).
- **UI Framework:** Ionic Vue (per estetica mobile-native e futuro deploy app).
- **State Management:** Vuex 4.
- **Networking:** Axios.

### Backend (Server)
- **Runtime:** Node.js.
- **Framework:** Express.js.
- **Database Client:** mysql2 (con supporto Promises/Async-Await).
- **Auth:** JSON Web Token (JWT).
- **Environment:** dotenv per gestire credenziali DB.

### Database
- **Engine:** MySQL 8.0+.

## 2. Backend Project Structure (Guide for AI)

L'AI deve organizzare i file backend seguendo questo pattern MVC semplificato per mantenere il codice ordinato:

```plaintext
/backend
  /config
    db.js         // Configurazione Pool MySQL (mysql2 promise wrapper)
  /controllers
    authController.js
    matchController.js
    voteController.js
  /routes
    authRoutes.js
    matchRoutes.js
    ...
  /middleware
    authMiddleware.js  // Verifica JWT
  server.js       // Entry point (Express app, CORS, BodyParser)
```

## 3. Database Schema (MySQL)

Copia incolla questo schema per generare il file `init.sql` o le query di creazione tabelle.

```sql
-- Utenti (Giocatori)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),
    skill_rating DECIMAL(3,1) DEFAULT 6.0, -- Voto medio (es. 6.5)
    role VARCHAR(20) DEFAULT 'player' -- 'admin' o 'player'
);

-- Partite
CREATE TABLE matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date_time DATETIME NOT NULL,
    location VARCHAR(100),
    sport_type ENUM('soccer', 'volleyball') NOT NULL,
    status ENUM('open', 'locked', 'finished', 'voting') DEFAULT 'open',
    price_total DECIMAL(10,2) -- Costo campo
);

-- Partecipazione (Logistica)
CREATE TABLE participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT,
    user_id INT,
    team ENUM('A', 'B'),
    status ENUM('confirmed', 'declined', 'maybe') DEFAULT 'maybe',
    has_paid BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(match_id, user_id) -- Un utente non può iscriversi due volte allo stesso match
);

-- Voti (Gamification)
CREATE TABLE votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT,
    voter_id INT, -- Chi vota
    target_id INT, -- Chi viene votato
    rating INT CHECK (rating >= 1 AND rating <= 10),
    tags VARCHAR(255), -- Es: "MVP,Muro"
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (voter_id) REFERENCES users(id),
    FOREIGN KEY (target_id) REFERENCES users(id)
);
```

## 4. Coding Instructions for AI (Node/Express)

Quando scrivi il codice backend:

- **Database Connection:** Usa `mysql2/promise`. Crea un Connection Pool ed esportalo da `config/db.js`.
  - *Esempio:* `const [rows] = await db.query('SELECT * FROM users');`
- **Error Handling:** Usa blocchi `try/catch` nei controller. In caso di errore, ritorna sempre uno status HTTP adeguato (500, 400, 401) e un JSON `{ error: "messaggio" }`.
- **Controllers:** Mantieni la logica snella.
  - *Esempio logica matchController.joinMatch:* Verifica se l'utente è già iscritto -> INSERT in participants -> Ritorna successo.
- **Auth Middleware:** Proteggi le rotte sensibili (es. votazione, creazione match) verificando il Bearer Token nell'header Authorization.

## 5. Coding Instructions for AI (Frontend Vue+Ionic)

Quando scrivi il codice frontend:

- **Ionic Components:** Usa i componenti standard Ionic per layout e interazione (`ion-button`, `ion-card`, `ion-list`, `ion-modal`).
- **Vuex Store:**
  - *Modulo auth:* Gestisce login, token storage (localStorage) e logout.
  - *Modulo matches:* Gestisce array partite, caricamento dati da API.
- **Services Pattern:** Crea una cartella `services/api.js` dove configuri l'istanza Axios base (con baseURL del server Node) e inietti il token automaticamente negli header.

## Prossimo passo pratico

Ora che hai il piano, ecco come ti consiglio di partire per vedere subito qualcosa funzionare:

1. Crea la cartella del progetto.
2. Crea il file `README.md` con il testo qui sopra.
3. Inizia dal Backend (è inutile fare il frontend se non hai dati). Apri il terminale nella cartella server e chiedi a Copilot/Chat:

> "Seguendo il README.md, aiutami a creare il file server.js e la configurazione config/db.js per connettermi a MySQL locale."
