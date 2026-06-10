// The dotenv configuration is now handled directly in db.js to ensure correct loading order.

// --- DEPENDENCY CHECK ---
// Ensures all required modules are installed.
try {
    require('express');
    require('cors');
    require('pg');
    require('bcrypt');
} catch (e) {
    console.error(`\n[ERREUR] Un ou plusieurs modules sont manquants.`);
    console.error(`Veuillez exécuter la commande suivante dans le dossier 'backend' pour installer les dépendances :\n`);
    console.error(`npm install\n`);
    process.exit(1);
}

const express = require('express');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = 3001;
const SALT_ROUNDS = 10;
const TIMEZONE = 'Africa/Douala'; // Central Africa Time

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- API ROUTES ---
const apiRouter = express.Router();

// Health check route
apiRouter.get('/', (req, res) => {
  res.json({ message: "Le serveur API est en ligne et fonctionnel." });
});

// --- AUTH ---
apiRouter.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Nom d'utilisateur et mot de passe requis." });
  }
  try {
    const result = await db.query('SELECT * FROM public.users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Nom d'utilisateur ou mot de passe incorrect." });
    }
    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Nom d'utilisateur ou mot de passe incorrect." });
    }
    
    // Find the user's zone if they are a commander
    const zoneResult = await db.query('SELECT zone_id FROM public.zones WHERE zone_commander_id = $1', [user.user_id]);
    const zoneId = zoneResult.rows.length > 0 ? zoneResult.rows[0].zone_id.toString() : undefined;

    // Map DB columns to frontend User interface
    const userForFrontend = {
        id: user.hel_mat,
        username: user.username,
        name: user.noms,
        email: user.email,
        role: user.role_uti === 'SUPERADMIN' ? 'SUPER_ADMIN' : 'COMZONE',
        zoneId: zoneId,
        grade: user.grade,
    };
    res.json(userForFrontend);
  } catch (err) {
    console.error("Erreur lors de la connexion:", err);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
});

// --- DATA FETCHING ---
apiRouter.get('/initial-data', async (req, res) => {
    const results = { users: [], zones: [], stations: [], stats: [] };

    try {
        const usersResult = await db.query(`
            SELECT u.user_id, u.username, u.hel_mat, u.noms, u.email, u.role_uti, u.grade, z.zone_id
            FROM public.users u
            LEFT JOIN public.zones z ON u.user_id = z.zone_commander_id
        `);
        results.users = usersResult.rows.map(u => ({
            id: u.hel_mat,
            username: u.username,
            name: u.noms,
            email: u.email,
            role: u.role_uti === 'SUPERADMIN' ? 'SUPER_ADMIN' : 'COMZONE',
            grade: u.grade,
            zoneId: u.zone_id ? u.zone_id.toString() : undefined,
        }));
    } catch (err) {
        console.error("Erreur lors de la récupération des utilisateurs:", err.message);
    }
   
    try {
        const zonesResult = await db.query('SELECT zone_id, zone_name, COALESCE(is_trash, FALSE) as is_trash FROM public.zones');
        results.zones = zonesResult.rows.map(z => ({
            id: z.zone_id.toString(),
            name: z.zone_name,
            isTrash: z.is_trash,
        }));
    } catch (err) {
        console.error("Erreur lors de la récupération des zones:", err.message);
    }
   
    try {
        const stationsResult = await db.query('SELECT station_id, station_name, zone_id, COALESCE(is_deleted, FALSE) as is_deleted FROM public.stations');
        results.stations = stationsResult.rows.map(s => ({
            id: s.station_id.toString(),
            name: s.station_name,
            zoneId: s.zone_id.toString(),
            isDeleted: s.is_deleted,
        }));
    } catch (err) {
        console.error("Erreur lors de la récupération des stations:", err.message);
    }

    try {
        const statsQuery = `
            SELECT
                s.id,
                TO_CHAR(s.date AT TIME ZONE $1, 'YYYY-MM-DD') as date,
                s.messages_received,
                s.messages_sent,
                s.station_id,
                st.zone_id
            FROM public.message_statistics s
            JOIN public.stations st ON s.station_id = st.station_id AND COALESCE(st.is_deleted, FALSE) = FALSE
        `;
        const statsResult = await db.query(statsQuery, [TIMEZONE]);
        results.stats = statsResult.rows.map(s => ({
            id: s.id.toString(),
            date: s.date,
            messagesReceived: s.messages_received,
            messagesSent: s.messages_sent,
            stationId: s.station_id.toString(),
            zoneId: s.zone_id.toString(),
        }));
    } catch (err) {
        console.error("Erreur lors de la récupération des statistiques:", err.message);
    }
    
    res.json(results);
});

