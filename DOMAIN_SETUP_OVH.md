# 🌐 Configurazione Dominio su OVHcloud per MatchDay

Hai acquistato il dominio **botrugno.dev** su OVHcloud. Ottimo!
Ora devi configurare un **sottodominio** (es. `matchday.botrugno.dev`) che punti al tuo server VPS.

Ecco i passaggi da seguire nel pannello di controllo di OVH:

## 1. Accedi alla Zona DNS

1. Fai login su [OVHcloud Manager](https://www.ovh.com/manager/).
2. Vai nella sezione **Web Cloud** (in alto).
3. Nel menu a sinistra, clicca su **Domini** e seleziona `botrugno.dev`.
4. Clicca sulla tab **Zona DNS**.

## 2. Aggiungi un Record A per il Sottodominio

Devi dire a OVH che `matchday.botrugno.dev` corrisponde all'indirizzo IP del tuo server (`137.74.43.136`).

1. Clicca sul pulsante **Aggiungi un'entrata** (a destra).
2. Seleziona **Record A**.
3. Compila i campi come segue:
   - **Sottodominio**: `matchday`
   - **TTL**: Lascia il default (es. 3600)
   - **Target (o Destinazione)**: `137.74.43.136`
4. Clicca su **Avanti** e poi **Conferma**.

_(Attendi qualche minuto/ora affinché la modifica si propaghi in tutto il mondo)._

---

## 3. Aggiorna il Server (Nginx)

Ho già preparato i file di configurazione nel progetto per accettare questo sottodominio.

1. **Invia le modifiche al server**:

   ```bash
   git add .
   git commit -m "Configurazione sottodominio matchday.botrugno.dev"
   git push origin master
   ```

2. **Esegui il Deploy**:
   Collegati al server ed esegui lo script di aggiornamento:
   ```bash
   ssh botadmin@137.74.43.136
   cd match-day
   ./deploy.sh
   ```

## 4. Attiva HTTPS (SSL)

Una volta che il deploy è finito e il DNS è propagato (puoi verificare andando su `http://matchday.botrugno.dev`), rendi il sito sicuro:

```bash
# Esegui questo comando SUL SERVER (via SSH)
sudo certbot --nginx -d matchday.botrugno.dev
```

Se ti chiede di reindirizzare HTTP su HTTPS, scegli **2 (Redirect)**.

🎉 **Fatto!** Il tuo sito sarà raggiungibile su `https://matchday.botrugno.dev`.
