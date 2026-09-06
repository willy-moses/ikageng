/**
 * ward-utils.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Drop this <script src="ward-utils.js"></script> into EVERY page that reads
 * or writes Supabase data (project-management, vdc-dashboard, waitinglist, etc.)
 *
 * Provides:
 *   wardUtils.init(sb)          → call once on page load; handles auth + ward lookup
 *   wardUtils.onReady(fn)       → fires fn(wardId, isAdmin) once init is done
 *   wardUtils.getWardId()       → the current ward's UUID
 *   wardUtils.getRole()         → 'admin' | 'officer' | 'viewer' | 'owner'
 *   wardUtils.isViewer()        → true if role is 'viewer' (read-only)
 *   wardUtils.filter(query)     → appends &ward_id=eq.<id> to any fetch URL
 *   wardUtils.body(obj)         → injects ward_id into any POST/PATCH body
 *   wardUtils.isAdmin()         → true if the current user is a super-admin
 *   wardUtils.adminWardId()     → when admin is viewing a specific ward via ?admin_ward=
 * ─────────────────────────────────────────────────────────────────────────────
 */

const wardUtils = (() => {
  const SUPA_URL = 'https://ormfjhympifzdqqscvel.supabase.co';
  const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ybWZqaHltcGlmemRxcXNjdmVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NjAwMDMsImV4cCI6MjA5MjMzNjAwM30.2p6DPa4wu_1TFYV9iReffpE91mx3iJir3BLcZ1rAxRs';

  let _wardId   = null;
  let _isAdmin  = false;
  let _role     = null;   // 'owner' | 'admin' | 'officer' | 'viewer'
  let _ready    = false;
  let _readyFns = [];

  // ── Internal fetch helper ──────────────────────────────────────────────────
  function _get(path, token) {
    return fetch(`${SUPA_URL}/rest/v1/${path}`, {
      headers: {
        'apikey':        SUPA_KEY,
        'Authorization': `Bearer ${token}`
      }
    }).then(r => r.json()).catch(() => []);
  }

  // ── Call once on page load ─────────────────────────────────────────────────
  async function init(sb) {

    // 1. Check session
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
      window.location.replace('login.html');
      return;
    }

    const email       = session.user.email.toLowerCase();
    const userId      = session.user.id;
    const accessToken = session.access_token;

    // 2. Check if super-admin
    const admins = await _get(
      `super_admins?email=eq.${encodeURIComponent(email)}&select=id`,
      SUPA_KEY   // anon key is fine for super_admins read (RLS off)
    );
    _isAdmin = Array.isArray(admins) && admins.length > 0;

    if (_isAdmin) {
      // Super-admin — no ward_id needed; they see everything
      _role  = 'admin';
      _ready = true;
      _readyFns.forEach(fn => fn(_wardId, _isAdmin));
      return;
    }

    // 3. Look up as primary ward owner (wards.auth_user_id)
    const wards = await _get(
      `wards?auth_user_id=eq.${userId}&select=id,status,ward_name`,
      accessToken
    );

    if (wards && wards.length > 0) {
      const ward = wards[0];
      _wardId = ward.id;
      _role   = 'owner';

      if (ward.status === 'suspended') {
        window.location.replace('suspended.html');
        return;
      }

      _ready = true;
      _readyFns.forEach(fn => fn(_wardId, _isAdmin));
      return;
    }

    // 4. Not a primary owner — check ward_users table (sub-user)
    const wardUsers = await _get(
      `ward_users?auth_user_id=eq.${userId}&select=ward_id,role`,
      accessToken
    );

    if (wardUsers && wardUsers.length > 0) {
      const wu = wardUsers[0];
      _wardId = wu.ward_id;
      _role   = wu.role; // 'admin' | 'officer' | 'viewer'

      // Check if the ward is suspended
      const wardInfo = await _get(
        `wards?id=eq.${_wardId}&select=id,status`,
        accessToken
      );
      if (wardInfo && wardInfo[0]?.status === 'suspended') {
        window.location.replace('suspended.html');
        return;
      }

      _ready = true;
      _readyFns.forEach(fn => fn(_wardId, _isAdmin));
      return;
    }

    // 5. No ward found anywhere — sign out
    console.warn('wardUtils: No ward found for user', userId);
    await sb.auth.signOut();
    window.location.replace('login.html');
  }

  // ── onReady ────────────────────────────────────────────────────────────────
  function onReady(fn) {
    if (_ready) fn(_wardId, _isAdmin);
    else _readyFns.push(fn);
  }

  // ── filter — append ward_id to REST query ─────────────────────────────────
  function filter(query) {
    if (_isAdmin) {
      const aw = adminWardId();
      if (aw) return `${query}&ward_id=eq.${aw}`;
      return query; // super-admin sees all
    }
    if (!_wardId) return query;
    const sep = query.includes('?') ? '&' : '?';
    return `${query}${sep}ward_id=eq.${_wardId}`;
  }

  // ── body — inject ward_id into POST/PATCH payloads ────────────────────────
  function body(obj) {
    if (_isAdmin) return obj;
    if (!_wardId) return obj;
    return { ...obj, ward_id: _wardId };
  }

  // ── Role helpers ───────────────────────────────────────────────────────────
  function getRole()   { return _role; }
  function isViewer()  { return _role === 'viewer'; }
  function isAdmin()   { return _isAdmin; }
  function getWardId() { return _wardId; }

  // Returns admin_ward from URL param (when super-admin views a ward)
  function adminWardId() {
    return new URLSearchParams(window.location.search).get('admin_ward') || null;
  }

  return { init, onReady, filter, body, isAdmin, isViewer, getRole, getWardId, adminWardId };
})();

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW TO USE IN EACH PAGE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. Add <script src="ward-utils.js"></script> before your page's <script>
 *
 * 2. In your init() function:
 *
 *    await wardUtils.init(sb);
 *    wardUtils.onReady(async (wardId, isAdmin) => {
 *      await loadProjects();   // or whatever your page loads
 *    });
 *
 * 3. When fetching data, wrap the path with wardUtils.filter():
 *
 *    BEFORE:  sbFetch('projects?order=created_at.desc&select=*')
 *    AFTER:   sbFetch(wardUtils.filter('projects?order=created_at.desc&select=*'))
 *
 * 4. When creating/inserting data, wrap the body with wardUtils.body():
 *
 *    BEFORE:  body: JSON.stringify({ project_name: name, month, year })
 *    AFTER:   body: JSON.stringify(wardUtils.body({ project_name: name, month, year }))
 *
 * 5. To block viewer-role users from making changes, add this check at the
 *    top of any write function:
 *
 *    if (wardUtils.isViewer()) {
 *      showToast('You have read-only access', 'info');
 *      return;
 *    }
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USER ROLES EXPLAINED
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  'owner'   — Primary ward account (wards.auth_user_id). Full access.
 *  'admin'   — Super-admin (super_admins table). Sees all wards.
 *  'officer' — Sub-user (ward_users table). Can read & write ward data.
 *  'viewer'  — Sub-user (ward_users table). Read-only.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */