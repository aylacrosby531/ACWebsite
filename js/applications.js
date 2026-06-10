// =============================================================
// My Applications page
// CRUD against the `applications` table + file uploads to the
// `documents` storage bucket for resumes & cover letters.
// =============================================================

const $list = document.getElementById("app-list");
const $status = document.getElementById("app-status");
const $statusFilter = document.getElementById("filter-status");
const $search = document.getElementById("filter-search");
const $addBtn = document.getElementById("btn-add");

const $modal = document.getElementById("modal-backdrop");
const $form = document.getElementById("app-form");
const $modalTitle = document.getElementById("modal-title");
const $cancelBtn = document.getElementById("btn-cancel");

const fields = {
  id: document.getElementById("app-id"),
  company: document.getElementById("app-company"),
  role: document.getElementById("app-role"),
  status: document.getElementById("app-status-input"),
  date: document.getElementById("app-date"),
  url: document.getElementById("app-url"),
  resume: document.getElementById("app-resume"),
  resumeCurrent: document.getElementById("app-resume-current"),
  cover: document.getElementById("app-cover"),
  coverCurrent: document.getElementById("app-cover-current"),
  shortAnswers: document.getElementById("app-short-answers"),
  notes: document.getElementById("app-notes")
};

let allApps = [];

function openModal(app = null) {
  $form.reset();
  fields.id.value = "";
  fields.resumeCurrent.textContent = "";
  fields.coverCurrent.textContent = "";
  window.acRichText.init(fields.shortAnswers);
  window.acRichText.init(fields.notes);
  window.acRichText.setHTML(fields.shortAnswers, "");
  window.acRichText.setHTML(fields.notes, "");

  if (app) {
    $modalTitle.textContent = "Edit Application";
    fields.id.value = app.id;
    fields.company.value = app.company || "";
    fields.role.value = app.role || "";
    fields.status.value = app.status || "applied";
    fields.date.value = app.date_applied || "";
    fields.url.value = app.url || "";
    window.acRichText.setHTML(fields.shortAnswers, app.short_answers || "");
    window.acRichText.setHTML(fields.notes, app.notes || "");
    if (app.resume_path) {
      fields.resumeCurrent.innerHTML = `Current: <a href="#" data-path="${app.resume_path}" class="dl-link">${app.resume_path.split("/").pop()}</a>`;
    }
    if (app.cover_path) {
      fields.coverCurrent.innerHTML = `Current: <a href="#" data-path="${app.cover_path}" class="dl-link">${app.cover_path.split("/").pop()}</a>`;
    }
  } else {
    $modalTitle.textContent = "Add Application";
    fields.date.value = new Date().toISOString().slice(0, 10);
  }
  $modal.classList.add("open");
}

function closeModal() {
  $modal.classList.remove("open");
}

