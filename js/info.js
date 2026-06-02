// =============================================================
// My Info page
// Profile (name, tagline, bio, pic), resumes list, quick links.
// =============================================================

const $picImg = document.getElementById("profile-pic");
const $picPlaceholder = document.getElementById("profile-pic-placeholder");
const $picUpload = document.getElementById("pic-upload");
const $name = document.getElementById("profile-name");
const $tagline = document.getElementById("profile-tagline");
const $bio = document.getElementById("bio-text");
const $saveBio = document.getElementById("btn-save-bio");

const $resumeUpload = document.getElementById("resume-upload");
const $resumeList = document.getElementById("resume-list");
const $resumeStatus = document.getElementById("resume-status");

const $linkList = document.getElementById("link-list");
const $addLinkBtn = document.getElementById("btn-add-link");
const $linkModal = document.getElementById("modal-backdrop");
const $linkForm = document.getElementById("link-form");
const $linkLabel = document.getElementById("link-label");
const $linkUrl = document.getElementById("link-url");
const $cancelLink = document.getElementById("btn-cancel-link");

// --------- Profile ---------
async function loadProfile() {
  if (!window.sb) return;
  const { data, error } = await window.sb.from("profile").select("*").eq("id", 1).single();
  if (error) {
    acShowError("Couldn't load profile: " + error.message);
    return;
  }
  if (data.name) $name.textContent = data.name;
  if (data.tagline) $tagline.textContent = data.tagline;
  if (data.bio) $bio.value = data.bio;
  if (data.profile_pic_path) {
    const { data: signed } = await window.sb.storage.from("profile").createSignedUrl(data.profile_pic_path, 3600);
    if (signed && signed.signedUrl) {
      $picImg.src = signed.signedUrl;
      $picImg.style.display = "block";
      $picPlaceholder.style.display = "none";
    }
  }
}

async function saveBio() {
  if (!window.sb) return;
  $saveBio.disabled = true;
  $saveBio.textContent = "Saving…";
  const { error } = await window.sb.from("profile")
    .update({ bio: $bio.value, updated_at: new Date().toISOString() })
    .eq("id", 1);
  $saveBio.disabled = false;
  $saveBio.textContent = "Save";
  if (error) {
    acShowError("Save failed: " + error.message);
    return;
  }
  flash($saveBio, "Saved ✓");
}

function flash(btn, msg) {
  const orig = btn.textContent;
  btn.textContent = msg;
  setTimeout(() => { btn.textContent = orig; }, 1500);
}

