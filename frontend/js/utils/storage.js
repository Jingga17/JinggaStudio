/**
 * Resilien — LocalStorage Utilities with Cookie and window.name Fallbacks
 */
let memoryStorage = {};
const Storage = {
  KEY_PREFIX: 'dcm220_',

  set(key, value) {
    const fullKey = this.KEY_PREFIX + key;
    // 1. LocalStorage
    try {
      localStorage.setItem(fullKey, JSON.stringify(value));
    } catch(e) {}
    
    // 2. Cookie fallback
    try {
      document.cookie = `${fullKey}=${encodeURIComponent(JSON.stringify(value))};path=/;max-age=86400`;
    } catch(e) {}

    // 3. window.name fallback (tab-level persistence)
    try {
      let data = {};
      try { data = JSON.parse(window.name); } catch(err) { data = {}; }
      if (typeof data !== 'object' || data === null) data = {};
      data[fullKey] = value;
      window.name = JSON.stringify(data);
    } catch(e) {}

    // 4. Memory fallback
    memoryStorage[fullKey] = JSON.stringify(value);
  },
  get(key, fallback = null) {
    const fullKey = this.KEY_PREFIX + key;
    // 1. LocalStorage
    try {
      const v = localStorage.getItem(fullKey);
      if (v !== null) return JSON.parse(v);
    } catch(e) {}

    // 2. Cookie fallback
    try {
      const match = document.cookie.match(new RegExp('(^| )' + fullKey + '=([^;]+)'));
      if (match) return JSON.parse(decodeURIComponent(match[2]));
    } catch(e) {}

    // 3. window.name fallback
    try {
      let data = {};
      try { data = JSON.parse(window.name); } catch(err) { data = {}; }
      if (data && data[fullKey] !== undefined) return data[fullKey];
    } catch(e) {}

    // 4. Memory fallback
    if (memoryStorage[fullKey] !== undefined) {
      try {
        return JSON.parse(memoryStorage[fullKey]);
      } catch(e) {}
    }
    return fallback;
  },
  remove(key) {
    const fullKey = this.KEY_PREFIX + key;
    try {
      localStorage.removeItem(fullKey);
    } catch(e) {}
    try {
      document.cookie = `${fullKey}=;path=/;max-age=0`;
    } catch(e) {}
    try {
      let data = {};
      try { data = JSON.parse(window.name); } catch(err) { data = {}; }
      if (data && data[fullKey] !== undefined) {
        delete data[fullKey];
        window.name = JSON.stringify(data);
      }
    } catch(e) {}
    delete memoryStorage[fullKey];
  },
  clear() {
    try {
      Object.keys(localStorage).filter(k => k.startsWith(this.KEY_PREFIX)).forEach(k => {
        try { localStorage.removeItem(k); } catch(err) {}
      });
    } catch(e) {}
    try {
      document.cookie.split(";").forEach(c => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
        if (name.startsWith(this.KEY_PREFIX)) {
          document.cookie = `${name}=;path=/;max-age=0`;
        }
      });
    } catch(e) {}
    try {
      let data = {};
      try { data = JSON.parse(window.name); } catch(err) { data = {}; }
      if (typeof data === 'object' && data !== null) {
        Object.keys(data).forEach(k => {
          if (k.startsWith(this.KEY_PREFIX)) delete data[k];
        });
        window.name = JSON.stringify(data);
      }
    } catch(e) {}
    memoryStorage = {};
  },

  // ── Kuesioner specific ──
  saveAnswer(studentId, questionId, jawaban) {
    const key = `answers_${studentId || 'draft'}`;
    const answers = this.get(key, {});
    answers[questionId] = jawaban;
    this.set(key, answers);
  },
  getAnswers(studentId) {
    return this.get(`answers_${studentId || 'draft'}`, {});
  },
  saveStudentDraft(data) { this.set('student_draft', data); },
  getStudentDraft()      { return this.get('student_draft', null); },
  clearStudentDraft()    { this.remove('student_draft'); },

  saveShuffledOrder(studentId, order) { this.set(`order_${studentId || 'draft'}`, order); },
  getShuffledOrder(studentId)         { return this.get(`order_${studentId || 'draft'}`, null); },

  saveCurrentPage(studentId, page) { this.set(`page_${studentId || 'draft'}`, page); },
  getCurrentPage(studentId)        { return this.get(`page_${studentId || 'draft'}`, 0); },

  saveTimerStart(studentId, ts) { this.set(`timer_${studentId || 'draft'}`, ts); },
  getTimerStart(studentId)      { return this.get(`timer_${studentId || 'draft'}`, null); },

  // ── Admin specific ──
  saveAdminToken(token) { this.set('admin_token', token); },
  getAdminToken()       { return this.get('admin_token', null); },
  clearAdminToken()     { this.remove('admin_token'); },

  saveAdminUser(user) { this.set('admin_user', user); },
  getAdminUser()      { return this.get('admin_user', null); },
};
