// =============================================================
// My Info page
// Profile (name, tagline, pic), resumes list, cover letters list,
// quick links.
// =============================================================

const $picImg = document.getElementById("profile-pic");
const $picPlaceholder = document.getElementById("profile-pic-placeholder");
const $picUpload = document.getElementById("pic-upload");
const $name = document.getElementById("profile-name");
const $intro = document.getElementById("intro-text");
const $copyIntro = document.getElementById("btn-copy-intro");
const $saveIntro = document.getElementById("btn-save-intro");
const $introSaved = document.getElementById("intro-saved");

// Draft mini cover letter — built from Ayla's resume + cover letters.
// Generic/reusable for "additional information" boxes; she can edit & save.
const DEFAULT_INTRO =
`I'm an environmental scientist who turns complex environmental data into information people can trust and act on. At the Alaska Department of Environmental Conservation I run a statewide community air-monitoring network — 70+ sensors across 40+ communities — and when our team had no good way to manage it, I taught myself to design and build a full data platform from scratch (now replacing commercial software that cost the state $7,000–20,000 a year). I care about doing the work right: I write the SOPs and QA/QC that keep our data defensible, run the analysis, and translate the results into plain-language reports and community calls.

I'm early in my career and energized by mission-driven, science-led work across climate, environment, and clean energy. What I bring is rigor about data, the initiative to build my own tools, clear communication, and genuine care about the impact — my work has shown me how directly this information shapes people's health and the decisions affecting our future. I'd love the chance to contribute.`;

const $resumeUpload = document.getElementById("resume-upload");
const $resumeList = document.getElementById("resume-list");
const $resumeStatus = document.getElementById("resume-status");

const $coverUpload = document.getElementById("cover-upload");
const $coverList = document.getElementById("cover-list");
const $coverStatus = document.getElementById("cover-status");

// --------- Profile ---------
async function loadProfile() {
  if (!window.sb) return;
  const { data, error } = await window.sb.from("profile").select("*").eq("id", 1).single();
  if (error) { acShowError("Couldn't load profile: " + error.message); return; }
  if (data.name) $name.textContent = data.name;
  if ($intro) $intro.value = data.bio || DEFAULT_INTRO;
  if (data.profile_pic_path) {
    const { data: signed } = await window.sb.storage.from("profile").createSignedUrl(data.profile_pic_path, 3600);
    if (signed && signed.signedUrl) {
      $picImg.src = signed.signedUrl;
      $picImg.style.display = "block";
      $picPlaceholder.style.display = "none";
    }
  }
}

