// ============================================================================
// SUPABASE EDGE FUNCTION : DÉPÊCHE WEB PUSH W3C (DENO / MYPROTEC)
// Réveille les smartphones des directeurs même application totalement fermée
// ============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "BKLdj5RykkIOWRhAriMzfKsYON-juKOqSvFCclSz6zgr0CRZdLlQOhfd9nAwmXZZjsNMJU-pl5Csy4Yg-c6mHe0";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "rgoFrFwds0VGKS46Hl2OUKrjlir3Htd3ccpvZ7aQQNA";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:contact@myprotec.fr";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { targetUserId, title, message, data, actions } = body;

    const payload = JSON.stringify({
      title: title || "🚨 ALERTE MYPROTEC",
      body: message || body.body || "Nouvelle alerte d'urgence reçue !",
      icon: "badge-monochrome.png",
      badge: "badge-monochrome.png",
      tag: `protec-alert-${Date.now()}`,
      data: data || { url: "jeu.html" },
      actions: actions || [
        { action: "action_open", title: "📍 Voir l'Intervention" },
        { action: "action_dispo", title: "✅ Disponible" }
      ]
    });

    let query = supabase.from("push_subscriptions").select("*");
    if (targetUserId && targetUserId !== "all") {
      query = query.eq("user_id", targetUserId);
    }

    const { data: subs, error } = await query;
    if (error) throw error;

    let sentCount = 0;
    const errors = [];

    if (subs && subs.length > 0) {
      for (const sub of subs) {
        try {
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          }, payload, {
            urgency: "high", // Réveil garanti de l'appareil
            TTL: 86400
          });
          sentCount++;
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Désabonnement ou expiration
            await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          }
          errors.push({ endpoint: sub.endpoint, error: err.message });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      count: sentCount,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
