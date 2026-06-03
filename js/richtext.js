// =============================================================
// Rich text helper for contenteditable fields.
// Enables Cmd/Ctrl+B (bold), Cmd/Ctrl+I (italic), and pastes
// as plain text so external formatting can't leak in.
// =============================================================

window.acRichText = {
  init(el) {
    if (!el || el.dataset.rtInit) return;
    el.dataset.rtInit = "1";
    el.setAttribute("contenteditable", "true");
    el.setAttribute("spellcheck", "true");

    el.addEventListener("keydown", (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "b") {
        e.preventDefault();
        document.execCommand("bold");
      } else if (key === "i") {
        e.preventDefault();
        document.execCommand("italic");
      }
    });

    el.addEventListener("paste", (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData("text/plain");
      document.execCommand("insertText", false, text);
    });
  },

  // Get sanitized HTML (only allow b/strong/i/em/br/div tags).
  getHTML(el) {
    if (!el) return "";
    const raw = el.innerHTML.trim();
    if (!raw) return "";
    const tmp = document.createElement("div");
    tmp.innerHTML = raw;
    this._sanitize(tmp);
    return tmp.innerHTML;
  },

  setHTML(el, html) {
    if (!el) return;
    el.innerHTML = html || "";
  },

  _sanitize(node) {
    const allow = new Set(["B", "STRONG", "I", "EM", "BR", "DIV"]);
    const kids = Array.from(node.childNodes);
    for (const k of kids) {
      if (k.nodeType === 3) continue; // text node
      if (k.nodeType !== 1) { k.remove(); continue; }
      const tag = k.tagName;
      if (!allow.has(tag)) {
        // unwrap unknown tags — keep their text content
        const txt = document.createTextNode(k.textContent || "");
        k.replaceWith(txt);
        continue;
      }
      // Strip all attributes
      Array.from(k.attributes || []).forEach(a => k.removeAttribute(a.name));
      this._sanitize(k);
    }
  }
};
