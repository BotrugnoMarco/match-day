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

# Riavvia Redis
echo "------------------------------------------"
echo "🔄 Riavvio Redis Server..."
sudo systemctl restart redis-server

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
    # Avvia in modalità cluster usando tutti i core disponibili (-i max)
    pm2 start server.js --name match-day -i max
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

# # 3b. Aggiorna Landing Page
# echo "------------------------------------------"
# echo "🏠 Aggiornamento Landing Page..."
# sudo mkdir -p /home/botadmin/botrugno-landing
# sudo cp -r landing-page/* /home/botadmin/botrugno-landing/
# sudo chown -R $USER:$USER /home/botadmin/botrugno-landing
# # Assicura che Nginx possa leggere i file
# sudo chmod -R 755 /home/botadmin/botrugno-landing

# # 4. Riavvio Nginx
# echo "------------------------------------------"
# echo "🔄 Riavvio Nginx..."
# sudo systemctl restart nginx

echo "=========================================="
echo "✅ Deploy completato con successo!"
echo "=========================================="
