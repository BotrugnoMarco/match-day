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
    echo "   -> Riavvio processo PM2..."
    # Sostituisci 'match-day' con il nome o ID del tuo processo PM2 se diverso
    # Se non hai ancora avviato il processo, usa: pm2 start index.js --name match-day
    pm2 restart match-day || pm2 restart index.js || echo "⚠️ Impossibile riavviare PM2 automaticamente. Verifica il nome del processo."
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

# 4. Aggiorna Nginx
echo "------------------------------------------"
echo "🌐 Aggiornamento Nginx..."

# Percorso assoluto della cartella corrente
CURRENT_DIR=$(pwd)
echo "   -> Cartella progetto rilevata: $CURRENT_DIR"

# Aggiorna il percorso in nginx.conf prima di copiarlo
# Sostituisce qualsiasi percorso in 'alias .../frontend/dist' con quello corrente
sed -i "s|alias .*/frontend/dist;|alias $CURRENT_DIR/frontend/dist;|g" nginx.conf

# Copia la configurazione (richiede sudo)
if [ -f "/etc/nginx/sites-available/match-day" ]; then
    echo "   -> Aggiornamento file di configurazione..."
    sudo cp nginx.conf /etc/nginx/sites-available/match-day
    
    echo "   -> Verifica configurazione..."
    sudo nginx -t
    
    echo "   -> Riavvio Nginx..."
    sudo systemctl restart nginx
else
    echo "⚠️  File /etc/nginx/sites-available/match-day non trovato. Configurazione Nginx saltata."
fi

echo "=========================================="
echo "✅ Deploy completato con successo!"
echo "=========================================="
