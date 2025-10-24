const session = require('express-session');
const Keycloak = require('keycloak-connect');

// Stockage de session en mémoire
const memoryStore = new session.MemoryStore();

// Configuration de Keycloak
const keycloak = new Keycloak({
  store: memoryStore
}, {
  "realm": "heliosc4i",
  "auth-server-url": "https://192.168.100.6:8443/auth/",
  "ssl-required": "none",
  "resource": "adminTraficExplo",
  "public-client": true,
  "confidential-port": 0
});

module.exports = { keycloak, memoryStore };
