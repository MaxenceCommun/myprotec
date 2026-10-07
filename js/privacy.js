// js/privacy.js - Mentions Légales & Politique de Confidentialité (Conformité Google AdSense & RGPD)
window.ProtecPrivacy = {
  openModal() {
    let modal = document.getElementById('privacy-modal');
    if (!modal) {
      this.createModalDOM();
      modal = document.getElementById('privacy-modal');
    }
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      if (window.lucide) window.lucide.createIcons();
    }
  },

  closeModal() {
    const modal = document.getElementById('privacy-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  createModalDOM() {
    const div = document.createElement('div');
    div.id = 'privacy-modal';
    div.className = 'hidden fixed inset-0 z-50 items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 animate-in fade-in';
    div.innerHTML = `
      <div class="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl glass-panel-heavy border border-white/80 p-6 shadow-2xl relative bg-white/95 text-slate-800">
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-200/80 mb-4 flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-blue-500/15 text-pc-blue flex items-center justify-center text-lg font-black">
              <i data-lucide="shield-check" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900">Politique de Confidentialité & Mentions Légales</h3>
              <p class="text-[11px] text-slate-500 font-semibold">Conformité RGPD & Règlement du Programme Google AdSense</p>
            </div>
          </div>
          <button onclick="window.ProtecPrivacy.closeModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- Content (Scrollable) -->
        <div class="overflow-y-auto pr-2 space-y-4 text-xs leading-relaxed text-slate-600 no-scrollbar">
          
          <!-- Section 1 : Nature du site & Droits d'auteur -->
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
            <h4 class="font-black text-slate-800 uppercase tracking-wide text-[11px] mb-1 flex items-center gap-1.5">
              <span>🏛️</span> 1. Nature du Site & Projet Indépendant
            </h4>
            <p>
              <strong>Protec Live</strong> est un jeu de simulation bénévole, ludique et éducatif inspiré des missions de sécurité civile et de secours à personne. Ce projet n'est pas un site institutionnel officiel gouvernemental. Les marques citées et matériels reproduits le sont à titre d'immersion réaliste.
            </p>
          </div>

          <!-- Section 2 : Publicités & Google AdSense -->
          <div class="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
            <h4 class="font-black text-amber-900 uppercase tracking-wide text-[11px] mb-1 flex items-center gap-1.5">
              <span>📢</span> 2. Fournisseurs Tiers & Publicités Google AdSense
            </h4>
            <p class="mb-2">
              Conformément au <strong>Règlement du programme Google AdSense</strong> (art. 48182) :
            </p>
            <ul class="list-disc pl-5 space-y-1.5 text-slate-700">
              <li>
                Des <strong>fournisseurs tiers, y compris Google</strong>, utilisent des cookies pour diffuser des annonces sur ce site sur la base des visites antérieures des internautes.
              </li>
              <li>
                Grâce aux <strong>cookies publicitaires</strong>, Google et ses partenaires adaptent les annonces diffusées auprès de vos visiteurs en fonction de leur navigation sur votre site et/ou d'autres sites du Web.
              </li>
              <li>
                <strong>Désactivation de la publicité personnalisée :</strong> Vous pouvez à tout moment désactiver les annonces personnalisées dans les paramètres des annonces Google en visitant : 
                <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" class="text-pc-blue font-bold underline hover:text-pc-orange">Paramètres des annonces Google</a> ou sur 
                <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" class="text-pc-blue font-bold underline hover:text-pc-orange">AboutAds.info</a>.
              </li>
              <li>
                <strong>Annonces récompensées :</strong> Le visionnage d'annonces vidéo récompensées est purement facultatif et accorde uniquement des crédits virtuels dans le simulateur (sans valeur monétaire réelle). Aucun clic forcé n'est imposé aux joueurs.
              </li>
            </ul>
          </div>

          <!-- Section 3 : Consentement Européen (CMP / RGPD / TCF v2.2) -->
          <div class="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80">
            <h4 class="font-black text-blue-900 uppercase tracking-wide text-[11px] mb-1 flex items-center gap-1.5">
              <span>🇪🇺</span> 3. Consentement pour les Utilisateurs Européens (CMP & RGPD)
            </h4>
            <p>
              Pour les résidents de l'Espace Économique Européen (EEE) et du Royaume-Uni, l'utilisation de traceurs et la diffusion d'annonces personnalisées sont soumises à votre consentement préalable, recueilli via une <strong>Plateforme de gestion du consentement (CMP) certifiée par Google</strong> et conforme au standard <em>TCF v2.2 de l'IAB</em>. Vous pouvez modifier vos préférences de consentement à tout moment via les paramètres du navigateur ou la bannière dédiée.
            </p>
          </div>

          <!-- Section 4 : Données Personnelles du Compte de Jeu -->
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
            <h4 class="font-black text-slate-800 uppercase tracking-wide text-[11px] mb-1 flex items-center gap-1.5">
              <span>🔒</span> 4. Données de Jeu & Inscription
            </h4>
            <p>
              Les seules données collectées lors de la création d'un compte sont : un pseudonyme de joueur, un mot de passe haché, et la progression de votre antenne (sauvegarde multijoueur). Aucune donnée personnelle nominative n'est vendue ni transmise à des tiers.
            </p>
          </div>

          <!-- Section 5 : Contact & Hébergement -->
          <div class="p-3 rounded-2xl bg-slate-100 border border-slate-200 text-[11px] text-slate-500">
            <p><strong>Fichier ads.txt :</strong> Accessible publiquement à l'adresse <code>/ads.txt</code> sur la racine du domaine pour authentifier les vendeurs d'inventaire publicitaire autorisés.</p>
          </div>

        </div>

        <!-- Footer -->
        <div class="pt-4 mt-3 border-t border-slate-200/80 flex items-center justify-between flex-shrink-0">
          <a href="/privacy.html" target="_blank" class="text-[11px] text-pc-blue font-bold hover:underline flex items-center gap-1">
            <i data-lucide="external-link" class="w-3.5 h-3.5"></i> Page URL dédiée (/privacy.html)
          </a>
          <button onclick="window.ProtecPrivacy.closeModal()" class="px-5 py-2.5 rounded-xl text-xs font-black bg-pc-blue text-white shadow-md hover:brightness-110 active:scale-95 transition">
            J'ai compris / Fermer
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(div);
  }
};
