/**
 * PROTEC LIVE - GLOSSAIRE ET SYSTÈME D'INFOBULLES D'ABRÉVIATIONS
 * 
 * Affiche automatiquement au survol du curseur le nom complet et la signification
 * de toutes les abréviations et acronymes de la Protection Civile, des secours,
 * des véhicules, diplômes, missions et institutions.
 */

(function() {
  'use strict';

  const GLOSSARY = {
    // --- VÉHICULES & VECTEURS OPÉRATIONNELS ---
    'VPSP': {
      fullName: 'Véhicule de Premiers Secours à Personnes',
      category: 'Flotte Sanitaire',
      desc: 'Ambulance de secours d’urgence aux normes EN 1789 pour prise en charge et évacuation de victimes.'
    },
    'VL': {
      fullName: 'Véhicule de Liaison',
      category: 'Flotte Rapide',
      desc: 'Véhicule léger d’intervention rapide pour reconnaissance, relève et déplacement des cadres.'
    },
    'VLHR': {
      fullName: 'Véhicule Léger Hors Route',
      category: 'Tout-Terrain',
      desc: 'Véhicule 4x4 tout-terrain pour zones difficiles d’accès, crues, massifs forestiers et remorquage.'
    },
    'VLTT': {
      fullName: 'Véhicule Léger Tout-Terrain',
      category: 'Tout-Terrain',
      desc: 'Véhicule 4x4 équipé pour le franchissement et les accès en zones escarpées ou sinistrées.'
    },
    'VTU': {
      fullName: 'Véhicule Tout Usage',
      category: 'Logistique',
      desc: 'Fourgon utilitaire polyvalent pour transport de matériel, tentes, lits de camp et logistique de poste.'
    },
    'VTP': {
      fullName: 'Véhicule de Transport de Personnel',
      category: 'Transport',
      desc: 'Minibus 9 places pour acheminer les secouristes et relèves d’équipages sur les dispositifs distants.'
    },
    'PCM': {
      fullName: 'Poste de Commandement Mobile',
      category: 'Commandement',
      desc: 'Véhicule lourd équipé d’une baie informatique, radio VHF/UHF, satellite et espace de gestion de crise.'
    },
    'VPC': {
      fullName: 'Véhicule Poste de Commandement',
      category: 'Commandement',
      desc: 'Véhicule de coordination opérationnelle sur les dispositifs d’envergure ou plans d’urgence.'
    },
    'VAHU': {
      fullName: 'Véhicule d’Accueil et d’Hébergement d’Urgence',
      category: 'Action Sociale',
      desc: 'Aménagé pour l’accueil des sinistrés, les maraudes sociales hivernales et le soutien de proximité.'
    },
    'FLIT': {
      fullName: 'Fourgon Lourd d’Intervention Technique',
      category: 'Soutien Technique',
      desc: 'Fourgon lourd équipé pour le montage rapide de PMA, groupes électrogènes et éclairage de crise.'
    },
    'VCYN': {
      fullName: 'Véhicule Cynotechnique',
      category: 'USAR / Cyno',
      desc: 'Fourgon cynophile équipé de boxes pour chiens de recherche et sauvetage en décombres et quête.'
    },
    'ERS': {
      fullName: 'Embarcation de Reconnaissance et de Sauvetage',
      category: 'Sauvetage Aquatique',
      desc: 'Embarcation motorisée pour inondations, rivières et plans d’eau (tractée sur remorque).'
    },
    'BLS': {
      fullName: 'Bateau Léger de Sauvetage',
      category: 'Sauvetage Aquatique',
      desc: 'Canot pneumatique léger pour reconnaissance et sauvetage en eaux intérieures et zones inondées.'
    },
    'MPS': {
      fullName: 'Moto de Premiers Secours',
      category: 'Vecteur Rapide',
      desc: 'Moto d’intervention rapide pour se faufiler dans le trafic urbain dense et poser un premier bilan.'
    },
    'VTD': {
      fullName: 'Véhicule Technique Déblaiement',
      category: 'Sauvetage Déblaiement (USAR)',
      desc: 'Véhicule d’appui USAR transportant l’outillage lourd de déblaiement, étaiement et levage.'
    },
    'VST': {
      fullName: 'Véhicule de Soutien Technique',
      category: 'Soutien Technique',
      desc: 'Logistique électrique de pointe, compresseur et assistance mécanique pour opérations longues.'
    },
    'VSAV': {
      fullName: 'Véhicule de Secours et d’Assistance aux Victimes',
      category: 'Sapeurs-Pompiers',
      desc: 'Ambulance de premier départ des Sapeurs-Pompiers (SDIS / BSPP / BMPM).'
    },
    'VLM': {
      fullName: 'Véhicule Léger Médicalisé',
      category: 'Médicalisé (SAMU/SMUR)',
      desc: 'Véhicule rapide avec médecin et infirmier pour renfort médical d’urgence.'
    },
    'REM': {
      fullName: 'Remorque Spécialisée',
      category: 'Logistique',
      desc: 'Remorque opérationnelle pour le transport de lots lourds (PMA, éclairage, pompage, ERS ou Quad).'
    },
    'VTT': {
      fullName: 'Vélo Tout-Terrain',
      category: 'Dispositif Mobile',
      desc: 'Binôme à vélo avec trousses d’urgence et DAE pour patrouilles en zones piétonnes ou parcs.'
    },
    'P.VPSP': {
      fullName: 'Permis & Habilitation Conduite VPSP',
      category: 'Habilitation Véhicule',
      desc: 'Habilitation de conduite d’ambulance de premiers secours en intervention avec victime transportée.'
    },
    'PERMIS B': {
      fullName: 'Permis B (Véhicules Légers)',
      category: 'Permis de Conduire',
      desc: 'Permis officiel autorisant la conduite des véhicules légers de liaison (VL) et utilitaires (VTU).'
    },

    // --- QUALIFICATIONS, RANGS & COMPÉTENCES ---
    'CE': {
      fullName: 'Chef d’Équipe',
      category: 'Grade Opérationnel',
      desc: 'Encadrant de proximité dirigeant un binôme ou une équipe de secours sur le terrain.'
    },
    'CI': {
      fullName: 'Chef d’Intervention',
      category: 'Commandement',
      desc: 'Cadre assurant la coordination tactique des moyens sur une intervention de secours.'
    },
    'CP': {
      fullName: 'Chef de Poste',
      category: 'Commandement',
      desc: 'Responsable opérationnel d’un Dispositif Prévisionnel de Secours (DPS).'
    },
    'CD': {
      fullName: 'Chef de Dispositif',
      category: 'Commandement Supérieur',
      desc: 'Cadre supérieur coordonnant l’ensemble des postes, moyens et liaisons autorités sur un grand dispositif.'
    },
    'PSE1': {
      fullName: 'Premiers Secours en Équipe de Niveau 1',
      category: 'Diplôme d’État',
      desc: 'Secouriste opérationnel formé aux techniques d’urgence en équipe, bilan et gestes de réanimation.'
    },
    'PSE2': {
      fullName: 'Premiers Secours en Équipe de Niveau 2',
      category: 'Diplôme d’État',
      desc: 'Équipier secouriste complet formé aux immobilisations, relevages, traumatismes et brancardage.'
    },
    'PSE': {
      fullName: 'Premiers Secours en Équipe',
      category: 'Diplôme d’État',
      desc: 'Filière officielle de formation professionnelle des secouristes opérationnels (PSE1 & PSE2).'
    },
    'PSC1': {
      fullName: 'Prévention et Secours Civiques de Niveau 1',
      category: 'Formation Citoyenne',
      desc: 'Formation de base aux gestes qui sauvent destinée au grand public.'
    },
    'PSC': {
      fullName: 'Prévention et Secours Civiques',
      category: 'Filière Pédagogique',
      desc: 'Certificat citoyen d’apprentissage des gestes d’urgence et de premiers secours.'
    },
    'GQS': {
      fullName: 'Gestes Qui Sauvent',
      category: 'Sensibilisation',
      desc: 'Sensibilisation courte (2h) aux gestes vitaux : massage cardiaque, DAE et hémorragies.'
    },
    'SST': {
      fullName: 'Sauveteur Secouriste du Travail',
      category: 'Santé au Travail (INRS)',
      desc: 'Formation professionnelle aux secours et à la prévention des risques en entreprise.'
    },
    'SSA': {
      fullName: 'Surveillance et Sauvetage Aquatique',
      category: 'Spécialité Nautique',
      desc: 'Qualification officielle pour le sauvetage en eaux intérieures, plans d’eau et littoral.'
    },
    'AEP': {
      fullName: 'Aide et Écoute Psychologique',
      category: 'Soutien Psychologique',
      desc: 'Prise en charge médico-psychologique des impliqués, familles et accompagnement post-traumatique.'
    },
    'AEP1': {
      fullName: 'Aide et Écoute Psychologique 1',
      category: 'Spécialité Écoute',
      desc: 'Sensibilisation à l’écoute active et au réconfort immédiat des personnes choquées.'
    },
    'AEP2': {
      fullName: 'Aide et Écoute Psychologique 2',
      category: 'Spécialité Écoute',
      desc: 'Prise en charge approfondie : defusing, deuil traumatique et armement des CAI en crise NOVI.'
    },
    'PIC F': {
      fullName: 'Pédagogie Initiale et Commune de Formateur',
      category: 'Formation de Cadres',
      desc: 'Socle pédagogique officiel ouvrant la voie au monitorat et à l’animation de formations.'
    },
    'PIC': {
      fullName: 'Pédagogie Initiale et Commune',
      category: 'Pédagogie',
      desc: 'Formation pédagogique prérequise pour devenir formateur de sécurité civile.'
    },
    'CEF': {
      fullName: 'Concepteur / Encadrant de Formation',
      category: 'Direction Pédagogique',
      desc: 'Cadre assurant la conception des référentiels et la coordination des équipes de formateurs.'
    },
    'FdF': {
      fullName: 'Formateur de Formateurs',
      category: 'Grade Pédagogique',
      desc: 'Grade suprême de la filière formation : forme et certifie les formateurs de l’association.'
    },
    'USAR': {
      fullName: 'Urban Search and Rescue (Sauvetage et Déblaiement)',
      category: 'Spécialité Catastrophe',
      desc: 'Recherche et sauvetage de victimes en milieu urbain, effondrements, séismes et décombres.'
    },
    'BNSSA': {
      fullName: 'Brevet National de Sécurité et de Sauvetage Aquatique',
      category: 'Diplôme Nautique',
      desc: 'Brevet national permettant la surveillance et le sauvetage sur les baignades et plages.'
    },

    // --- DISPOSITIFS, MISSIONS & PLANS D'URGENCE ---
    'AASC': {
      fullName: 'Association Agréée de Sécurité Civile',
      category: 'Agrément Officiel d’État',
      desc: 'Agrément ministériel permettant d’assurer des missions de secours, d’encadrement et de soutien.'
    },
    'DPS': {
      fullName: 'Dispositif Prévisionnel de Secours',
      category: 'Dispositif Opérationnel',
      desc: 'Poste de secours mis en place à la demande d’un organisateur lors d’événements recevant du public.'
    },
    'DPS-PE': {
      fullName: 'Dispositif Prévisionnel de Secours - Petite Envergure',
      category: 'Grille RNMSC',
      desc: 'Poste de secours dimensionné de 1 à 2 intervenants secouristes (ex: PAPS).'
    },
    'DPS-ME': {
      fullName: 'Dispositif Prévisionnel de Secours - Moyenne Envergure',
      category: 'Grille RNMSC',
      desc: 'Poste de secours mobilisant de 3 à 12 secouristes avec véhicule d’intervention (VPSP).'
    },
    'DPS-GE': {
      fullName: 'Dispositif Prévisionnel de Secours - Grande Envergure',
      category: 'Grille RNMSC',
      desc: 'Dispositif majeur de secours réunissant plus de 13 secouristes, plusieurs postes et coordination.'
    },
    'PAPS': {
      fullName: 'Point d’Alerte et de Premiers Secours',
      category: 'Poste Fixe',
      desc: 'Point de secours de petite envergure armé par un binôme de secouristes opérationnels.'
    },
    'NOVI': {
      fullName: 'NOmbreuses VIctimes (Plan Rouge / Afflux massif)',
      category: 'Plan d’Urgence Départemental',
      desc: 'Plan d’organisation des secours déclenché par le Préfet en cas d’accident ou attentat à nombreuses victimes.'
    },
    'ORSEC': {
      fullName: 'Organisation de la Réponse de SEcurité Civile',
      category: 'Plan Cadre d’État',
      desc: 'Programme général de gestion des crises et catastrophes sous l’autorité du Préfet de département.'
    },
    'CAI': {
      fullName: 'Centre d’Accueil des Impliqués',
      category: 'Plan NOVI / Crise',
      desc: 'Structure mise en place (gymnase, salle polyvalente) pour regrouper, identifier et réconforter les rescapés.'
    },
    'PMA': {
      fullName: 'Poste Médical Avancé',
      category: 'Chaîne Médicale',
      desc: 'Hôpital de campagne monté sur zone pour le tri médical, les soins d’urgence et la stabilisation des blessés.'
    },
    'CHU': {
      fullName: 'Centre Hospitalier Universitaire',
      category: 'Établissement de Santé',
      desc: 'Hôpital de référence doté de services d’urgences, déchoquage et réanimation de pointe.'
    },
    'CH': {
      fullName: 'Centre Hospitalier',
      category: 'Établissement de Santé',
      desc: 'Hôpital public de secteur recevant les urgences et évacuations sanitaires.'
    },
    'DAE': {
      fullName: 'Défibrillateur Automatisé Externe',
      category: 'Matériel Biomédical',
      desc: 'Appareil portable analysant le rythme cardiaque et délivrant un choc électrique en cas d’arrêt cardiaque.'
    },
    'O2': {
      fullName: 'Oxygène Médical (B5 / Inhalation)',
      category: 'Consommable Sanitaire',
      desc: 'Bouteille d’oxygène médical sous pression pour inhalation ou insufflation sur détresse respiratoire.'
    },
    'TGBT': {
      fullName: 'Tableau Général Basse Tension',
      category: 'Infrastructure & Sécurité ERP',
      desc: 'Armoire électrique principale des locaux avec disjoncteur général et coupure d’urgence pompiers.'
    },
    'ERP': {
      fullName: 'Établissement Recevant du Public',
      category: 'Réglementation Sécurité',
      desc: 'Bâtiment soumis aux normes strictes de sécurité incendie, d’évacuation et de capacité d’accueil.'
    },

    // --- INSTITUTIONS & PARTENAIRES ---
    'SAMU': {
      fullName: 'Service d’Aide Médicale Urgente',
      category: 'Santé Publique (Centre 15)',
      desc: 'Service hospitalier régulant les appels d’urgence médicale et coordonnant les moyens SMUR et ambulances.'
    },
    'SMUR': {
      fullName: 'Service Mobile d’Urgence et de Réanimation',
      category: 'Moyens Médicalisés',
      desc: 'Équipes hospitalières mobiles composées d’un médecin urgentiste, d’un infirmier et d’un ambulancier.'
    },
    'SDIS': {
      fullName: 'Service Départemental d’Incendie et de Secours',
      category: 'Sapeurs-Pompiers',
      desc: 'Établissement public gérant l’ensemble des centres de secours et pompiers du département (18 / 112).'
    },
    'CODIS': {
      fullName: 'Centre Opérationnel Départemental d’Incendie et de Secours',
      category: 'Coordination Pompiers',
      desc: 'Centre de traitement des alertes et de régulation opérationnelle des sapeurs-pompiers.'
    },
    'COD': {
      fullName: 'Centre Opérationnel Départemental',
      category: 'Cellule de Crise Préfecture',
      desc: 'Centre de commandement activé en préfecture par le Préfet lors d’événements majeurs ou crises.'
    },
    'SIDPC': {
      fullName: 'Service Interministériel de Défense et de Protection Civiles',
      category: 'Préfecture',
      desc: 'Service préfectoral chargé de la planification des secours, des plans ORSEC et de la sécurité civile.'
    },
    'CUMP': {
      fullName: 'Cellule d’Urgence Médico-Psychologique',
      category: 'Psychiatrie d’Urgence',
      desc: 'Dispositif de psychiatres et psychologues intervenant lors de catastrophes pour prévenir les traumatismes.'
    },
    'SNCF': {
      fullName: 'Société Nationale des Chemins de fer Français',
      category: 'Partenaire Conventionné',
      desc: 'Entreprise ferroviaire nationale partenaire de la Protection Civile pour l’assistance aux voyageurs naufragés.'
    },
    'FNPC': {
      fullName: 'Fédération Nationale de Protection Civile',
      category: 'Fédération Nationale',
      desc: 'Organisme fédéral national regroupant l’ensemble des associations départementales de Protection Civile.'
    },
    'DGAC': {
      fullName: 'Direction Générale de l’Aviation Civile',
      category: 'Autorité Aérienne',
      desc: 'Autorité délivrant les homologations de télépilotes de drones et surveillant l’espace aérien.'
    },
    'ASP': {
      fullName: 'Agence de Services et de Paiement',
      category: 'Organisme d’État',
      desc: 'Établissement public versant l’indemnité d’État légale aux jeunes volontaires en Service Civique.'
    },
    'INRS': {
      fullName: 'Institut National de Recherche et de Sécurité',
      category: 'Prévention & Sécurité',
      desc: 'Organisme national régissant les référentiels de formation SST et la prévention des accidents du travail.'
    },
    'CDD': {
      fullName: 'Contrat à Durée Déterminée',
      category: 'Droit du Travail',
      desc: 'Contrat de travail conclu pour une durée déterminée avec terme précis.'
    },
    'CDI': {
      fullName: 'Contrat à Durée Indéterminée',
      category: 'Droit du Travail',
      desc: 'Contrat de travail sans limitation de durée, statut de référence en France.'
    },
    'RH': {
      fullName: 'Ressources Humaines',
      category: 'Gestion',
      desc: 'Gestion des recrutements, carrières, entretiens, formations et vie associative des membres.'
    },
    'CAD': {
      fullName: 'Conception Assistée par Ordinateur (Plan 2D)',
      category: 'Outil Architectural',
      desc: 'Logiciel de modélisation et de dessin technique pour l’aménagement des pièces du local.'
    },
    'VHF': {
      fullName: 'Very High Frequency (Très Haute Fréquence)',
      category: 'Transmissions Radio',
      desc: 'Bande d’ondes radioélectriques standard employée par les réseaux de secours et la Protection Civile.'
    },
    'UHF': {
      fullName: 'Ultra High Frequency (Ultra Haute Fréquence)',
      category: 'Transmissions Radio',
      desc: 'Bande de fréquences radio offrant une excellente pénétration en milieu urbain dense et intérieur.'
    },
    'SMS': {
      fullName: 'Short Message Service (Alerte d’astreinte)',
      category: 'Téléphonie d’Urgence',
      desc: 'Canal de transmission rapide par message texte pour recenser et mobiliser l’équipage d’astreinte.'
    },
    'PTE': {
      fullName: 'Poste de Transmission et d’Exploitation',
      category: 'Réseau Radio',
      desc: 'Dispositif technique assurant la liaison radio permanente entre le terrain et le PC opérationnel.'
    },
    'RETEX': {
      fullName: 'Retour d’Expérience',
      category: 'Analyse Opérationnelle',
      desc: 'Bilan méthodologique réalisé après une intervention pour capitaliser sur les points forts et axes d’amélioration.'
    }
  };

  // Liste triée par longueur décroissante pour éviter qu'un sous-mot match avant un acronyme complet (ex: DPS-GE avant DPS)
  const SORTED_KEYS = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);

  // Expression régulière globale pour identifier les acronymes entourés de délimiteurs de mots
  const ESCAPED_KEYS = SORTED_KEYS.map(k => k.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'));
  const GLOSSARY_REGEX = new RegExp(`(?<![a-zA-Z0-9À-ÿ])(${ESCAPED_KEYS.join('|')})(?![a-zA-Z0-9À-ÿ])`, 'g');

  const ProtecGlossaire = {
    dictionary: GLOSSARY,
    keys: SORTED_KEYS,
    regex: GLOSSARY_REGEX,

    getEntry(rawText) {
      if (!rawText) return null;
      const clean = String(rawText).trim().toUpperCase();
      return GLOSSARY[clean] || null;
    },

    // Crée l'élément du tooltip flottant unique
    ensureTooltipElement() {
      let el = document.getElementById('global-abbr-tooltip');
      if (!el) {
        el = document.createElement('div');
        el.id = 'global-abbr-tooltip';
        el.className = 'fixed hidden pointer-events-none transition-opacity duration-150 z-[100000] max-w-sm rounded-xl p-3 shadow-2xl border';
        el.style.backgroundColor = '#0b1120';
        el.style.color = '#f8fafc';
        el.style.borderColor = '#334155';
        el.style.boxShadow = '0 20px 45px -10px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.15)';
        document.body.appendChild(el);
      }
      return el;
    },

    // Affiche l'infobulle flottante pour une abréviation
    showTooltip(abbrKey, targetRect, mousePos = null) {
      const entry = this.getEntry(abbrKey);
      if (!entry) return;

      const el = this.ensureTooltipElement();
      el.innerHTML = `
        <div class="flex items-center justify-between gap-2.5 pb-1.5 mb-1.5 border-b border-slate-700/80">
          <div class="flex items-center gap-1.5">
            <span class="px-2 py-0.5 rounded font-mono font-black text-xs bg-pc-blue text-white shadow-xs">${abbrKey}</span>
            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">${entry.category || 'Abréviation'}</span>
          </div>
          <span class="text-[9px] font-black text-amber-400 flex items-center gap-0.5">ℹ️ Protection Civile</span>
        </div>
        <div class="text-xs font-black text-white leading-snug">
          ${entry.fullName}
        </div>
        ${entry.desc ? `
          <p class="text-[10.5px] text-slate-300 font-medium leading-relaxed mt-1">
            ${entry.desc}
          </p>
        ` : ''}
      `;

      el.classList.remove('hidden');
      el.style.opacity = '1';

      // Calcul de la position
      const width = el.offsetWidth || 290;
      const height = el.offsetHeight || 100;

      let left = (mousePos ? mousePos.x + 12 : (targetRect ? targetRect.left + (targetRect.width / 2) - (width / 2) : 20));
      let top = (mousePos ? mousePos.y + 16 : (targetRect ? targetRect.bottom + 8 : 20));

      // Empêcher de déborder de l'écran
      if (left + width > window.innerWidth - 12) {
        left = window.innerWidth - width - 12;
      }
      if (left < 12) left = 12;

      if (top + height > window.innerHeight - 12) {
        top = (targetRect ? targetRect.top - height - 8 : mousePos.y - height - 12);
      }
      if (top < 12) top = 12;

      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
    },

    hideTooltip() {
      const el = document.getElementById('global-abbr-tooltip');
      if (el) {
        el.classList.add('hidden');
        el.style.opacity = '0';
      }
    },

    // Recherche le mot exact sous la position du curseur dans un nœud texte
    getWordUnderCursor(event) {
      let range, textNode, offset;
      if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(event.clientX, event.clientY);
        if (pos) {
          textNode = pos.offsetNode;
          offset = pos.offset;
        }
      } else if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(event.clientX, event.clientY);
        if (range) {
          textNode = range.startContainer;
          offset = range.startOffset;
        }
      }

      if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return null;

      const text = textNode.textContent;
      if (!text) return null;

      // Détecter les limites du mot ou groupe de mots séparé par des délimiteurs
      let start = offset;
      while (start > 0 && /[\wÀ-ÿ0-9\-\/]/i.test(text[start - 1])) {
        start--;
      }
      let end = offset;
      while (end < text.length && /[\wÀ-ÿ0-9\-\/]/i.test(text[end])) {
        end++;
      }

      const word = text.slice(start, end).trim().toUpperCase();
      if (GLOSSARY[word]) return word;

      // Vérifier les variantes (ex: sans tiret final ou parenthèses)
      const cleanWord = word.replace(/^[^\w]+|[^\w]+$/g, '');
      if (GLOSSARY[cleanWord]) return cleanWord;

      return null;
    },

    // Attache l'attribut title natif aux balises et gère l'écouteur interactif
    init() {
      this.ensureTooltipElement();

      // Écouteur global ultra réactif au survol de la souris
      document.addEventListener('mouseover', (e) => {
        const target = e.target;
        if (!target) return;

        // 1. Cible directe <abbr> ou élément avec data-abbr
        const abbrEl = target.closest('[data-abbr], abbr');
        if (abbrEl) {
          const key = abbrEl.getAttribute('data-abbr') || abbrEl.textContent.trim().toUpperCase();
          if (GLOSSARY[key]) {
            this.showTooltip(key, abbrEl.getBoundingClientRect(), { x: e.clientX, y: e.clientY });
            return;
          }
        }

        // 2. Si l'élément cible est un badge, bouton, puce ou cellule courte dont le texte est directement une abréviation
        const directText = target.children.length === 0 ? target.textContent.trim().toUpperCase() : null;
        if (directText && GLOSSARY[directText]) {
          if (!target.title) target.title = GLOSSARY[directText].fullName;
          this.showTooltip(directText, target.getBoundingClientRect(), { x: e.clientX, y: e.clientY });
          return;
        }

        // 2b. Conteneur compact ou badge stylé
        const badgeEl = target.closest('[class*="badge"], [class*="pill"], .tag, button, span');
        if (badgeEl) {
          const badgeText = badgeEl.textContent.trim().toUpperCase();
          if (GLOSSARY[badgeText]) {
            if (!badgeEl.title) badgeEl.title = GLOSSARY[badgeText].fullName;
            this.showTooltip(badgeText, badgeEl.getBoundingClientRect(), { x: e.clientX, y: e.clientY });
            return;
          }
        }

        // 3. Détection du mot sous le curseur dans le texte
        const word = this.getWordUnderCursor(e);
        if (word && GLOSSARY[word]) {
          this.showTooltip(word, target.getBoundingClientRect(), { x: e.clientX, y: e.clientY });
          return;
        }

        // Si rien n'est matché sur cet élément, masquer l'infobulle
        if (!target.closest('#global-abbr-tooltip')) {
          this.hideTooltip();
        }
      }, { passive: true });

      // Clic ou tap tactile pour les écrans tactiles et mobiles
      document.addEventListener('click', (e) => {
        const target = e.target;
        if (!target || target.closest('#global-abbr-tooltip')) return;

        const abbrEl = target.closest('[data-abbr], abbr');
        if (abbrEl) {
          const key = abbrEl.getAttribute('data-abbr') || abbrEl.textContent.trim().toUpperCase();
          if (GLOSSARY[key]) {
            this.showTooltip(key, abbrEl.getBoundingClientRect(), { x: e.clientX, y: e.clientY });
            return;
          }
        }
        const directText = target.children.length === 0 ? target.textContent.trim().toUpperCase() : null;
        if (directText && GLOSSARY[directText]) {
          this.showTooltip(directText, target.getBoundingClientRect(), { x: e.clientX, y: e.clientY });
          return;
        }
        const word = this.getWordUnderCursor(e);
        if (word && GLOSSARY[word]) {
          this.showTooltip(word, target.getBoundingClientRect(), { x: e.clientX, y: e.clientY });
          return;
        }

        this.hideTooltip();
      });

      // Suivre le déplacement de la souris pour ajuster la position si active
      document.addEventListener('mousemove', (e) => {
        const tip = document.getElementById('global-abbr-tooltip');
        if (tip && !tip.classList.contains('hidden')) {
          const width = tip.offsetWidth || 280;
          const height = tip.offsetHeight || 100;

          let left = e.clientX + 14;
          let top = e.clientY + 18;

          if (left + width > window.innerWidth - 12) {
            left = e.clientX - width - 14;
          }
          if (left < 12) left = 12;

          if (top + height > window.innerHeight - 12) {
            top = e.clientY - height - 12;
          }
          if (top < 12) top = 12;

          tip.style.left = `${left}px`;
          tip.style.top = `${top}px`;
        }
      }, { passive: true });

      // Masquer quand le curseur quitte la fenêtre ou un élément
      document.addEventListener('mouseout', (e) => {
        if (!e.relatedTarget) {
          this.hideTooltip();
        }
      }, { passive: true });

      document.addEventListener('scroll', () => {
        this.hideTooltip();
      }, { passive: true });

      console.log('✓ [ProtecGlossaire] Système d’infobulles d’abréviations initialisé avec', Object.keys(GLOSSARY).length, 'termes officiels.');
    }
  };

  window.ProtecGlossaire = ProtecGlossaire;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ProtecGlossaire.init());
  } else {
    ProtecGlossaire.init();
  }
})();
