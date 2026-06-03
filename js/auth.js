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

  async signInWithPassword(email, password) {
    if (!window.sb) throw new Error("Supabase not loaded yet");
    const owner = (window.AC_CONFIG && window.AC_CONFIG.OWNER_EMAIL || "").toLowerCase();
    if (email.trim().toLowerCase() !== owner) {
      throw new Error("That email isn't on the allowlist for this site.");
    }
    const { error } = await window.sb.auth.signInWithPassword({
      email: email.trim(),
      password
    });
    if (error) throw error;
  },

  // Sets/updates the password for the currently signed-in user.
  async setPassword(newPassword) {
    if (!window.sb) throw new Error("Supabase not loaded yet");
    const { error } = await window.sb.auth.updateUser({ password: newPassword });
    if (error) throw error;
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

  // Renders the sign-out button in the nav (if present) + the brand pic.
  paintNav(session) {
    const outBtn = document.getElementById("nav-signout");
    if (outBtn) outBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.acAuth.signOut();
    });
    // Swap the "Ayla" brand text for the small profile pic, if one is set.
    this.paintBrandPic();
  },

  // Loads the profile pic into the top-nav brand on every page.
  async paintBrandPic() {
    const img = document.getElementById("brand-pic");
    const fallback = document.getElementById("brand-fallback");
    if (!img || !window.sb) return;
    try {
      const { data } = await window.sb.from("profile").select("profile_pic_path").eq("id", 1).single();
      if (!data || !data.profile_pic_path) return;
      const { data: signed } = await window.sb.storage
        .from("profile").createSignedUrl(data.profile_pic_path, 3600);
      if (signed && signed.signedUrl) {
        img.src = signed.signedUrl;
        img.style.display = "block";
        if (fallback) fallback.style.display = "none";
      }
    } catch (_) { /* keep the text fallback on any error */ }
  }
};
