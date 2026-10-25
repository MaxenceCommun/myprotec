'use strict';
// Le moteur vit dans vps-events/ (déployé seul sur le VPS) ; ce fichier le réexporte pour server.js
module.exports = require('../vps-events/server_events_engine');
