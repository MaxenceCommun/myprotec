# 🚑 Protec Live - Simulateur de Gestion de la Protection Civile

Application web interactive de simulation et de gestion d'antennes de la **Protection Civile**, développée avec une direction artistique **Glassmorphism épurée**, lumineuse et moderne sur fond de carte du monde réel.

---

## 🌟 Points Forts & Direction Artistique

- **Design Glassmorphism Épuré** : Conteneurs translucides légers (`bg-white/75`, `backdrop-blur-md`, bordures fines `border-white/60`, ombres douces).
- **Couleurs Institutionnelles** : Bleu outremer institutionnel (`#002E6D`) et orange sécurité (`#FF6600`) pour les alertes et les boutons d'action.
- **Fond de carte réel minimaliste** : Leaflet avec le fond de carte épuré **CartoDB Positron** haute lisibilité.
- **Micro-animations & Fluidité** :
  - Pulsation radar dynamique (`radar-ping`) autour des marqueurs d'intervention.
  - Panneau latéral coulissant droit (*Drawer*) contextuel sans rechargement de page.
  - Horloge opérationnelle avec accélération de la vitesse de simulation (Pause, 1x, 2x, 5x).
  - Jauges de progression en temps réel pour le suivi radio des missions engagées et des formations.

---

## 🎯 Pôles de Gameplay & Mécaniques Opérationnelles

### 1. Planning Hebdomadaire & Auto-Inscription des Bénévoles
- **Missions prévues à l'avance** : Les Dispositifs Prévisionnels de Secours (DPS) ne tombent plus à l'improviste. Ils sont programmés dans un calendrier hebdomadaire (Samedi 10h, Dimanche 14h, etc.).
- **Disponibilités réelles des bénévoles** : Comme dans la vraie vie associative, chaque secouriste a une vie professionnelle ou étudiante (*Salarié*, *Étudiant*, *Soirs & Week-ends*).
- **Auto-inscription** : Les bénévoles se positionnent **d'eux-mêmes** sur les dispositifs correspondant à leurs créneaux libres selon leur motivation !
- **Relances Opérationnelles (Alertes SMS / Notification)** : Si un DPS est incomplet à l'approche de la date, le joueur peut lancer une alerte de relance pour inciter les bénévoles en réserve à se mobiliser.

### 2. Gestion Opérationnelle des Devis & Conventions
- Les organisateurs (mairie, clubs sportifs, festivals) envoient des demandes de couverture sanitaire.
- Étudiez le cahier des charges (public attendu selon la grille RIS, effectif requis, véhicules).
- Proposez votre tarification : **Tarif Solidaire (-15%)**, **Tarif Standard** ou **Tarif Majoré Urgence (+25%)**.
- Dès signature de la convention par l'organisateur, l'événement entre automatiquement dans le planning opérationnel !

### 3. Recrutement Réaliste & Notoriété (Réseaux Sociaux & Com')
- Les bénévoles ne s'achètent pas en 1 clic : ils postulent par **Candidatures Spontanées**.
- Activez des **Campagnes de communication** :
  - *Réseaux Sociaux (Instagram / TikTok)* : attire régulièrement des jeunes et étudiants.
  - *Affichage municipal & Journal communal* : attire des actifs et profils expérimentés.
- Traitez les dossiers de candidature reçus (âge, profession, motivation, créneaux déclarés) et validez leur intégration comme Stagiaires.

### 4. Mode Multijoueur & Système d'Alliances (Fédération)
- **Synchronisation en Temps Réel** : Tous les joueurs connectés voient les antennes des autres joueurs apparaître sur la carte avec leur blason d'alliance !
- **Alliances Fédérales (ex: Union Fédérale de Sécurité Civile)** :
  - Caisse de solidarité fédérale mutualisée.
  - Possibilité de créer ou rejoindre une alliance.
- **Demandes de Renfort Inter-Alliés** :
  - Sur un gros DPS ou une crise où il manque du personnel, lancez un **« Appel à Renfort d'Alliance »**.
  - Les directeurs d'antennes alliés peuvent détacher un VPSP ou des secouristes en échange d'une indemnité kilométrique (+180 €) et de points d'alliance !
- **Stages Spéciaux Mutualisés** :
  - Proposez des formations de haut niveau (*Chef de Dispositif CD*, *Conduite d'Urgence VPSP*, *Poste Médical Avancé*) ou inscrivez vos bénévoles aux stages organisés par vos alliés.
- **Canal Radio Tactique** :
  - Tchat opérationnel en direct entre directeurs d'antennes de l'alliance.

### 2. Pôle SAMU 15 & Urgences
- Départs réflexes en ambulance VPSP sur demande de la régulation médicale.
- Prise en charge de malaises voie publique, détresses et traumatismes.
- Gains élevés d'expérience (XP) et subventions d'urgence ARS.

### 3. Pôle Action Sociale
- Maraudes de nuit régulières en Véhicule Tout Usage (VTU).
- Distribution de kits d'hygiène, duvets et boissons chaudes.
- Amélioration notable de la réputation auprès des municipalités.

### 4. Pôle Formation Pédagogique
- **Formations Externes Grand Public** : Sessions PSC1 (Premiers Secours Civiques) et SST. Mobilise une salle et un formateur qualifié, et génère des fonds nets pour équiper votre antenne (+480 € par session de 8 stagiaires).
- **Formations Internes (Arbre d'Évolution)** : Faites progresser vos secouristes de Stagiaire vers PSE1, PSE2, Chef d'Équipe (CE), Chef de Dispositif (CD) et Formateur.

### 5. Implantation d'Antennes & Flotte
- Cliquez sur **« Implanter Antenne »** puis directement sur n'importe quel point de la carte pour fonder une nouvelle antenne territoriale.
- Achat de nouveaux véhicules (VPSP, VTU, VL, PMA gonflable).
- Campagnes de recrutement de nouveaux bénévoles.

### 6. Crises Exceptionnelles (Plan NOVI & ORSEC)
- Module dédié aux crises majeures (accidents de masse, inondations centennales).
- Déploiement multi-équipages avec Poste Médical Avancé (PMA).

---

## 🚀 Comment Lancer l'Application

Vous pouvez ouvrir directement le fichier `index.html` dans n'importe quel navigateur moderne (Chrome, Edge, Firefox, Safari) :

```bash
# Option 1 : Lancer le serveur Node.js multijoueur (recommandé)
node server.js

# Option 2 : Double-cliquer directement sur le fichier index.html
```
Puis accédez à `http://localhost:8080` dans votre navigateur.
