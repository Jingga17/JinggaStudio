"  switchPemetaanTab(tabId) {
    const btnIds = ['tab-btn-demografi', 'tab-btn-keluarga', 'tab-btn-akademik', 'tab-btn-kesehatan', 'tab-btn-sosial'];
    btnIds.forEach(id => {
      const btn = _(id);
      if (btn) {
        btn.classList.remove('btn-primary');
        btn.style.background = 'var(--bg-surface)';
        btn.style.borderColor = 'var(--border)';
        if (id === `tab-btn-${tabId}`) {
          btn.classList.add('btn-primary');
          btn.style.background = '';
          btn.style.borderColor = '';
        }
      }
    });
    this.activePemetaanTab = tabId;
    this.renderPemetaanSiswa();
  },

  autoAggregate(students, key, overrides = null) {
    const counts = {};
    students.forEach(s => {
      let p = {};
      try { if (s.data_pribadi) p = typeof s.data_pribadi === 'string' ? JSON.parse(s.data_pribadi) : s.data_pribadi; } catch (e) {}
      
      let val = p[key] || '';
      if (typeof val === 'string') val = val.trim();
      
      if (overrides) {
        let overriden = false;
        for (const [newKey, conditions] of Object.entries(overrides)) {
          if (conditions.some(cond => val.toLowerCase().includes(cond.toLowerCase()))) {
            val = newKey;
            overriden = true;
            break;
          }
        }
        if (!overriden && !val) val = 'Tidak Mengisi';
      } else {
        if (!val || val === '— Pilih —') val = 'Tidak Mengisi';
      }
      
      counts[val] = (counts[val] || 0) + 1;
    });
    return counts;
  },

  renderPemetaanSiswa() {
    if (!this.activePemetaanTab) this.activePemetaanTab = 'demografi';
    const tabId = this.activePemetaanTab;
    const filterEl = _('filter-pemetaan-kelas');

    const selectedClass = filterEl ? filterEl.value : '';
    const filteredStudents = selectedClass 
      ? this.bukuIndukData.filter(s => s.kelas === selectedClass)
      : this.bukuIndukData;

    if (_('pemetaan-total')) _('pemetaan-total').innerText = filteredStudents.length;

<truncated 7724 bytes>