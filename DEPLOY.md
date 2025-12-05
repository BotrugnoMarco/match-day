# 🚀 Guida al Deploy su Server (Ubuntu/Linux)

Questa guida ti accompagnerà passo dopo passo nel deploy dell'applicazione **MatchDay** (MEVN Stack) su un server Linux (es. VPS Ubuntu).

## 📋 Prerequisiti

Assicurati che il tuo server abbia installato:

- **Node.js** (v18+ raccomandato)
- **MySQL Server** (v8.0+)
- **Nginx** (Web Server & Reverse Proxy)
- **Git**
- **PM2** (Process Manager per Node.js)

```bash
# Installazione rapida su Ubuntu
sudo apt update
sudo apt install mysql-server nginx git -y
curl -fsSL https://deb.nodesource.com/setup_current.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

---

## 1. Setup del Database (MySQL)

Accedi a MySQL e crea il database e l'utente.

```bash
sudo mysql -u root -p
```

```sql
-- Dentro la shell MySQL
CREATE DATABASE match_day;
CREATE USER 'matchdayuser'@'localhost' IDENTIFIED BY 'Utopia39!';
GRANT ALL PRIVILEGES ON match_day.* TO 'matchdayuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Importa lo schema iniziale:

```bash
# Dalla root del progetto
mysql -u matchdayuser -p match_day < backend/init.sql
```

---

## 2. Deploy del Backend (Node.js/Express)

1.  **Copia i file sul server** (es. tramite `git clone` in `/var/www/match-day`).
2.  **Installa le dipendenze**:

    ```bash
    cd /var/www/match-day/backend
    npm install
    ```

3.  **Configura l'ambiente**:
    Crea il file `.env` copiando l'esempio o creandolo da zero.

    ```bash
    nano .env
    ```

    ```env
    PORT=3000
    DB_HOST=localhost
    DB_USER=matchdayuser
    DB_PASSWORD=LaTuaPasswordSicura
    DB_NAME=match_day
    JWT_SECRET=e9f8c1b2a3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
    ```

4.  **Avvia con PM2**:
    PM2 manterrà l'app attiva e la riavvierà in caso di crash.

    ```bash
    pm2 start server.js --name "match-day"
    pm2 save
    pm2 startup
    ```

---

## 3. Deploy del Frontend (Vue 3 + Vite)

1.  **Configura l'URL dell'API**:
    Prima di buildare, assicurati che il frontend punti all'URL corretto del backend (o al path relativo se usi Nginx come proxy).
    Modifica `frontend/src/services/api.js`:

    ```javascript
    // Se usi Nginx reverse proxy (consigliato)
    baseURL: '/api',

    // OPPURE se il backend è su un dominio/porta separata
    // baseURL: 'http://tuo-ip-server:3000/api',
    ```

2.  **Build del progetto**:

    ```bash
    cd /var/www/match-day/frontend
    npm install
    npm run build
    ```

    Questo creerà una cartella `dist` con i file statici ottimizzati.

---

## 4. Configurazione Nginx (Reverse Proxy)

Configura Nginx per servire il frontend statico e girare le richieste API al backend Node.js.

Crea un file di configurazione:

```bash
sudo nano /etc/nginx/sites-available/match-day
```

Incolla la seguente configurazione (sostituisci `tuo-dominio.com` o l'IP del server):

```nginx
server {
    listen 80;
    server_name tuo-dominio.com; # O l'IP del server

    root /var/www/match-day/frontend/dist;
    index index.html;

    # Frontend (SPA Support)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API Reverse Proxy
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Attiva il sito e riavvia Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/match-day /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## ✅ Verifica

1.  Apri il browser e vai su `http://tuo-dominio.com`.
2.  Dovresti vedere la pagina di Login/Home.
3.  Prova a registrarti: la richiesta dovrebbe andare a `/api/auth/register` ed essere gestita correttamente dal backend.

## 🔄 Aggiornamenti Futuri

Per aggiornare l'app:

```bash
# 1. Scarica le modifiche
git pull

# 2. Backend
cd backend
npm install
pm2 restart match-day

# 3. Frontend
cd ../frontend
npm install
npm run build
```
