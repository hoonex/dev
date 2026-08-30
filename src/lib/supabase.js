let clientPromise;

export function getConfig() {
  const config = window.__STUDY_ROOM_CONFIG__ || {};
  const url = config.supabaseUrl || "";
  const key = config.supabasePublishableKey || "";
  const configured = /^https?:\/\//.test(url) && Boolean(key) && !key.includes("YOUR_KEY");
  return { url, key, configured };
}

export async function getSupabase() {
  const { url, key, configured } = getConfig();
  if (!configured) return null;
  if (!clientPromise) {
    clientPromise = import("https://esm.sh/@supabase/supabase-js@2.57.4").then(({ createClient }) =>
      createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      })
    );
  }
  return clientPromise;
}