async function uploadPic(file) {
  if (!file || !window.sb) return;
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `profile-pic.${ext}`;

  // Upload (upsert so it overwrites the existing one)
  const { error: upErr } = await window.sb.storage.from("profile").upload(path, file, { upsert: true });
  if (upErr) { acShowError("Upload failed: " + upErr.message); return; }

  // Save path in profile row
  const { error: dbErr } = await window.sb.from("profile")
    .update({ profile_pic_path: path, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (dbErr) { acShowError("Save failed: " + dbErr.message); return; }

  await loadProfile();
}

// --------- Resumes ---------
async function loadResumes() {
  if (!window.sb) return;
  $resumeStatus.style.display = "block";
  const { data, error } = await window.sb.storage.from("documents").list("resumes", {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" }
  });
  $resumeStatus.style.display = "none";
  if (error) {
    acShowError("Couldn't list resumes: " + error.message);
    return;
  }
  const files = (data || []).filter(f => f.name && !f.name.startsWith("."));
  if (!files.length) {
    $resumeList.innerHTML = `<div style="color:var(--muted);font-size:13px;padding:8px 0;">No resumes uploaded yet.</div>`;
    return;
  }
  $resumeList.innerHTML = files.map(f => `
    <div class="file-row">
      <div>
        <div class="name">${escapeHtml(stripTimestamp(f.name))}</div>
        <div class="meta">${fmtSize(f.metadata && f.metadata.size)} &middot; uploaded ${fmtDate(f.created_at)}</div>
      </div>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-ghost btn-sm" data-action="dl-resume" data-path="resumes/${escapeAttr(f.name)}">Open</button>
        <button class="btn btn-ghost btn-sm" data-action="del-resume" data-path="resumes/${escapeAttr(f.name)}" style="color:#b91c1c;border-color:#fca5a5;">Delete</button>
      </div>
    </div>`).join("");
}

async function uploadResumes(files) {
  if (!window.sb || !files.length) return;
  for (const file of files) {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `resumes/${Date.now()}_${safe}`;
    const { error } = await window.sb.storage.from("documents").upload(path, file);
    if (error) { acShowError(`Upload of ${file.name} failed: ${error.message}`); }
  }
  await loadResumes();
}

async function downloadDoc(path) {
  const { data, error } = await window.sb.storage.from("documents").createSignedUrl(path, 60);
  if (error) { acShowError(error.message); return; }
  window.open(data.signedUrl, "_blank");
}

async function deleteDoc(path) {
  if (!confirm("Delete this file?")) return;
  const { error } = await window.sb.storage.from("documents").remove([path]);
  if (error) { acShowError(error.message); return; }
  await loadResumes();
}

// --------- Quick Links ---------
async function loadLinks() {
  if (!window.sb) return;
  const { data, error } = await window.sb.from("quick_links").select("*").order("created_at");
  if (error) { acShowError(error.message); return; }
  // LinkedIn always shown by default at the top
  if (!(data || []).length) {
    $linkList.innerHTML = `<div style="color:var(--muted);font-size:13px;padding:8px 0;">No quick links yet — try Portfolio, GitHub, Email.</div>`;
    return;
  }
  $linkList.innerHTML = data.map(l => `
    <div class="file-row">
      <div>
        <div class="name">${escapeHtml(l.label)}</div>
        <div class="meta">${escapeHtml(l.url)}</div>
      </div>
      <div style="display:flex;gap:6px;">
        <a class="btn btn-ghost btn-sm" href="${escapeAttr(l.url)}" target="_blank" rel="noopener">Open ↗</a>
        <button class="btn btn-ghost btn-sm" data-action="del-link" data-id="${l.id}" style="color:#b91c1c;border-color:#fca5a5;">Delete</button>
      </div>
    </div>`).join("");
}

async function saveLink(e) {
  e.preventDefault();
  const { error } = await window.sb.from("quick_links").insert({
    label: $linkLabel.value.trim(),
    url: $linkUrl.value.trim()
  });
  if (error) { acShowError(error.message); return; }
  $linkModal.classList.remove("open");
  $linkForm.reset();
  await loadLinks();
}

async function deleteLink(id) {
  if (!confirm("Delete this link?")) return;
  const { error } = await window.sb.from("quick_links").delete().eq("id", id);
  if (error) { acShowError(error.message); return; }
  await loadLinks();
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
$saveBio.addEventListener("click", saveBio);
$picUpload.addEventListener("change", (e) => uploadPic(e.target.files[0]));
$resumeUpload.addEventListener("change", (e) => uploadResumes(Array.from(e.target.files)));

$addLinkBtn.addEventListener("click", () => $linkModal.classList.add("open"));
$cancelLink.addEventListener("click", () => $linkModal.classList.remove("open"));
$linkModal.addEventListener("click", (e) => { if (e.target === $linkModal) $linkModal.classList.remove("open"); });
$linkForm.addEventListener("submit", saveLink);

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-action]");
  if (!t) return;
  if (t.dataset.action === "dl-resume") downloadDoc(t.dataset.path);
  if (t.dataset.action === "del-resume") deleteDoc(t.dataset.path);
  if (t.dataset.action === "del-link") deleteLink(t.dataset.id);
});

loadProfile();
loadResumes();
loadLinks();
