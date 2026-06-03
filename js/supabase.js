// Initializes a global Supabase client used by all pages.
// Loaded after the Supabase CDN script and after js/config.js.
(function initSupabase() {
  if (!window.supabase || !window.AC_CONFIG) {
    console.warn("Supabase SDK or config missing");
    return;
  }
  window.sb = window.supabase.createClient(
    window.AC_CONFIG.SUPABASE_URL,
    window.AC_CONFIG.SUPABASE_ANON_KEY,
    {
      auth: {
        // "Remember this device": keep the session in localStorage and
        // silently refresh it so Ayla stays signed in for weeks per device
        // without needing a fresh magic link.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "ac-website-auth"
      }
    }
  );
})();

// Helper: friendly error rendering
window.acShowError = function (message) {
  console.error(message);
  const banner = document.createElement("div");
  banner.className = "banner banner-warn";
  banner.textContent = message;
  const container = document.querySelector(".container");
  if (container) container.prepend(banner);
};
