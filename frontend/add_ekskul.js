const fs = require('fs');
const jsPath = 'C:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM\\frontend\\js\\pages\\student.js';
let js = fs.readFileSync(jsPath, 'utf-8');

const ekskulLogic = `
  // ─────────────────────────────────────
  // EKSTRAKURIKULER
  // ─────────────────────────────────────
  _ekskulBadgeColor(jenis) {
    const map = {
      'Ekstrakurikuler': { bg: 'rgba(59,130,246,0.12)', color: '#1d4ed8' },
      'Organisasi':      { bg: 'rgba(16,185,129,0.12)', color: '#047857' },
      'Kepanitiaan':     { bg: 'rgba(245,158,11,0.12)', color: '#b45309' },
      'Lainnya':         { bg: 'rgba(100,116,139,0.1)', color: 'var(--text-muted)' }
    };
    return map[jenis] || map['Lainnya'];
  },

  renderEkskulList() {
    const container = _('ekskul-list');
    if (!container) return;
    const data = this._ekskulData;

    if (!data || !data.length) {
      container.innerHTML = \`<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px;">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto 8px;display:block;opacity:0.4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        Belum ada Ekstrakurikuler / Organisasi yang ditambahkan.
      </div>\`;
      return;
    }

    container.innerHTML = data.map(e => {
      const badge = this._ekskulBadgeColor(e.jenis);
      return \`
        <div style="display:flex;gap:14px;padding:14px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:10px;background:var(--bg-primary);">
          <div style="width:40px;height:40px;background:\${badge.bg};border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="\${badge.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
          </div>
          <div style="flex:1;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
              <div style="font-weight:700;font-size:14px;color:var(--text-primary);line-height:1.4;">\${e.nama_ekskul || e.nama}</div>
              <div style="display:flex;gap:4px;flex-shrink:0;">
                <button class="btn btn-ghost btn-sm" onclick="StudentApp.editEkskul(\${e.id})" title="Edit" style="padding:3px 7px;">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn btn-ghost btn-sm" onclick="StudentApp.deleteEkskul(\${e.id})" title="Hapus" style="padding:3px 7px;color:var(--sangat-berat);">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="m19 6-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6m5 0V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">
              <span style="padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;background:\${badge.bg};color:\${badge.color};">\${e.jenis}</span>
              \${e.posisi ? \`<span style="padding:2px 8px;border-radius:999px;font-size:11px;background:var(--bg-input);color:var(--text-secondary);">\${e.posisi}</span>\` : ''}
              \${e.tahun ? \`<span style="padding:2px 8px;border-radius:999px;font-size:11px;background:var(--bg-input);color:var(--text-secondary);">\${e.tahun}</span>\` : ''}
            </div>
            \${e.keterangan ? \`<div style="margin-top:6px;font-size:12px;color:var(--text-muted);line-height:1.5;">\${e.keterangan}</div>\` : ''}
          </div>
        </div>
      \`;
    }).join('');
  },

  async submitEkskul() {
    const editId = _('ekskul-edit-id').value;
    const data = {
      nama_ekskul: _('ekskul-nama').value.trim(),
      jenis: _('ekskul-jenis').value,
      posisi: _('ekskul-posisi').value.trim(),
      tahun: _('ekskul-tahun').value.trim(),
      keterangan: _('ekskul-keterangan').value.trim(),
    };
    if (!data.nama_ekskul || !data.jenis) return Toast.error('Nama dan Jenis wajib diisi');

    Spinner.show();
    try {
      if (editId) {
        await API.updateEkskul(editId, data, this.token);
        Toast.success('Data berhasil diperbarui');
      } else {
        await API.addEkskul(data, this.token);
        Toast.success('Data berhasil ditambahkan');
      }
      this.resetFormEkskul();
      await this.loadPortofolio();
      this.renderEkskulList(); // update immediately if loadPorto sets it
    } catch (e) {
      Spinner.hide();
      Toast.error('Gagal: ' + e.message);
    }
  },

  editEkskul(id) {
    const e = this._ekskulData.find(x => x.id === id);
    if (!e) return;
    _('ekskul-edit-id').value = e.id;
    _('ekskul-nama').value = e.nama_ekskul || e.nama;
    _('ekskul-jenis').value = e.jenis;
    _('ekskul-posisi').value = e.posisi || '';
    _('ekskul-tahun').value = e.tahun || '';
    _('ekskul-keterangan').value = e.keterangan || '';
    
    const submitBtn = _('form-ekskul').querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.innerHTML = '💾 Perbarui Data';
    
    const cancelBtn = _('btn-cancel-ekskul');
    if (cancelBtn) cancelBtn.style.display = 'inline-flex';
    
    _('form-ekskul').scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  resetFormEkskul() {
    _('ekskul-edit-id').value = '';
    _('form-ekskul').reset();
    
    const submitBtn = _('form-ekskul').querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.innerHTML = \`Simpan Data\`;
    
    const cancelBtn = _('btn-cancel-ekskul');
    if (cancelBtn) cancelBtn.style.display = 'none';
  },

  async deleteEkskul(id) {
    const ok = await Modal.confirm({
      title: 'Hapus Data?',
      body: 'Data ekstrakurikuler/organisasi ini akan dihapus permanen.',
      confirmText: 'Hapus', danger: true
    });
    if (!ok) return;
    Spinner.show();
    try {
      await API.deleteEkskul(id, this.token);
      Toast.success('Data dihapus');
      await this.loadPortofolio();
      this.renderEkskulList();
    } catch (e) {
      Spinner.hide();
      Toast.error('Gagal: ' + e.message);
    }
  }
};
`;

// replace the last '};\n' with the new logic + '};'
js = js.replace(/};\s*\/\/ Helper shorthand/, ekskulLogic + '\n// Helper shorthand');

fs.writeFileSync(jsPath, js);
console.log('Ekskul logic injected successfully!');
