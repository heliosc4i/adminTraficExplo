const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// --- DATABASE CONFIGURATION LOADER ---
const envPath = path.resolve(__dirname, '..', '.env');

// Step 1: Check for .env file. If it doesn't exist, create a template and exit.
if (!fs.existsSync(envPath)) {
    console.warn('\n[AVERTISSEMENT] Fichier .env manquant.');
    const templateContent = [
        '# Configuration de la base de données PostgreSQL',
        '# Veuillez remplacer "your_password_here" par votre mot de passe réel.',
        'DB_HOST=127.0.0.1',
        'DB_USER=postgres',
        'DB_PASSWORD=your_password_here',
        'DB_DATABASE=TraficDB',
        'DB_PORT=5432',
    ].join('\n');

    try {
        fs.writeFileSync(envPath, templateContent);
        console.log(`Un fichier .env modèle a été créé ici : ${envPath}`);
        console.error('\n[ACTION REQUISE] Veuillez éditer le nouveau fichier .env avec vos identifiants de base de données, puis relancez le serveur.');
    } catch (writeErr) {
        console.error(`\n[ERREUR] Impossible de créer le fichier .env. Veuillez vérifier les permissions d'écriture dans le dossier parent.`);
        console.error(writeErr);
    }
    process.exit(1); // Exit so the user can edit the file.
}

// Step 2: If the file exists, read and parse it.
let dbConfig;
try {
    const envFileContent = fs.readFileSync(envPath, 'utf-8');
    const parsedEnv = dotenv.parse(envFileContent);

    dbConfig = {
      host: parsedEnv.DB_HOST,
      user: parsedEnv.DB_USER,
      password: parsedEnv.DB_PASSWORD,
      database: parsedEnv.DB_DATABASE,
      port: parseInt(parsedEnv.DB_PORT, 10),
    };
    
    // Step 3: Validate the configuration.
    if (!dbConfig.host || !dbConfig.user || !dbConfig.password || !dbConfig.database || !dbConfig.port) {
        throw new Error("Une ou plusieurs variables de base de données (DB_HOST, DB_USER, etc.) sont manquantes dans le fichier .env.");
    }
    if (dbConfig.password === 'your_password_here') {
        console.error('\n[ERREUR DE CONFIGURATION]');
        console.error('Le mot de passe dans le fichier .env est toujours celui par défaut ("your_password_here").');
        console.error('Veuillez le remplacer par votre mot de passe PostgreSQL réel.');
        process.exit(1);
    }

} catch (error) {
    console.error('\n[ERREUR FATALE DE CONFIGURATION]');
    console.error('Impossible de lire ou d\'analyser le fichier .env.');
    console.error('Erreur détaillée:', error.message);
    process.exit(1);
}

// Step 4: Create the pool with the explicit configuration.
const pool = new Pool(dbConfig);

// Step 5: Test the connection.
pool.connect((err, client, release) => {
  if (err) {
    console.error('\n[ERREUR DE CONNEXION À LA BASE DE DONNÉES]');
    console.error('La tentative de connexion a échoué. Vérifiez que vos identifiants dans .env sont corrects et que PostgreSQL est en cours d\'exécution.');
    console.error(`  - Hôte     : ${dbConfig.host}`);
    console.error(`  - Port     : ${dbConfig.port}`);
    console.error(`  - Utilisateur: ${dbConfig.user}`);
    console.error(`  - Base de données: ${dbConfig.database}`);
    console.error('  - Mot de passe : [CACHÉ]');
    console.error('\nErreur PostgreSQL détaillée:', err.message);
    process.exit(1);
  }
  if (client) {
    client.release();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};