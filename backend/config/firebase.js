const admin = require('firebase-admin');
const path = require('path');

let initialized = false;

try {
    // Cerca il file delle credenziali (scaricato da Firebase Console)
    // Deve essere salvato come backend/config/serviceAccountKey.json
    const serviceAccount = require('./serviceAccountKey.json');

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    initialized = true;
    console.log('✅ Firebase Admin SDK inizializzato');
} catch (error) {
    console.warn('⚠️ Firebase Admin SDK non inizializzato. Assicurati di avere il file serviceAccountKey.json in config/');
    // console.error(error);
}

module.exports = {
    admin,
    initialized
};
