// =============================================================
// Auth gate — runs on every protected page.
// Magic-link sign-in via Supabase; only OWNER_EMAIL may use the
// app (enforced both client-side here and server-side via RLS).
// =============================================================

window.acAuth = {
  async getSession() {
    if (!window.sb) return null;
    const { data } = await window.sb.auth.getSession();
    return data ? data.session : null;
  },

  async signInMagicLink(email) {
    if (!window.sb) throw new Error("Supabase not loaded yet");
    const owner = (window.AC_CONFIG && window.AC_CONFIG.OWNER_EMAIL || "").toLowerCase();
    if (email.trim().toLowerCase() !== owner) {
      throw new Error("That email isn't on the allowlist for this site.");
    }
    const { error } = await window.sb.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + window.location.pathname.replace(/login\.html$/, "index.html") }
    });
    if (error) throw error;
  },

  async signOut() {
    if (!window.sb) return;
    await window.sb.auth.signOut();
    window.location.href = "login.html";
  },

  // Use at the top of any protected page:
  //   const session = await acAuth.requireAuth();
  //   if (!session) return;
  async requireAuth() {
    // Wait briefly for Supabase to be ready (SDK + config + supabase.js)
    let tries = 0;
    while (!window.sb && tries < 50) {
      await new Promise(r => setTimeout(r, 20));
      tries++;
    }
    const session = await this.getSession();
    if (!session) {
      window.location.replace("login.html");
      return null;
    }
    return session;
  },

  // Renders the email + sign-out button in the nav (if those nodes exist).
  paintNav(session) {
    const emailEl = document.getElementById("nav-user-email");
    if (emailEl && session && session.user) emailEl.textContent = session.user.email;
    const outBtn = document.getElementById("nav-signout");
    if (outBtn) outBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.acAuth.signOut();
    });
  }
};
