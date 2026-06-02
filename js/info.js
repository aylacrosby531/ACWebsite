// =============================================================
// My Info page
// Profile (name, tagline, pic), resumes list, cover letters list,
// quick links.
// =============================================================

const $picImg = document.getElementById("profile-pic");
const $picPlaceholder = document.getElementById("profile-pic-placeholder");
const $picUpload = document.getElementById("pic-upload");
const $name = document.getElementById("profile-name");
const $tagline = document.getElementById("profile-tagline");

const $resumeUpload = document.getElementById("resume-upload");
const $resumeList = document.getElementById("resume-list");
const $resumeStatus = document.getElementById("resume-status");

const $coverUpload = document.getElementById("cover-upload");
const $coverList = document.getElementById("cover-list");
const $coverStatus = document.getElementById("cover-status");

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
  if (error) { acShowError("Couldn't load profile: " + error.message); return; }
  if (data.name) $name.textContent = data.name;
  if (data.tagline) $tagline.textContent = data.tagline;
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

// --------- Quick Links ---------
async function loadLinks() {
  if (!window.sb) return;
  const { data, error } = await window.sb.from("quick_links").select("*").order("created_at");
  if (error) { acShowError(error.message); return; }
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
        <button class="btn btn-ghost btn-sm" data-action="copy-link" data-url="${escapeAttr(l.url)}">Copy</button>
        <a class="btn btn-ghost btn-sm" href="${escapeAttr(l.url)}" target="_blank" rel="noopener">Open ↗</a>
        <button class="btn btn-ghost btn-sm" data-action="del-link" data-id="${l.id}" style="color:#b91c1c;border-color:#fca5a5;">Delete</button>
      </div>
    </div>`).join("");
}

function normalizeUrl(raw) {
  const s = (raw || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (/^mailto:|^tel:/i.test(s)) return s;
  return "https://" + s.replace(/^\/+/, "");
}

async function saveLink(e) {
  e.preventDefault();
  const { error } = await window.sb.from("quick_links").insert({
    label: $linkLabel.value.trim(),
    url: normalizeUrl($linkUrl.value)
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
$picUpload.addEventListener("change", (e) => uploadPic(e.target.files[0]));
$resumeUpload.addEventListener("change", async (e) => {
  await uploadToFolder("resumes", Array.from(e.target.files));
  await loadResumes();
});
$coverUpload.addEventListener("change", async (e) => {
  await uploadToFolder("cover-letters", Array.from(e.target.files));
  await loadCovers();
});

$addLinkBtn.addEventListener("click", () => $linkModal.classList.add("open"));
$cancelLink.addEventListener("click", () => $linkModal.classList.remove("open"));
$linkModal.addEventListener("click", (e) => { if (e.target === $linkModal) $linkModal.classList.remove("open"); });
$linkForm.addEventListener("submit", saveLink);

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-action]");
  if (!t) return;
  if (t.dataset.action === "dl-doc") downloadDoc(t.dataset.path);
  if (t.dataset.action === "del-doc") deleteDoc(t.dataset.path, t.dataset.folder);
  if (t.dataset.action === "del-link") deleteLink(t.dataset.id);
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
  loadLinks();
})();
