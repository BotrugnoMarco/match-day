#!/bin/bash

# Script di Deploy per MatchDay
# Esegui questo script sul server per aggiornare l'applicazione

# Interrompi lo script se un comando fallisce
set -e

echo "=========================================="
echo "🚀 Inizio Deploy di MatchDay"
echo "=========================================="

# 1. Scarica le ultime modifiche dal repository
echo "📥 Scaricando il codice aggiornato..."
git pull origin master
# Nota: Se usi un branch diverso da 'master', cambialo qui sopra (es. master)

# 2. Aggiorna il Backend
echo "------------------------------------------"
echo "🛠️  Aggiornamento Backend..."
cd backend
echo "   -> Installazione dipendenze..."
npm install

# Riavvio del servizio backend
# Se usi PM2 (consigliato per produzione):
if command -v pm2 &> /dev/null; then
    echo "   -> Ricreazione processo PM2..."
    # Elimina il vecchio processo se esiste e ne crea uno nuovo
    pm2 delete match-day || true
    pm2 start server.js --name match-day
    pm2 save
else
    echo "⚠️  PM2 non trovato. Ricordati di riavviare il server Node manualmente."
fi
cd ..

# 3. Aggiorna il Frontend
echo "------------------------------------------"
echo "🎨 Aggiornamento Frontend..."
cd frontend
echo "   -> Installazione dipendenze..."
npm install
echo "   -> Build dell'applicazione..."
npm run build
cd ..

# 3b. Aggiorna Landing Page
echo "------------------------------------------"
echo "🏠 Aggiornamento Landing Page..."
sudo mkdir -p /home/botadmin/botrugno-landing
sudo cp -r landing-page/* /home/botadmin/botrugno-landing/
sudo chown -R $USER:$USER /home/botadmin/botrugno-landing

# 4. Aggiorna Nginx
echo "------------------------------------------"
echo "🌐 Aggiornamento Nginx..."

# Percorso assoluto della cartella corrente
CURRENT_DIR=$(pwd)
echo "   -> Cartella progetto rilevata: $CURRENT_DIR"

# Aggiorna il percorso in nginx.conf prima di copiarlo
# Sostituisce qualsiasi percorso in 'root .../frontend/dist' con quello corrente
sed -i "s|root .*/frontend/dist;|root $CURRENT_DIR/frontend/dist;|g" nginx.conf

# Copia la configurazione (richiede sudo)
echo "   -> Configurazione Nginx..."

# Verifica se Nginx è installato
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx non è installato. Installalo con: sudo apt install nginx"
    exit 1
fi

# Copia il file di configurazione
sudo cp nginx.conf /etc/nginx/sites-available/match-day

# Crea il symlink se non esiste
if [ ! -f "/etc/nginx/sites-enabled/match-day" ]; then
    echo "   -> Attivazione sito (creazione symlink)..."
    sudo ln -s /etc/nginx/sites-available/match-day /etc/nginx/sites-enabled/
    # Rimuovi il default se esiste per evitare conflitti
    if [ -f "/etc/nginx/sites-enabled/default" ]; then
        echo "   -> Rimozione sito default..."
        sudo rm /etc/nginx/sites-enabled/default
    fi
fi

echo "   -> Verifica configurazione..."
sudo nginx -t

echo "   -> Riavvio Nginx..."
sudo systemctl restart nginx

# Verifica Firewall (UFW)
if command -v ufw &> /dev/null; then
    echo "   -> Verifica Firewall..."
    sudo ufw allow 'Nginx Full'
fi

echo "=========================================="
echo "✅ Deploy completato con successo!"
echo "=========================================="