apiRouter.get('/zones', async (req, res) => {
    try {
        const zonesResult = await db.query('SELECT zone_id, zone_name, COALESCE(is_trash, FALSE) as is_trash FROM public.zones');
        res.json(zonesResult.rows.map(z => ({
            id: z.zone_id.toString(),
            name: z.zone_name,
            isTrash: z.is_trash,
        })));
    } catch (err) {
        console.error("Erreur lors de la récupération des zones:", err.message);
        res.status(500).json({ message: "Erreur interne du serveur" });
    }
});


// --- USERS API ---
apiRouter.post('/users', async (req, res) => {
    const { id, username, name, email, role, password, zoneId, grade } = req.body;
    if (!id || !username || !name || !email || !role || !password) {
        return res.status(400).json({ message: "Champs manquants pour la création de l'utilisateur." });
    }
    try {
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const dbRole = role === 'SUPER_ADMIN' ? 'SUPERADMIN' : 'COMZONE';
        
        const result = await db.query(
            `INSERT INTO public.users (hel_mat, username, noms, email, role_uti, password_hash, grade) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING user_id, hel_mat, username, noms, email, role_uti, grade`,
            [id, username, name, email, dbRole, passwordHash, grade]
        );
        const newUser = result.rows[0];

        if (dbRole === 'COMZONE' && zoneId) {
            await db.query('UPDATE public.zones SET zone_commander_id = $1 WHERE zone_id = $2', [newUser.user_id, zoneId]);
        }
        
        res.status(201).json({
            id: newUser.hel_mat,
            username: newUser.username,
            name: newUser.noms,
            email: newUser.email,
            role: newUser.role_uti === 'SUPERADMIN' ? 'SUPER_ADMIN' : 'COMZONE',
            grade: newUser.grade,
            zoneId: zoneId ? zoneId.toString() : undefined,
        });
    } catch (err) {
        console.error("Erreur lors de l'ajout de l'utilisateur:", err);
        res.status(500).json({ message: "Erreur serveur: " + err.message });
    }
});

apiRouter.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, username, email, role, zoneId, grade, password } = req.body;
    try {
        const userResult = await db.query('SELECT user_id FROM public.users WHERE hel_mat = $1', [id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        const userId = userResult.rows[0].user_id;
        const dbRole = role === 'SUPER_ADMIN' ? 'SUPERADMIN' : 'COMZONE';

        // Start transaction
        await db.query('BEGIN');
        
        // Update user details
        const updateQuery = `UPDATE public.users SET noms = $1, username = $2, email = $3, role_uti = $4, grade = $5 WHERE hel_mat = $6`;
        await db.query(updateQuery, [name, username, email, dbRole, grade, id]);

        // Handle password reset if provided
        if (password) {
            const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
            await db.query('UPDATE public.users SET password_hash = $1 WHERE user_id = $2', [passwordHash, userId]);
        }

        // Update zone commander assignment
        await db.query('UPDATE public.zones SET zone_commander_id = NULL WHERE zone_commander_id = $1', [userId]);
        if (role === 'COMZONE' && zoneId) {
            await db.query('UPDATE public.zones SET zone_commander_id = $1 WHERE zone_id = $2', [userId, zoneId]);
        }
        
        // Commit transaction
        await db.query('COMMIT');

        res.json({ ...req.body, id });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error("Erreur lors de la mise à jour de l'utilisateur:", err);
        res.status(500).json({ message: "Erreur serveur: " + err.message });
    }
});


apiRouter.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM public.users WHERE hel_mat = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        res.status(204).send();
    } catch (err) {
        console.error("Erreur lors de la suppression de l'utilisateur:", err);
        res.status(500).json({ message: "Erreur serveur: " + err.message });
    }
});

