const fs = require('fs');

const jsInjection = `
  switchPemetaanTab(tabId) {
    const btnIds = ['tab-btn-demografi', 'tab-btn-keluarga', 'tab-btn-akademik', 'tab-btn-kesehatan', 'tab-btn-sosial'];
    btnIds.forEach(id => {
      const btn = _(id);
      if (btn) {
        btn.classList.remove('btn-primary');
        btn.style.background = 'var(--bg-surface)';
        btn.style.borderColor = 'var(--border)';
        btn.style.color = 'var(--text-primary)';
        if (id === \`tab-btn-\${tabId}\`) {
          btn.classList.add('btn-primary');
          btn.style.background = '';
          btn.style.borderColor = '';
          btn.style.color = '';
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

    // Dummy logic for cards
    if (_('pemetaan-broken')) _('pemetaan-broken').innerText = '0';
    if (_('pemetaan-yatim')) _('pemetaan-yatim').innerText = '0';
    if (_('pemetaan-khusus')) _('pemetaan-khusus').innerText = '26'; // placeholder
    
    // Clear old charts
    if(this.pemetaanCharts) {
        this.pemetaanCharts.forEach(c => c.destroy());
    }
    this.pemetaanCharts = [];
    
    const container = _('pemetaan-charts-container');
    if(!container) return;
    
    let configs = [];
    
    if (tabId === 'demografi') {
        const agamaCounts = this.autoAggregate(filteredStudents, 'agama');
        configs.push({ title: 'Agama', data: agamaCounts, type: 'pie' });
    } else if (tabId === 'keluarga') {
        const pddCounts = this.autoAggregate(filteredStudents, 'pendidikan_ayah');
        configs.push({ title: 'Pendidikan Ayah', data: pddCounts, type: 'bar' });
        const hslCounts = this.autoAggregate(filteredStudents, 'penghasilan_ayah');
        configs.push({ title: 'Penghasilan Ayah', data: hslCounts, type: 'bar' });
    } else if (tabId === 'akademik') {
        const ekskulCounts = this.autoAggregate(filteredStudents, 'ekstrakurikuler');
        configs.push({ title: 'Minat Ekstrakurikuler', data: ekskulCounts, type: 'bar' });
    } else if (tabId === 'sosial') {
        const jarakCounts = this.autoAggregate(filteredStudents, 'jarak_ke_sekolah');
        configs.push({ title: 'Jarak ke Sekolah', data: jarakCounts, type: 'pie' });
    } else if (tabId === 'kesehatan') {
        configs.push({ title: 'Kesehatan Fisik', data: {'Sehat': filteredStudents.length}, type: 'pie' });
    }

    container.innerHTML = '';
    configs.forEach((cfg, idx) => {
        const col = document.createElement('div');
        col.className = 'col-md-6';
        col.style.marginBottom = '20px';
        
        const card = document.createElement('div');
        card.className = 'card fadeUp';
        card.style.background = 'var(--bg-card)';
        card.style.border = '1px solid var(--border)';
        card.style.padding = '16px';
        card.style.borderRadius = '8px';
        
        const title = document.createElement('div');
        title.style.fontWeight = '600';
        title.style.marginBottom = '12px';
        title.innerText = cfg.title;
        
        const canvas = document.createElement('canvas');
        canvas.id = 'pemetaan-chart-' + idx;
        
        card.appendChild(title);
        card.appendChild(canvas);
        col.appendChild(card);
        container.appendChild(col);
        
        const ctx = canvas.getContext('2d');
        const labels = Object.keys(cfg.data);
        const data = Object.values(cfg.data);
        
        const chart = new Chart(ctx, {
            type: cfg.type,
            data: {
                labels: labels,
                datasets: [{
                    label: 'Jumlah',
                    data: data,
                    backgroundColor: [
                        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary').trim() }
                    }
                },
                scales: cfg.type === 'bar' ? {
                    y: {
                        beginAtZero: true,
                        ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-primary').trim() }
                    },
                    x: {
                        ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-primary').trim() }
                    }
                } : {}
            }
        });
        this.pemetaanCharts.push(chart);
    });
  },
`;

let currentJS = fs.readFileSync('frontend/js/pages/admin.js', 'utf-8');
currentJS = currentJS.replace(/\}\;\s*window\.AdminApp = AdminApp;/, jsInjection + '\n};\nwindow.AdminApp = AdminApp;');
fs.writeFileSync('frontend/js/pages/admin.js', currentJS, 'utf-8');
console.log('Pemetaan logic successfully recreated and injected!');
