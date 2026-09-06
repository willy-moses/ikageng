/**
 * ward-header.js  — Animated Edition
 * ──────────────────────────────────────────────────────────────────
 * Reusable VDC header component for all Ikageng pages.
 *
 * USAGE:
 *   <script src="ward-header.js"></script>
 *   <script>
 *     WardHeader.init({
 *       project:       currentProject,   // { project_name, month, year }
 *       wardId:        WARD_ID,
 *       supabase:      sb,
 *       allowLogoEdit: true,             // admin pages only
 *       onLogoUpdated: (url) => {}
 *     });
 *   </script>
 * ──────────────────────────────────────────────────────────────────
 */

(function (global) {
  'use strict';

  // ── Styles ────────────────────────────────────────────────────────
  const CSS = `
    /* ─── Keyframes ─────────────────────────────────────────── */
    @keyframes wh-gradient-shift {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes wh-shimmer {
      0%   { transform: translateX(-100%) skewX(-15deg); }
      100% { transform: translateX(250%) skewX(-15deg); }
    }
    @keyframes wh-logo-pop {
      0%   { opacity: 0; transform: scale(0.4) rotate(-12deg); }
      60%  { transform: scale(1.12) rotate(4deg); }
      80%  { transform: scale(0.96) rotate(-2deg); }
      100% { opacity: 1; transform: scale(1) rotate(0deg); }
    }
    @keyframes wh-slide-up {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes wh-fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes wh-tag-in {
      from { opacity: 0; transform: translateX(-10px) scale(0.9); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }
    @keyframes wh-pulse-ring {
      0%   { box-shadow: 0 0 0 0 rgba(0,201,138,0.45); }
      70%  { box-shadow: 0 0 0 10px rgba(0,201,138,0); }
      100% { box-shadow: 0 0 0 0 rgba(0,201,138,0); }
    }
    @keyframes wh-orb-float {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33%  { transform: translate(6px, -8px) scale(1.04); }
      66%  { transform: translate(-4px, 5px) scale(0.97); }
    }
    @keyframes wh-dot-blink {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.3; }
    }

    /* ── Moving dots canvas ── */
    #ward-header #wh-dots-canvas {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 1;
    }
    @keyframes wh-slideup-modal {
      from { opacity: 0; transform: translateY(20px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes wh-fadeIn-toast {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ─── Header shell ──────────────────────────────────────── */
    #ward-header {
      --wh-c1:     #1a3d28;
      --wh-c2:     #0e4a2f;
      --wh-c3:     #1e5c38;
      --wh-c4:     #0a3520;
      --wh-accent: #00c98a;
      --wh-gold:   #e8b84b;
      --wh-text:   #ffffff;
      --wh-muted:  rgba(255,255,255,0.68);
      --wh-border: rgba(255,255,255,0.15);

      font-family: 'DM Mono', monospace;
      background: linear-gradient(
        135deg,
        var(--wh-c1) 0%,
        var(--wh-c2) 30%,
        var(--wh-c3) 65%,
        var(--wh-c4) 100%
      );
      background-size: 300% 300%;
      animation: wh-gradient-shift 12s ease infinite;

      padding: 1.5rem 1.6rem 1.4rem;
      display: flex;
      align-items: center;
      gap: 1.1rem;
      position: relative;
      overflow: hidden;
      /* subtle bottom border glow */
      border-bottom: 1px solid rgba(0,201,138,0.18);
      box-shadow: 0 4px 24px rgba(0,0,0,0.45);
    }

    /* ── Animated background orbs ── */
    #ward-header .wh-orb {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      will-change: transform;
    }
    #ward-header .wh-orb-1 {
      width: 120px; height: 120px;
      top: -40px; right: 60px;
      background: radial-gradient(circle, rgba(0,201,138,0.18) 0%, transparent 70%);
      animation: wh-orb-float 9s ease-in-out infinite;
    }
    #ward-header .wh-orb-2 {
      width: 80px; height: 80px;
      bottom: -20px; right: 20%;
      background: radial-gradient(circle, rgba(232,184,75,0.12) 0%, transparent 70%);
      animation: wh-orb-float 13s ease-in-out infinite reverse;
    }
    #ward-header .wh-orb-3 {
      width: 60px; height: 60px;
      top: 10px; left: 40%;
      background: radial-gradient(circle, rgba(0,201,138,0.1) 0%, transparent 70%);
      animation: wh-orb-float 7s ease-in-out infinite 2s;
    }

    /* ── Shimmer sweep (runs once on load) ── */
    #ward-header::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%);
      animation: wh-shimmer 1.8s ease 0.3s 1 forwards;
      pointer-events: none;
    }

    /* ── Noise texture overlay ── */
    #ward-header::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E");
      background-size: 180px;
      pointer-events: none;
      z-index: 0;
    }

    /* ── Logo wrapper ── */
    #ward-header .wh-logo-wrap {
      position: relative;
      flex-shrink: 0;
      z-index: 2;
      /* entrance animation */
      opacity: 0;
      animation: wh-logo-pop 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.15s forwards;
    }

    #ward-header .wh-logo {
      width: 80px; height: 80px;
      border-radius: 50%;
      background: transparent;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: visible;
      box-shadow: none;
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1),
                  box-shadow 0.25s ease;
      cursor: default;
    }

    /* When logo is clickable (allowLogoEdit), show pointer and hover effect on the image/initials */
    #ward-header .wh-logo.wh-logo-editable {
      cursor: pointer;
    }
    #ward-header .wh-logo-wrap:hover .wh-logo.wh-logo-editable {
      transform: scale(1.08) rotate(3deg);
    }

    /* pulse ring on the logo after load */
    #ward-header .wh-logo.wh-logo-loaded {
      animation: wh-pulse-ring 2.2s ease-out 0.9s 1;
    }

    #ward-header .wh-logo img {
      width: 90px; height: 90px;
      object-fit: contain;
      border-radius: 0;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));
    }

    #ward-header .wh-logo-initials {
      font-family: 'Fraunces', serif;
      font-size: 1.3rem;
      font-weight: 700;
      color: #1a3d28;
      line-height: 1;
      user-select: none;
    }

    /* ── Edit badge — hidden, logo itself is the trigger now ── */
    #ward-header .wh-edit-btn {
      display: none;
    }

    /* ── Text block ── */
    #ward-header .wh-text {
      flex: 1;
      min-width: 0;
      position: relative;
      z-index: 2;
    }

    #ward-header .wh-ward-name {
      font-family: 'Fraunces', serif;
      font-size: clamp(1rem, 4vw, 1.35rem);
      font-weight: 700;
      color: var(--wh-text);
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      /* entrance */
      opacity: 0;
      animation: wh-slide-up 0.5s ease 0.35s forwards;
      /* subtle text shadow for depth */
      text-shadow: 0 2px 12px rgba(0,0,0,0.3);
    }

    #ward-header .wh-subtitle {
      font-size: .67rem;
      color: var(--wh-muted);
      margin-top: .25rem;
      letter-spacing: .05em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      opacity: 0;
      animation: wh-slide-up 0.5s ease 0.5s forwards;
    }

    /* ── Live status dot ── */
    #ward-header .wh-status-row {
      display: flex;
      align-items: center;
      gap: .5rem;
      margin-top: .35rem;
      opacity: 0;
      animation: wh-tag-in 0.45s ease 0.68s forwards;
    }
    #ward-header .wh-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--wh-accent);
      flex-shrink: 0;
      animation: wh-dot-blink 2.4s ease-in-out 1.2s infinite;
    }
    #ward-header .wh-project-tag {
      display: inline-block;
      font-size: .55rem;
      padding: .12rem .55rem;
      border-radius: 20px;
      background: rgba(0,201,138,0.18);
      color: var(--wh-accent);
      border: 1px solid rgba(0,201,138,0.3);
      letter-spacing: .07em;
      text-transform: uppercase;
    }

    /* ─── Modal ─────────────────────────────────────────────── */
    #wh-logo-modal {
      display: none;
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.75);
      z-index: 9000;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      font-family: 'DM Mono', monospace;
      backdrop-filter: blur(4px);
    }
    #wh-logo-modal.open { display: flex; }

    #wh-logo-modal .wh-modal-box {
      background: #111a18;
      border: 1px solid #1e2d28;
      border-radius: 16px;
      padding: 1.9rem;
      width: min(400px, 95vw);
      animation: wh-slideup-modal 0.28s cubic-bezier(0.34,1.2,0.64,1);
      box-shadow: 0 24px 60px rgba(0,0,0,0.6);
    }

    #wh-logo-modal h3 {
      font-family: 'Fraunces', serif;
      font-size: 1.1rem;
      color: #dff0eb;
      margin-bottom: .45rem;
    }
    #wh-logo-modal p {
      font-size: .7rem;
      color: #6b8c84;
      line-height: 1.65;
      margin-bottom: 1.2rem;
    }

    #wh-logo-modal .wh-preview-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 1.2rem;
    }
    #wh-logo-modal .wh-preview-circle {
      width: 84px; height: 84px;
      border-radius: 50%;
      background: rgba(255,255,255,0.9);
      border: 2px solid #1e2d28;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
      font-family: 'Fraunces', serif;
      font-size: 1.7rem;
      font-weight: 700;
      color: #1a3d28;
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
    }
    #wh-logo-modal .wh-preview-circle:hover { transform: scale(1.06); }
    #wh-logo-modal .wh-preview-circle img {
      width: 100%; height: 100%;
      object-fit: cover;
    }

    #wh-logo-modal .wh-drop-zone {
      border: 2px dashed #1e2d28;
      border-radius: 10px;
      padding: 1.3rem;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s, transform 0.15s;
      margin-bottom: 1rem;
      position: relative;
    }
    #wh-logo-modal .wh-drop-zone:hover,
    #wh-logo-modal .wh-drop-zone.drag-over {
      border-color: #00c98a;
      background: rgba(0,201,138,0.05);
      transform: scale(1.01);
    }
    #wh-logo-modal .wh-drop-zone input[type=file] {
      position: absolute; inset: 0;
      opacity: 0; cursor: pointer;
    }
    #wh-logo-modal .wh-drop-icon { font-size: 1.9rem; margin-bottom: .4rem; }
    #wh-logo-modal .wh-drop-text { font-size: .7rem; color: #6b8c84; }
    #wh-logo-modal .wh-drop-text span { color: #00c98a; }

    #wh-logo-modal .wh-url-row {
      display: flex; gap: .5rem;
      margin-bottom: 1.2rem;
      align-items: center;
    }
    #wh-logo-modal .wh-url-label {
      font-size: .62rem; color: #6b8c84;
      white-space: nowrap; flex-shrink: 0;
    }
    #wh-logo-modal .wh-url-input {
      flex: 1;
      background: #18241f;
      border: 1px solid #1e2d28;
      border-radius: 7px;
      padding: .52rem .8rem;
      font-family: 'DM Mono', monospace;
      font-size: .72rem;
      color: #dff0eb;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    #wh-logo-modal .wh-url-input:focus {
      border-color: #00c98a;
      box-shadow: 0 0 0 3px rgba(0,201,138,0.12);
    }

    #wh-logo-modal .wh-modal-btns {
      display: flex; gap: .6rem;
    }
    #wh-logo-modal .wh-btn-cancel {
      flex: 1; padding: .65rem;
      background: transparent;
      border: 1px solid #1e2d28;
      border-radius: 8px;
      cursor: pointer;
      color: #6b8c84;
      font-family: 'DM Mono', monospace;
      font-size: .75rem;
      transition: border-color 0.15s, color 0.15s, transform 0.15s;
    }
    #wh-logo-modal .wh-btn-cancel:hover {
      border-color: #00c98a; color: #00c98a;
      transform: translateY(-1px);
    }
    #wh-logo-modal .wh-btn-save {
      flex: 2; padding: .65rem;
      background: linear-gradient(135deg, #00c98a 0%, #00a572 100%);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      color: #001a10;
      font-family: 'DM Mono', monospace;
      font-size: .75rem;
      font-weight: 500;
      transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s;
      display: flex; align-items: center;
      justify-content: center; gap: .4rem;
      box-shadow: 0 4px 14px rgba(0,201,138,0.3);
    }
    #wh-logo-modal .wh-btn-save:disabled { opacity: .5; cursor: not-allowed; transform: none; }
    #wh-logo-modal .wh-btn-save:hover:not(:disabled) {
      opacity: .9; transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(0,201,138,0.4);
    }
    #wh-logo-modal .wh-remove-link {
      text-align: center;
      font-size: .62rem;
      color: #f06060;
      cursor: pointer;
      margin-top: .75rem;
      display: block;
      background: none;
      border: none;
      font-family: 'DM Mono', monospace;
      transition: opacity 0.15s;
    }
    #wh-logo-modal .wh-remove-link:hover { opacity: .75; text-decoration: underline; }

    /* ─── Toast ─────────────────────────────────────────────── */
    .wh-toast {
      position: fixed;
      bottom: 1.5rem; right: 1.5rem;
      background: #111a18;
      border: 1px solid #1e2d28;
      border-radius: 9px;
      padding: .7rem 1.1rem;
      font-family: 'DM Mono', monospace;
      font-size: .72rem;
      color: #dff0eb;
      z-index: 9999;
      animation: wh-fadeIn-toast 0.22s ease;
      max-width: 300px;
      line-height: 1.5;
      pointer-events: none;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    }
    .wh-toast.success { border-color: rgba(0,201,138,0.4); color: #00c98a; }
    .wh-toast.error   { border-color: rgba(240,96,96,0.4); color: #f06060; }
  `;

  // ── Helpers ───────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('ward-header-styles')) return;
    const s = document.createElement('style');
    s.id = 'ward-header-styles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function toast(msg, type = 'success') {
    const t = document.createElement('div');
    t.className = 'wh-toast ' + type;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  function initials(name) {
    if (!name) return 'VDC';
    return name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  // ── Build header HTML ─────────────────────────────────────────────
  function buildHeader(opts) {
    const { wardName, logoUrl, project, allowLogoEdit } = opts;

    const projectLine = (() => {
      if (!project) return 'Ikageng Programme Management';
      const period = [project.month, project.year].filter(Boolean).join(' ');
      return period ? `${period} — Ikageng` : 'Ikageng Programme Management';
    })();

    const projectTag = project?.project_name
      ? `<span class="wh-project-tag">${project.project_name}</span>`
      : '';

    const logoInner = logoUrl
      ? `<img src="${logoUrl}" alt="${wardName} logo">`
      : `<span class="wh-logo-initials">${initials(wardName)}</span>`;

    // pencil button kept in DOM for JS compatibility but hidden via CSS
    const editBtn = allowLogoEdit
      ? `<button class="wh-edit-btn" id="wh-edit-logo-btn" title="Update logo" aria-hidden="true">✎</button>`
      : '';

    const fullTitle = wardName
      ? `${wardName} VDC Officer Panel`
      : 'VDC Officer Panel';

    // add wh-logo-editable class so cursor:pointer applies when editing is allowed
    const logoEditable = allowLogoEdit ? ' wh-logo-editable' : '';

    return `
      <!-- animated background orbs -->
      <div class="wh-orb wh-orb-1"></div>
      <div class="wh-orb wh-orb-2"></div>
      <div class="wh-orb wh-orb-3"></div>

      <!-- moving dots canvas -->
      <canvas id="wh-dots-canvas"></canvas>

      <div class="wh-logo-wrap">
        <div class="wh-logo${logoEditable}" id="wh-logo-circle">${logoInner}</div>
        ${editBtn}
      </div>

      <div class="wh-text">
        <div class="wh-ward-name">${fullTitle}</div>
        <div class="wh-subtitle">${projectLine}</div>
        <div class="wh-status-row">
          <span class="wh-dot"></span>
          ${projectTag}
        </div>
      </div>
    `;
  }

  // ── Logo Modal ────────────────────────────────────────────────────
  function buildModal(opts) {
    const { wardName, logoUrl } = opts;
    const previewContent = logoUrl
      ? `<img src="${logoUrl}" alt="logo">`
      : initials(wardName);

    return `
      <div id="wh-logo-modal">
        <div class="wh-modal-box">
          <h3>Update Ward Logo</h3>
          <p>Upload an image file or paste a public image URL. Square images (PNG / JPG) work best.</p>

          <div class="wh-preview-wrap">
            <div class="wh-preview-circle" id="wh-modal-preview">${previewContent}</div>
          </div>

          <div class="wh-drop-zone" id="wh-drop-zone">
            <input type="file" id="wh-file-input" accept="image/*">
            <div class="wh-drop-icon">🖼️</div>
            <div class="wh-drop-text">Drop image here or <span>click to browse</span></div>
          </div>

          <div class="wh-url-row">
            <span class="wh-url-label">or URL:</span>
            <input class="wh-url-input" type="text" id="wh-url-input" placeholder="https://…">
          </div>

          <div class="wh-modal-btns">
            <button class="wh-btn-cancel" id="wh-modal-cancel">Cancel</button>
            <button class="wh-btn-save"   id="wh-modal-save">💾 Save Logo</button>
          </div>
          <button class="wh-remove-link" id="wh-remove-logo">Remove logo (use initials)</button>
        </div>
      </div>
    `;
  }

  // ── Core: init ────────────────────────────────────────────────────
  async function init(opts = {}) {
    const {
      project       = null,
      wardId        = null,
      supabase: sb  = null,
      allowLogoEdit = false,
      onLogoUpdated = null,
    } = opts;

    injectStyles();

    const header = document.createElement('header');
    header.id = 'ward-header';
    document.body.insertBefore(header, document.body.firstChild);

    let wardName = '';
    let logoUrl  = null;

    if (sb && wardId) {
      try {
        const { data } = await sb
          .from('wards')
          .select('ward_name, logo_url')
          .eq('id', wardId)
          .single();
        if (data) {
          wardName = data.ward_name || '';
          logoUrl  = data.logo_url  || null;
        }
      } catch (e) {
        console.warn('[WardHeader] Could not load ward:', e);
      }
    }

    const renderOpts = { wardName, logoUrl, project, allowLogoEdit };
    header.innerHTML = buildHeader(renderOpts);

    // Trigger pulse ring after logo entrance animation
    setTimeout(() => {
      const circle = document.getElementById('wh-logo-circle');
      if (circle) circle.classList.add('wh-logo-loaded');
    }, 900);

    // ── Moving dots canvas animation ──
    startDotCanvas(header);

    if (allowLogoEdit) {
      document.body.insertAdjacentHTML('beforeend', buildModal({ wardName, logoUrl }));
      wireModal({ sb, wardId, wardName, onLogoUpdated, header, project, allowLogoEdit });
    }
  }

  // ── Modal wiring ──────────────────────────────────────────────────
  function wireModal({ sb, wardId, wardName, onLogoUpdated, header, project, allowLogoEdit }) {
    const modal       = document.getElementById('wh-logo-modal');
    const fileInput   = document.getElementById('wh-file-input');
    const urlInput    = document.getElementById('wh-url-input');
    const preview     = document.getElementById('wh-modal-preview');
    const dropZone    = document.getElementById('wh-drop-zone');
    const saveBtn     = document.getElementById('wh-modal-save');
    const cancelBtn   = document.getElementById('wh-modal-cancel');
    const removeBtn   = document.getElementById('wh-remove-logo');
    // logo circle is now the edit trigger; pencil button is hidden
    const logoCircle  = document.getElementById('wh-logo-circle');

    let pendingFile    = null;
    let pendingUrlStr  = null;

    function openModal()  { modal.classList.add('open'); }
    function closeModal() {
      modal.classList.remove('open');
      pendingFile   = null;
      pendingUrlStr = null;
      urlInput.value = '';
    }

    // clicking the logo image opens the modal
    logoCircle?.addEventListener('click', openModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
      pendingFile   = file;
      pendingUrlStr = null;
      const reader = new FileReader();
      reader.onload = e => {
        preview.innerHTML = `<img src="${e.target.result}" alt="preview">`;
      };
      reader.readAsDataURL(file);
    });

    urlInput.addEventListener('input', () => {
      const url = urlInput.value.trim();
      if (url) {
        pendingUrlStr = url;
        pendingFile   = null;
        preview.innerHTML = `<img src="${url}" alt="preview" onerror="this.parentNode.textContent='${initials(wardName)}'">`;
      }
    });

    dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (!file || !file.type.startsWith('image/')) return;
      pendingFile   = file;
      pendingUrlStr = null;
      const reader = new FileReader();
      reader.onload = ev => {
        preview.innerHTML = `<img src="${ev.target.result}" alt="preview">`;
      };
      reader.readAsDataURL(file);
    });

    saveBtn.addEventListener('click', async () => {
      const hasFile = !!pendingFile;
      const hasUrl  = !!pendingUrlStr;
      if (!hasFile && !hasUrl) { toast('Choose an image or paste a URL first', 'error'); return; }

      saveBtn.disabled = true;
      saveBtn.textContent = '⏳ Saving…';

      try {
        let finalUrl = pendingUrlStr;

        if (hasFile && sb) {
          const ext      = pendingFile.name.split('.').pop().toLowerCase() || 'png';
          const filePath = `ward-logos/${wardId}.${ext}`;

          const { error: upErr } = await sb.storage
            .from('ward-assets')
            .upload(filePath, pendingFile, { upsert: true, contentType: pendingFile.type });

          if (upErr) throw upErr;

          const { data: urlData } = sb.storage
            .from('ward-assets')
            .getPublicUrl(filePath);

          finalUrl = urlData.publicUrl + '?t=' + Date.now();
        }

        if (sb && wardId) {
          const { error } = await sb
            .from('wards')
            .update({ logo_url: finalUrl, updated_at: new Date().toISOString() })
            .eq('id', wardId);
          if (error) throw error;
        }

        updateHeaderLogo(finalUrl, wardName);
        toast('Logo updated ✓');
        if (typeof onLogoUpdated === 'function') onLogoUpdated(finalUrl);
        closeModal();
      } catch (e) {
        toast('Save failed: ' + (e.message || e), 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Save Logo';
      }
    });

    removeBtn.addEventListener('click', async () => {
      if (!confirm('Remove the logo and use initials instead?')) return;
      try {
        if (sb && wardId) {
          await sb.from('wards').update({ logo_url: null, updated_at: new Date().toISOString() }).eq('id', wardId);
        }
        updateHeaderLogo(null, wardName);
        toast('Logo removed');
        if (typeof onLogoUpdated === 'function') onLogoUpdated(null);
        closeModal();
      } catch (e) {
        toast('Error: ' + e.message, 'error');
      }
    });
  }

  // ── Live logo update ──────────────────────────────────────────────
  function updateHeaderLogo(logoUrl, wardName) {
    const circle = document.getElementById('wh-logo-circle');
    if (circle) {
      circle.style.transition = 'transform 0.15s ease';
      circle.style.transform  = 'scale(0.85)';
      setTimeout(() => {
        circle.innerHTML = logoUrl
          ? `<img src="${logoUrl}" alt="${wardName} logo">`
          : `<span class="wh-logo-initials">${initials(wardName)}</span>`;
        circle.style.transform = 'scale(1)';
      }, 150);
    }
    const mp = document.getElementById('wh-modal-preview');
    if (mp) {
      mp.innerHTML = logoUrl
        ? `<img src="${logoUrl}" alt="logo">`
        : initials(wardName);
    }
  }

  // ── Moving dots canvas ────────────────────────────────────────────
  function startDotCanvas(header) {
    const canvas = document.getElementById('wh-dots-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const NDOTS = 40;
    const CONNECT = 85;

    function resize() {
      canvas.width  = header.offsetWidth;
      canvas.height = header.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const dots = Array.from({ length: NDOTS }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      r:     Math.random() * 1.8 + 0.5,
      vx:    (Math.random() - 0.5) * 0.38,
      vy:    (Math.random() - 0.5) * 0.38,
      alpha: Math.random() * 0.45 + 0.15,
      phase: Math.random() * Math.PI * 2,
    }));

    let raf;
    function draw(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0) d.x = canvas.width;
        if (d.x > canvas.width)  d.x = 0;
        if (d.y < 0) d.y = canvas.height;
        if (d.y > canvas.height) d.y = 0;

        const pulse = d.alpha * (0.65 + 0.35 * Math.sin(t * 0.0009 + d.phase));
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,201,138,${pulse})`;
        ctx.fill();
      }

      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT) {
            const a = (1 - dist / CONNECT) * 0.16;
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(0,201,138,${a})`;
            ctx.lineWidth = 0.65;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
  }

  // ── Public API ────────────────────────────────────────────────────
  global.WardHeader = { init };

})(window);