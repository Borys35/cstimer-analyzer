import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Referenced literally so Next.js inlines them into the client bundle.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** False when the env vars are missing: the app then runs guest-only. */
export const supabaseConfigured = Boolean(url && publishableKey);

let client: SupabaseClient | null = null;

/** Browser-only singleton; null on the server or when not configured. */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured || typeof window === "undefined") return null;
  client ??= createClient(url!, publishableKey!, {
    auth: {
      // Implicit flow: the magic link carries the session in the URL hash, so
      // it works even when opened in a different browser than the one that
      // requested it (e.g. a phone's mail app). PKCE would fail there.
      flowType: "implicit",
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return client;
}

/**
 * Supabase reports a failed magic link (expired, already used) as
 * `#error=...&error_description=...` on the redirect. Read it before the
 * client consumes the URL, and strip it so a reload doesn't repeat it.
 */
export function takeAuthErrorFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search.slice(1));
  if (!params.get("error") && !params.get("error_description")) return null;
  const description = params.get("error_description")?.replace(/\+/g, " ");
  const code = params.get("error_code");
  window.history.replaceState(null, "", window.location.pathname);
  if (code === "otp_expired") return "That sign-in link has expired or was already used. Request a new one.";
  return description || "Sign-in failed. Request a new link.";
}
