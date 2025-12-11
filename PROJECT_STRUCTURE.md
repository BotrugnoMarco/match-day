# 🏗️ Struttura del Progetto MatchDay

Questo documento fornisce una panoramica dettagliata dell'architettura del codice e dell'organizzazione dei file del progetto MatchDay.

## 📂 Struttura della Root

```text
match-day/
├── backend/                # Codice lato server (Node.js/Express)
├── frontend/               # Codice lato client (Vue 3/Ionic)
├── DEPLOY.md               # Istruzioni per il deploy
├── deploy.sh               # Script di automazione deploy
├── DOCUMENTATION.md        # Documentazione generale funzionale
├── nginx.conf              # Configurazione per il reverse proxy di produzione
├── README.md               # Introduzione al progetto
└── TODO.md                 # Lista delle attività e roadmap
```

---

## 🔙 Backend (`/backend`)

Il backend è costruito con **Node.js** ed **Express**, gestisce l'API REST, la connessione al database MySQL, le notifiche push e la comunicazione in tempo reale via Socket.io.

### File Principali

- **`server.js`**: Punto di ingresso dell'applicazione. Inizializza Express, configura i middleware (CORS, JSON), stabilisce la connessione al DB, avvia il server HTTP e configura **Socket.io** per il real-time.
- **`init.sql`**: Script SQL per la creazione dello schema del database (tabelle Users, Matches, Participants, Votes, Notifications, ecc.).
- **`package.json`**: Dipendenze del backend (express, mysql2, socket.io, firebase-admin, ecc.).

### Directory

- **`config/`**: Configurazioni globali.
  - `db.js`: Gestisce il pool di connessioni al database MySQL.
  - `serviceAccountKey.json`: (Ignorato da git) Credenziali per Firebase Admin SDK.
- **`controllers/`**: Contiene la logica di business. Ogni file gestisce un'entità specifica:
  - `authController.js`: Registrazione, Login, gestione JWT.
  - `matchController.js`: CRUD partite, gestione partecipanti, generazione squadre.
  - `notificationController.js`: Invio notifiche (DB + Socket.io + FCM Push).
  - `userController.js`: Gestione profili, upload avatar, statistiche.
  - `voteController.js`: Gestione votazioni MVP e calcolo rating.
- **`middleware/`**: Funzioni intermedie per le richieste HTTP.
  - `authMiddleware.js`: Verifica il token JWT per proteggere le rotte.
  - `uploadMiddleware.js`: Configurazione Multer per l'upload di immagini.
- **`routes/`**: Definisce gli endpoint API e li collega ai controller.
  - `authRoutes.js`, `matchRoutes.js`, ecc.
- **`uploads/`**: Directory locale per lo storage delle immagini caricate dagli utenti (avatar).

---

## 📱 Frontend (`/frontend`)

Il frontend è una **Single Page Application (SPA)** costruita con **Vue 3**, **Vite** e **Ionic Framework** per un'esperienza mobile-native. Supporta anche funzionalità native tramite **Capacitor**.

### File Principali

- **`index.html`**: Entry point HTML.
- **`vite.config.js`**: Configurazione del bundler Vite (proxy, alias, plugin).
- **`capacitor.config.json`**: Configurazione per il build nativo (iOS/Android).

### Directory Sorgente (`/src`)

#### `views/` (Pagine)

Contiene le schermate principali dell'applicazione:

- **`Home.vue`**: Dashboard principale.
- **`Login.vue` / `Register.vue`**: Autenticazione.
- **`Matches.vue`**: Lista delle partite (filtrabile).
- **`MatchDetails.vue`**: Pagina più complessa. Mostra info partita, mappa, meteo, lista partecipanti, chat (futura), e gestione stato (Join/Leave).
- **`CreateMatch.vue`**: Form per creare una partita con selezione sport, data e mappa.
- **`Profile.vue`**: Profilo utente e statistiche.
- **`Notifications.vue`**: Centro notifiche.

#### `components/` (Componenti Riutilizzabili)

- **`LocationPicker.vue`**: Mappa interattiva (Leaflet) per selezionare il luogo della partita.
- **`VoteModal.vue`**: Modale per votare i giocatori a fine partita.
- **`InviteFriendModal.vue`**: Modale per invitare amici.
- **`FormationField.vue`**: Visualizzazione grafica delle formazioni in campo.

#### `services/` (Logica di Comunicazione)

- **`api.js`**: Istanza Axios configurata con l'URL base del backend e interceptor per iniettare il token JWT.
- **`socket.js`**: Gestione della connessione WebSocket (Socket.io) per aggiornamenti in tempo reale.
- **`firebase.js`**: Inizializzazione Firebase Client, richiesta permessi notifiche e gestione messaggi in arrivo.
- **`weather.js`**: Servizio per interagire con Open-Meteo (Meteo) e Nominatim (Geocoding).

#### `store/` (Stato Globale)

- **`index.js`**: Store Vuex. Gestisce lo stato dell'utente loggato (`currentUser`), il token di autenticazione e lo stato di caricamento globale.

#### `router/` (Navigazione)

- **`index.js`**: Definisce le rotte dell'app (URL -> Componente) e le "Navigation Guards" (es. reindirizza al login se non autenticato).

#### `i18n/` (Internazionalizzazione)

- **`locales/`**: File JSON per le traduzioni (`it.json`, `en.json`).

### Directory Pubblica (`/public`)

- **`firebase-messaging-sw.js`**: Service Worker per gestire le notifiche push di Firebase quando l'app è in background o chiusa (su Web).

---

## 🛠️ Servizi Esterni Integrati

1.  **Database (MySQL)**:
    - Relazionale. Gestisce integrità dei dati, relazioni utenti-partite e storico.
2.  **Real-time (Socket.io)**:
    - Utilizzato per aggiornare l'interfaccia istantaneamente quando: un utente si unisce, una partita cambia stato, arriva una notifica.
    - Configurato con **Redis Adapter** per scalabilità (permette più istanze del backend).
3.  **Notifiche Push (Firebase Cloud Messaging - FCM)**:
    - Permette di inviare notifiche su dispositivi mobili e browser anche ad app chiusa.
    - Supporto ibrido: Web Push API (Browser) + Capacitor Push (Nativo).
4.  **Mappe e Geocoding**:
    - **Leaflet**: Libreria mappe open-source.
    - **OpenStreetMap / Nominatim**: Per visualizzare mappe e convertire coordinate in indirizzi (Reverse Geocoding).
5.  **Meteo (Open-Meteo)**:
    - API gratuita per recuperare previsioni meteo basate su coordinate e data della partita.

## 🔄 Flussi di Dati Principali

### Creazione Partita

1.  Utente compila form in `CreateMatch.vue`.
2.  `LocationPicker` fornisce coordinate e indirizzo (via Nominatim).
3.  POST a `/api/matches`.
4.  Backend salva su MySQL.
5.  Socket.io emette evento `match:created`.
6.  Client aggiornano la lista partite in tempo reale.

### Notifiche

1.  Evento scatenante (es. "Utente X si unisce alla partita").
2.  Backend crea record in tabella `notifications`.
3.  Backend invia evento Socket `notification:new` (per utenti online).
4.  Backend invia Push Notification via FCM (per utenti offline/background).
5.  Service Worker (frontend) intercetta la push e mostra il toast di sistema.