async function uploadPic(file) {
  if (!file || !window.sb) return;
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `profile-pic.${ext}`;
  const { error: upErr } = await window.sb.storage.from("profile").upload(path, file, { upsert: true });
  if (upErr) { acShowError("Upload failed: " + upErr.message); return; }
  const { error: dbErr } = await window.sb.from("profile")
    .update({ profile_pic_path: path, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (dbErr) { acShowError("Save failed: " + dbErr.message); return; }
  await loadProfile();
}

// --------- Generic file section (used by resumes + cover letters) ---------
async function loadFolder(folder, $list, $status, emptyMsg) {
  if (!window.sb) return;
  $status.style.display = "block";
  const { data, error } = await window.sb.storage.from("documents").list(folder, {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" }
  });
  $status.style.display = "none";
  if (error) { acShowError("Couldn't list " + folder + ": " + error.message); return; }
  const files = (data || []).filter(f => f.name && !f.name.startsWith("."));
  if (!files.length) {
    $list.innerHTML = `<div style="color:var(--muted);font-size:13px;padding:8px 0;">${emptyMsg}</div>`;
    return;
  }
  $list.innerHTML = files.map(f => `
    <div class="file-row">
      <div>
        <div class="name">${escapeHtml(stripTimestamp(f.name))}</div>
        <div class="meta">${fmtSize(f.metadata && f.metadata.size)} &middot; uploaded ${fmtDate(f.created_at)}</div>
      </div>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-ghost btn-sm" data-action="dl-doc" data-path="${folder}/${escapeAttr(f.name)}">Open</button>
        <button class="btn btn-ghost btn-sm" data-action="del-doc" data-path="${folder}/${escapeAttr(f.name)}" data-folder="${folder}" style="color:#b91c1c;border-color:#fca5a5;">Delete</button>
      </div>
    </div>`).join("");
}

async function uploadToFolder(folder, files) {
  if (!window.sb || !files.length) return;
  for (const file of files) {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${folder}/${Date.now()}_${safe}`;
    const { error } = await window.sb.storage.from("documents").upload(path, file);
    if (error) acShowError(`Upload of ${file.name} failed: ${error.message}`);
  }
}

const loadResumes = () => loadFolder("resumes", $resumeList, $resumeStatus, "No resumes uploaded yet.");
const loadCovers  = () => loadFolder("cover-letters", $coverList, $coverStatus, "No cover letters uploaded yet.");

async function downloadDoc(path) {
  const { data, error } = await window.sb.storage.from("documents").createSignedUrl(path, 60);
  if (error) { acShowError(error.message); return; }
  window.open(data.signedUrl, "_blank");
}

async function deleteDoc(path, folder) {
  if (!confirm("Delete this file?")) return;
  const { error } = await window.sb.storage.from("documents").remove([path]);
  if (error) { acShowError(error.message); return; }
  if (folder === "cover-letters") await loadCovers();
  else await loadResumes();
}

// --------- Helpers ---------
function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function stripTimestamp(name) {
  return name.replace(/^\d{13}_/, "");
}
function fmtSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
function fmtDate(s) {
  if (!s) return "";
  const d = new Date(s);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
}

// --------- Event wiring ---------
$picUpload.addEventListener("change", (e) => uploadPic(e.target.files[0]));

if ($saveIntro) $saveIntro.addEventListener("click", async () => {
  const { error } = await window.sb.from("profile")
    .update({ bio: $intro.value, updated_at: new Date().toISOString() }).eq("id", 1);
  if (error) { acShowError("Couldn't save: " + error.message); return; }
  $introSaved.textContent = "Saved ✓";
  setTimeout(() => { $introSaved.textContent = ""; }, 1500);
});
if ($copyIntro) $copyIntro.addEventListener("click", () => {
  navigator.clipboard.writeText($intro.value).then(() => {
    $copyIntro.textContent = "Copied ✓";
    setTimeout(() => { $copyIntro.textContent = "Copy"; }, 1200);
  }).catch(() => acShowError("Couldn't copy."));
});
const $newPassword = document.getElementById("new-password");
const $newPasswordConfirm = document.getElementById("new-password-confirm");
const $savePassword = document.getElementById("btn-save-password");
const $passwordSaved = document.getElementById("password-saved");
if ($savePassword) $savePassword.addEventListener("click", async () => {
  const pw = $newPassword.value;
  const pw2 = $newPasswordConfirm.value;
  if (pw.length < 6) { acShowError("Password must be at least 6 characters."); return; }
  if (pw !== pw2) { acShowError("The two passwords don't match."); return; }
  $savePassword.disabled = true;
  try {
    await window.acAuth.setPassword(pw);
    $newPassword.value = "";
    $newPasswordConfirm.value = "";
    $passwordSaved.textContent = "Password updated ✓";
    setTimeout(() => { $passwordSaved.textContent = ""; }, 2500);
  } catch (err) {
    acShowError("Couldn't update password: " + (err.message || err));
  } finally {
    $savePassword.disabled = false;
  }
});

$resumeUpload.addEventListener("change", async (e) => {
  await uploadToFolder("resumes", Array.from(e.target.files));
  await loadResumes();
});
$coverUpload.addEventListener("change", async (e) => {
  await uploadToFolder("cover-letters", Array.from(e.target.files));
  await loadCovers();
});

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-action]");
  if (!t) return;
  if (t.dataset.action === "dl-doc") downloadDoc(t.dataset.path);
  if (t.dataset.action === "del-doc") deleteDoc(t.dataset.path, t.dataset.folder);
  if (t.dataset.action === "copy-link") {
    navigator.clipboard.writeText(t.dataset.url).then(() => {
      const orig = t.textContent;
      t.textContent = "Copied ✓";
      setTimeout(() => { t.textContent = orig; }, 1200);
    }).catch(() => acShowError("Couldn't copy."));
  }
});

(async () => {
  const session = await window.acAuth.requireAuth();
  if (!session) return;
  window.acAuth.paintNav(session);
  document.body.style.visibility = "visible";
  loadProfile();
  loadResumes();
  loadCovers();
})();
