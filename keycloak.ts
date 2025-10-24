import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'https://192.168.100.6:8443/auth',
  realm: 'heliosc4i',
  clientId: 'adminTraficExplo',
});

export default keycloak;
