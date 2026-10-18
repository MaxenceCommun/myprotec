#!/usr/bin/env node
/**
 * PROTEC LIVE / MYPROTEC - SCRIPT D'ÉMISSION WEB PUSH CLI
 * 
 * Permet d'envoyer une notification Web Push en direct à un endpoint ou un utilisateur
 * pour tester le réveil du terminal même lorsque l'application PWA est fermée.
 * 
 * Utilisation :
 *   node send_push_test.js
 *   node send_push_test.js --endpoint "https://fcm.googleapis.com/fcm/send/..."
 *   node send_push_test.js --user "usr_123"
 *   node send_push_test.js --title "🚨 Alerte 15" --body "Intervention urgente SAMU !"
 */

const webpush = require('web-push');
const db = require('./db');

async function main() {
  console.log('====================================================');
  console.log('📢 PROTEC LIVE - DIFFUSION WEB PUSH (TEST CLI)');
  console.log('====================================================\n');

  // 1. Initialisation des clés VAPID
  const vapidKeys = db.getOrCreateVapidKeys();
  if (!vapidKeys || !vapidKeys.publicKey || !vapidKeys.privateKey) {
    console.error('❌ Erreur : Impossible de charger ou générer les clés VAPID.');
    process.exit(1);
  }

  webpush.setVapidDetails(
    vapidKeys.subject || 'mailto:contact@myprotec.fr',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );

  console.log('🔑 Clés VAPID chargées :');
  console.log(`   - Clé Publique : ${vapidKeys.publicKey.slice(0, 25)}... (${vapidKeys.publicKey.length} chars)`);
  console.log(`   - Contact : ${vapidKeys.subject || 'mailto:contact@myprotec.fr'}\n`);

  // 2. Traitement des arguments CLI
  const args = process.argv.slice(2);
  let targetEndpoint = null;
  let targetUserId = null;
  let customTitle = null;
  let customBody = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--endpoint' && args[i + 1]) {
      targetEndpoint = args[i + 1];
      i++;
    } else if (args[i] === '--user' && args[i + 1]) {
      targetUserId = args[i + 1];
      i++;
    } else if (args[i] === '--title' && args[i + 1]) {
      customTitle = args[i + 1];
      i++;
    } else if (args[i] === '--body' && args[i + 1]) {
      customBody = args[i + 1];
      i++;
    }
  }

  // 3. Récupération de l'abonnement cible
  let subscriptions = db.getAllPushSubscriptions();
  
  // Fallback automatique : si aucun abonné local, interroger Supabase game_saves
  if (subscriptions.length === 0) {
    console.log('🔍 Aucun abonné local. Recherche des abonnements dans Supabase Cloud...');
    try {
      const supaUrl = 'https://yrayehhbqcnuiuejqsjz.supabase.co/rest/v1/game_saves?select=user_id,username,save_data->push_subscription';
      const supaRes = await fetch(supaUrl, {
        headers: {
          'apikey': 'sb_publishable__SL5mXhQJBnyBBxgJJajXw_tCxJzlPs',
          'Authorization': 'Bearer sb_publishable__SL5mXhQJBnyBBxgJJajXw_tCxJzlPs'
        }
      });
      if (supaRes.ok) {
        const supaData = await supaRes.json();
        (supaData || []).forEach(row => {
          if (row.push_subscription && row.push_subscription.endpoint) {
            const sub = row.push_subscription;
            subscriptions.push({
              endpoint: sub.endpoint,
              keys: sub.keys || {},
              p256dh: sub.keys?.p256dh,
              auth: sub.keys?.auth,
              user_id: row.user_id,
              username: row.username || 'Directeur Cloud'
            });
          }
        });
        console.log(`☁️ Abonnements trouvés dans Supabase : ${subscriptions.length}`);
      }
    } catch (e) {
      console.warn('⚠️ Impossible de joindre Supabase :', e.message);
    }
  }

  console.log(`📋 Abonnements utilisables : ${subscriptions.length}`);

  let subscription = null;
  if (targetEndpoint) {
    subscription = db.getPushSubscription(targetEndpoint) || subscriptions.find(s => s.endpoint === targetEndpoint);
    if (!subscription) {
      console.warn(`⚠️ Endpoint non trouvé dans la BDD, utilisation directe...`);
      subscription = { endpoint: targetEndpoint };
    }
  } else if (targetUserId) {
    subscription = subscriptions.find(s => s.user_id === targetUserId || s.userId === targetUserId || (s.username && s.username.toLowerCase() === targetUserId.toLowerCase()));
    if (!subscription) {
      console.error(`❌ Aucun abonnement trouvé pour l'utilisateur ${targetUserId}`);
      process.exit(1);
    }
  } else {
    if (subscriptions.length === 0) {
      console.error('❌ Aucun abonnement push disponible en base locale ou sur Supabase.');
      console.log('👉 Ouvrez https://.../jeu.html et autorisez les notifications pour vous abonner.');
      process.exit(1);
    }
    // Prendre le dernier abonné
    subscription = subscriptions[subscriptions.length - 1];
  }

  console.log(`🎯 Cible de diffusion :`);
  console.log(`   - Utilisateur : ${subscription.username || subscription.user_id || 'Inconnu'}`);
  console.log(`   - Endpoint    : ${subscription.endpoint.slice(0, 65)}...`);
  console.log(`   - ID Sub      : ${subscription.id || 'N/A'}`);

  const p256dh = subscription.p256dh || subscription.keys?.p256dh;
  const auth = subscription.auth || subscription.keys?.auth;

  if (!p256dh || !auth) {
    console.error('❌ Clés p256dh ou auth manquantes pour cet abonnement.');
    process.exit(1);
  }

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: { p256dh, auth }
  };

  // 4. Construction du payload de notification conforme aux spécifications
  const payload = {
    title: customTitle || '🚨 ALERTE TEST MYPROTEC',
    body: customBody || 'Notification Web Push reçue avec succès ! Le réveil fonctionne même lorsque la PWA est totalement fermée.',
    icon: 'https://myprotec.fr/badge-monochrome.png',
    badge: 'https://myprotec.fr/badge-monochrome.png',
    data: {
      url: '/jeu.html',
      sentAt: new Date().toISOString(),
      source: 'CLI_TEST'
    }
  };

  console.log(`\n📦 Payload envoyé :`);
  console.log(JSON.stringify(payload, null, 2));

  // 5. Envoi effectif
  console.log('\n🚀 Envoi de la notification aux serveurs Push (FCM / Mozilla / Apple)...');
  try {
    const response = await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload),
      {
        TTL: 86400,
        urgency: 'high'
      }
    );

    console.log('\n🎉 SUCCÈS ! Notification transmise à la passerelle de push.');
    console.log(`   - Statut HTTP : ${response.statusCode}`);
    console.log(`   - Headers TTL  : ${response.headers ? response.headers['ttl'] || '86400' : '86400'}`);
    console.log('\n📲 L’appareil récepteur doit afficher la notification immédiatement, même éteint ou avec la PWA fermée.');
  } catch (error) {
    console.error('\n❌ Échec de l’envoi Web Push :');
    console.error(`   - Code Statut : ${error.statusCode || 'Inconnu'}`);
    console.error(`   - Message     : ${error.message}`);
    if (error.body) console.error(`   - Réponse API : ${error.body}`);

    if (error.statusCode === 404 || error.statusCode === 410) {
      console.warn('⚠️ L’abonnement a expiré ou a été révoqué par le navigateur. Nettoyage en base...');
      db.deletePushSubscription(subscription.endpoint);
      console.log('   -> Abonnement supprimé de la BDD.');
    }
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Exception non gérée :', err);
  process.exit(1);
});