// --- ZONES API ---
apiRouter.post('/zones', async (req, res) => {
    const { id, name } = req.body;
    try {
        const result = await db.query('INSERT INTO public.zones (zone_id, zone_name) VALUES ($1, $2) RETURNING zone_id, zone_name', [id, name]);
        res.status(201).json({ id: result.rows[0].zone_id.toString(), name: result.rows[0].zone_name });
    } catch (err) {
        console.error("Erreur lors de l'ajout de la zone:", err);
        res.status(500).json({ message: "Erreur serveur: " + err.message });
    }
});

apiRouter.put('/zones/:id', async (req, res) => {
    const { id } = req.params;
    const { name, isTrash } = req.body;
    try {
        const result = await db.query(
            'UPDATE public.zones SET zone_name = $1, is_trash = $2 WHERE zone_id = $3 RETURNING zone_id, zone_name, COALESCE(is_trash, FALSE) as is_trash',
            [name, isTrash === true, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Zone non trouvée" });
        }
        const z = result.rows[0];
        res.json({ id: z.zone_id.toString(), name: z.zone_name, isTrash: z.is_trash });
    } catch (err) {
        console.error("Erreur lors de la mise à jour de la zone:", err);
        res.status(500).json({ message: "Erreur serveur: " + err.message });
    }
});

apiRouter.delete('/zones/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('BEGIN');
        await db.query('UPDATE public.stations SET is_deleted = TRUE WHERE zone_id = $1', [id]);
        await db.query('DELETE FROM public.zones WHERE zone_id = $1', [id]);
        await db.query('COMMIT');
        res.status(204).send();
    } catch (err) {
        await db.query('ROLLBACK');
        console.error("Erreur lors de la suppression de la zone:", err);
        res.status(500).json({ message: "Erreur serveur: " + err.message });
    }
});

// --- STATIONS API ---
apiRouter.post('/stations', async (req, res) => {
    const { id, name, zoneId } = req.body;
    try {
        const result = await db.query('INSERT INTO public.stations (station_id, station_name, zone_id) VALUES ($1, $2, $3) RETURNING station_id, station_name, zone_id', [id, name, zoneId]);
        res.status(201).json({
            id: result.rows[0].station_id.toString(),
            name: result.rows[0].station_name,
            zoneId: result.rows[0].zone_id.toString(),
        });
    } catch (err) {
        console.error("Erreur lors de l'ajout de la station:", err);
        res.status(500).json({ message: "Erreur serveur: " + err.message });
    }
});

apiRouter.put('/stations/:id', async (req, res) => {
    const { id } = req.params;
    const { name, zoneId } = req.body;
    try {
        const result = await db.query('UPDATE public.stations SET station_name = $1, zone_id = $2 WHERE station_id = $3 RETURNING *', [name, zoneId, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Station non trouvée" });
        }
        res.json({
            id: result.rows[0].station_id.toString(),
            name: result.rows[0].station_name,
            zoneId: result.rows[0].zone_id.toString(),
        });
    } catch (err) {
        console.error("Erreur lors de la mise à jour de la station:", err);
        res.status(500).json({ message: "Erreur serveur: " + err.message });
    }
});

apiRouter.delete('/stations/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            'UPDATE public.stations SET is_deleted = TRUE WHERE station_id = $1 RETURNING station_id, station_name, zone_id',
            [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Station non trouvée" });
        }
        const s = result.rows[0];
        res.json({ id: s.station_id.toString(), name: s.station_name, zoneId: s.zone_id.toString(), isDeleted: true });
    } catch (err) {
        console.error("Erreur lors de la mise à la corbeille de la station:", err);
        res.status(500).json({ message: "Erreur serveur: " + err.message });
    }
});

apiRouter.put('/stations/:id/restore', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            'UPDATE public.stations SET is_deleted = FALSE WHERE station_id = $1 RETURNING station_id, station_name, zone_id',
            [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Station non trouvée" });
        }
        const s = result.rows[0];
        res.json({ id: s.station_id.toString(), name: s.station_name, zoneId: s.zone_id.toString(), isDeleted: false });
    } catch (err) {
        console.error("Erreur lors de la restauration de la station:", err);
        res.status(500).json({ message: "Erreur serveur: " + err.message });
    }
});


