import { User, Zone, Station, MessageStats } from './types';

// Configuration pour pointer vers le serveur backend.
// Modifiez ceci pour pointer vers votre machine locale pendant le développement.
const API_BASE_URL = 'http://192.168.10.7:3001/api'; // Pour le développement local
// const API_BASE_URL = 'http://192.168.10.7:3001/api'; // Pour le serveur de production

const REQUEST_TIMEOUT = 15000; // 15 secondes

// --- HELPER FUNCTIONS ---

/**
 * Formate une date en une chaîne YYYY-MM-DD en utilisant les composantes de date locale,
 * évitant ainsi les problèmes de conversion de fuseau horaire de toISOString().
 * @param date L'objet Date à formater.
 * @returns Une chaîne au format 'YYYY-MM-DD'.
 */
const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};


async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Une erreur inattendue est survenue.' }));
    throw new Error(error.message || `Erreur ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  const config: RequestInit = {
    ...options,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  } catch (error: any) {
    // Ce bloc intercepte les erreurs réseau (ex: serveur inaccessible) et les timeouts
    if (error.name === 'AbortError') {
      throw new Error('La requête a expiré (timeout). Le serveur est peut-être inaccessible ou trop lent.');
    }
    // Erreur réseau générique pour des cas comme DNS, ECONNREFUSED, etc.
    throw new Error('Erreur de connexion réseau. Impossible de contacter le serveur.');
  } finally {
    // Il est crucial de toujours nettoyer le timeout
    clearTimeout(timeoutId);
  }

  // Si la requête fetch a réussi, on traite la réponse pour les codes de statut HTTP (4xx, 5xx)
  return handleResponse<T>(response);
}


// --- API FUNCTIONS ---

export const getInitialData = async (): Promise<{ users: User[], zones: Zone[], stations: Station[], stats: MessageStats[] }> => {
  return apiRequest('/initial-data');
};

export const getZones = async (): Promise<Zone[]> => {
    return apiRequest('/zones');
};

export const login = async (credentials: { username: string; password?: string }): Promise<User> => {
  return apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};

// --- USER MANAGEMENT ---
export const addUser = async (user: User): Promise<User> => {
    return apiRequest('/users', { method: 'POST', body: JSON.stringify(user) });
};

export const updateUser = async (user: User): Promise<User> => {
    return apiRequest(`/users/${user.id}`, { method: 'PUT', body: JSON.stringify(user) });
};

export const deleteUser = async (userId: string): Promise<void> => {
    await apiRequest(`/users/${userId}`, { method: 'DELETE' });
};

// --- ZONE MANAGEMENT ---
export const addZone = async (zone: Zone): Promise<Zone> => {
    return apiRequest('/zones', { method: 'POST', body: JSON.stringify(zone) });
};

export const updateZone = async (zone: Zone): Promise<Zone> => {
    return apiRequest(`/zones/${zone.id}`, { method: 'PUT', body: JSON.stringify(zone) });
};

export const deleteZone = async (zoneId: string): Promise<void> => {
    await apiRequest(`/zones/${zoneId}`, { method: 'DELETE' });
};

// --- STATION MANAGEMENT ---
export const addStation = async (station: Station): Promise<Station> => {
    return apiRequest('/stations', { method: 'POST', body: JSON.stringify(station) });
};

export const updateStation = async (station: Station): Promise<Station> => {
    return apiRequest(`/stations/${station.id}`, { method: 'PUT', body: JSON.stringify(station) });
};

export const deleteStation = async (stationId: string): Promise<void> => {
    await apiRequest(`/stations/${stationId}`, { method: 'DELETE' });
};

// --- STATS MANAGEMENT ---
export const addStat = async (stat: Omit<MessageStats, 'id'>): Promise<MessageStats> => {
    return apiRequest('/stats', { method: 'POST', body: JSON.stringify(stat) });
};

export const getStats = async (startDate?: Date, endDate?: Date): Promise<MessageStats[]> => {
    const params = new URLSearchParams();
    if (startDate) {
        params.append('startDate', formatDateForAPI(startDate));
    }
    if (endDate) {
        params.append('endDate', formatDateForAPI(endDate));
    }
    const query = params.toString();
    return apiRequest(`/stats${query ? `?${query}` : ''}`);
};