async function uploadFile(file, folder) {
  if (!file) return null;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${folder}/${Date.now()}_${safeName}`;
  const { error } = await window.sb.storage.from("documents").upload(path, file);
  if (error) throw new Error("Upload failed: " + error.message);
  return path;
}

async function downloadFile(path) {
  const { data, error } = await window.sb.storage.from("documents").createSignedUrl(path, 60);
  if (error) {
    acShowError("Couldn't open file: " + error.message);
    return;
  }
  window.open(data.signedUrl, "_blank");
}

async function saveApp(e) {
  e.preventDefault();
  if (!window.sb) {
    acShowError("Supabase not ready.");
    return;
  }

  const submitBtn = $form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Saving…";

  try {
    const id = fields.id.value;
    let resumePath = null;
    let coverPath = null;

    if (fields.resume.files[0]) {
      resumePath = await uploadFile(fields.resume.files[0], "resumes");
    }
    if (fields.cover.files[0]) {
      coverPath = await uploadFile(fields.cover.files[0], "cover-letters");
    }

    const payload = {
      company: fields.company.value.trim(),
      role: fields.role.value.trim(),
      status: fields.status.value,
      date_applied: fields.date.value || null,
      url: fields.url.value.trim() ? (/^https?:\/\//i.test(fields.url.value.trim()) ? fields.url.value.trim() : "https://" + fields.url.value.trim().replace(/^\/+/, "")) : null,
      short_answers: window.acRichText.getHTML(fields.shortAnswers) || null,
      notes: window.acRichText.getHTML(fields.notes) || null,
      updated_at: new Date().toISOString()
    };
    if (resumePath) payload.resume_path = resumePath;
    if (coverPath) payload.cover_path = coverPath;

    if (id) {
      const { error } = await window.sb.from("applications").update(payload).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await window.sb.from("applications").insert(payload);
      if (error) throw error;
    }

    closeModal();
    await loadApps();
  } catch (err) {
    acShowError(err.message || "Save failed");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Save";
  }
}

async function deleteApp(id) {
  if (!confirm("Delete this application? This can't be undone.")) return;
  const { error } = await window.sb.from("applications").delete().eq("id", id);
  if (error) {
    acShowError("Delete failed: " + error.message);
    return;
  }
  await loadApps();
}

function renderApps(apps) {
  if (!apps.length) {
    $list.innerHTML = `
      <div class="empty-state">
        <h3>No applications yet</h3>
        <p>Hit "+ Add Application" to log my first one, or save from the Job Search page.</p>
      </div>`;
    return;
  }

  $list.innerHTML = apps.map(a => {
    // Show a date even if date_applied was never set (older/saved rows) by
    // falling back to when the row was created.
    const shownDate = a.date_applied || (a.created_at ? a.created_at.slice(0, 10) : "");
    return `
    <article class="card" data-id="${a.id}">
      <div class="card-header">
        <div>
          <div class="card-title">${escapeHtml(a.role)}</div>
          <div class="card-subtitle">${escapeHtml(a.company)}${shownDate ? " &middot; applied " + shownDate : ""}</div>
        </div>
        <select class="status-select badge-status-${a.status || 'applied'}" data-id="${a.id}" data-action="change-status" title="Click to change status">
          <option value="saved" ${a.status === 'saved' ? 'selected' : ''}>Saved</option>
          <option value="applied" ${a.status === 'applied' ? 'selected' : ''}>Applied</option>
          <option value="interview" ${a.status === 'interview' ? 'selected' : ''}>Interview</option>
          <option value="offer" ${a.status === 'offer' ? 'selected' : ''}>Offer</option>
          <option value="rejected" ${a.status === 'rejected' ? 'selected' : ''}>Rejected</option>
        </select>
      </div>
      ${a.short_answers ? `<details style="margin-top:8px;"><summary style="cursor:pointer;color:var(--navy);font-size:13px;font-weight:600;">Short answers</summary><div class="rich-display" style="margin-top:6px;font-size:13px;color:var(--ink);">${a.short_answers}</div></details>` : ""}
      ${a.notes ? `<div class="rich-display" style="font-size:13px;color:var(--muted);margin-top:8px;">${a.notes}</div>` : ""}
      <div class="card-actions">
        ${a.url ? `<a class="btn btn-ghost btn-sm" href="${escapeAttr(a.url)}" target="_blank" rel="noopener">Posting ↗</a>` : ""}
        ${a.resume_path ? `<button class="btn btn-ghost btn-sm" data-action="download" data-path="${escapeAttr(a.resume_path)}">📄 Resume</button>` : ""}
        ${a.cover_path ? `<button class="btn btn-ghost btn-sm" data-action="download" data-path="${escapeAttr(a.cover_path)}">✉️ Cover Letter</button>` : ""}
        <button class="btn btn-primary btn-sm" data-action="edit" data-id="${a.id}">Edit</button>
        <button class="btn btn-ghost btn-sm" data-action="delete" data-id="${a.id}" style="color:#b91c1c;border-color:#fca5a5;">Delete</button>
      </div>
    </article>`;
  }).join("");
}

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

function applyFilters() {
  const s = $statusFilter.value;
  const q = $search.value.trim().toLowerCase();
  let filtered = allApps.slice();
  if (s !== "all") filtered = filtered.filter(a => a.status === s);
  if (q) filtered = filtered.filter(a =>
    (a.company || "").toLowerCase().includes(q) ||
    (a.role || "").toLowerCase().includes(q)
  );
  // Rejected applications sink to the bottom (stable: keeps newest-first within each group).
  filtered.sort((a, b) => (a.status === "rejected" ? 1 : 0) - (b.status === "rejected" ? 1 : 0));
  renderApps(filtered);
}

async function loadApps() {
  $status.style.display = "block";
  if (!window.sb) {
    $status.textContent = "Supabase not loaded";
    return;
  }
  const { data, error } = await window.sb
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });
  $status.style.display = "none";
  if (error) {
    acShowError("Couldn't load applications: " + error.message);
    return;
  }
  allApps = data || [];
  applyFilters();
}

// --------- Event wiring ---------
$addBtn.addEventListener("click", () => openModal());
$cancelBtn.addEventListener("click", closeModal);
$modal.addEventListener("click", (e) => { if (e.target === $modal) closeModal(); });
$form.addEventListener("submit", saveApp);
$statusFilter.addEventListener("change", applyFilters);
$search.addEventListener("input", applyFilters);

$list.addEventListener("click", (e) => {
  const target = e.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "edit") {
    const app = allApps.find(a => a.id === target.dataset.id);
    if (app) openModal(app);
  } else if (action === "delete") {
    deleteApp(target.dataset.id);
  } else if (action === "download") {
    downloadFile(target.dataset.path);
  }
});

$list.addEventListener("change", async (e) => {
  const sel = e.target.closest('select[data-action="change-status"]');
  if (!sel) return;
  const id = sel.dataset.id;
  const newStatus = sel.value;
  sel.className = `status-select badge-status-${newStatus}`;
  const { error } = await window.sb.from("applications")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    acShowError("Couldn't update status: " + error.message);
    return;
  }
  const app = allApps.find(a => a.id === id);
  if (app) app.status = newStatus;
  applyFilters();  // re-sort so a newly-rejected one drops to the bottom
});

// Download links in the edit modal
document.addEventListener("click", (e) => {
  const link = e.target.closest(".dl-link");
  if (!link) return;
  e.preventDefault();
  downloadFile(link.dataset.path);
});

(async () => {
  const session = await window.acAuth.requireAuth();
  if (!session) return;
  window.acAuth.paintNav(session);
  document.body.style.visibility = "visible";
  loadApps();
})();