// --- STATS API ---
apiRouter.get('/stats', async (req, res) => {
    const { startDate, endDate } = req.query;
    try {
        let query = `
            SELECT
                s.id,
                TO_CHAR(s.date AT TIME ZONE $1, 'YYYY-MM-DD') as date,
                s.messages_received,
                s.messages_sent,
                s.station_id,
                st.zone_id
            FROM public.message_statistics s
            JOIN public.stations st ON s.station_id = st.station_id AND COALESCE(st.is_deleted, FALSE) = FALSE
        `;
        const params = [TIMEZONE];
        const conditions = [];

        if (startDate) {
            params.push(startDate);
            conditions.push(`s.date >= $${params.length}`);
        }
        if (endDate) {
            params.push(endDate);
            conditions.push(`s.date <= $${params.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY s.date DESC, s.id DESC';

        const statsResult = await db.query(query, params);
        
        const responseData = statsResult.rows.map(s => ({
            id: s.id.toString(),
            date: s.date,
            messagesReceived: s.messages_received,
            messagesSent: s.messages_sent,
            stationId: s.station_id.toString(),
            zoneId: s.zone_id.toString(),
        }));
        
        res.json(responseData);

    } catch (err) {
        console.error("Erreur lors de la récupération des statistiques:", err.message);
        res.status(500).json({ message: "Erreur interne du serveur" });
    }
});


apiRouter.post('/stats', async (req, res) => {
  const { stationId, date, messagesSent, messagesReceived } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO public.message_statistics (station_id, date, messages_sent, messages_received) VALUES ($1, $2, $3, $4) RETURNING id, station_id, date, messages_sent, messages_received',
      [stationId, date, messagesSent, messagesReceived]
    );
    const newStat = result.rows[0];
    
    // Get the zoneId for the response
    const stationResult = await db.query('SELECT zone_id FROM public.stations WHERE station_id = $1', [newStat.station_id]);
    const zoneId = stationResult.rows[0].zone_id;

    res.status(201).json({
        id: newStat.id.toString(),
        stationId: newStat.station_id.toString(),
        date: new Date(newStat.date).toISOString().split('T')[0],
        messagesSent: newStat.messages_sent,
        messagesReceived: newStat.messages_received,
        zoneId: zoneId.toString(),
    });
  } catch (err) {
    console.error("Erreur lors de la soumission des statistiques:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
});


app.use('/api', apiRouter);


// --- STATIC FILE SERVING ---
const root = path.join(__dirname, '..');
app.use(express.static(root));

app.get('*', (req, res) => {
  res.sendFile(path.join(root, 'index.html'));
});


// --- START SERVER ---
async function startServer() {
  try {
    await db.query('ALTER TABLE public.stations ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE');
    console.log('\n[INFO] Migration: colonne is_deleted vérifiée sur public.stations.');
  } catch (err) {
    console.error('\n[AVERTISSEMENT] Migration is_deleted impossible:', err.message);
  }
  try {
    await db.query('ALTER TABLE public.zones ADD COLUMN IF NOT EXISTS is_trash BOOLEAN DEFAULT FALSE');
    console.log('\n[INFO] Migration: colonne is_trash vérifiée sur public.zones.');
  } catch (err) {
    console.error('\n[AVERTISSEMENT] Migration is_trash impossible:', err.message);
  }

  app.listen(PORT, async () => {
    try {
      const password = 'password';
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      await db.query('UPDATE public.users SET password_hash = $1 WHERE username = $2', [passwordHash, 'superadmin']);
      console.log(`\n[INFO] Le mot de passe pour l'utilisateur 'superadmin' a été réinitialisé à : "${password}"`);
      console.log(`       Utilisez ces identifiants pour la première connexion.`);
    } catch (err) {
      console.error("\n[AVERTISSEMENT] Impossible de réinitialiser automatiquement le mot de passe du superadmin. L'utilisateur n'existe peut-être pas encore.", err.message);
    }
    console.log(`\n✅ Serveur backend démarré et à l'écoute sur http://localhost:${PORT}`);
    console.log(`   L'application complète (frontend + backend) est servie depuis cette adresse.`);
  });
}

startServer();