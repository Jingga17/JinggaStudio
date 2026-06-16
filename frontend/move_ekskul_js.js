const fs = require('fs');

const path = 'C:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM\\frontend\\js\\pages\\student.js';
let js = fs.readFileSync(path, 'utf-8');

// 1. Update loadPortofolio to load ekskul
const loadPortofolioOld = `      const [rapor, prestasi] = await Promise.all([
        API.getRapor(this.token),
        API.getPrestasi(this.token),
      ]);
      this._raporData = rapor || [];
      this._prestasiData = prestasi || [];`;

const loadPortofolioNew = `      const [rapor, prestasi, ekskul] = await Promise.all([
        API.getRapor(this.token),
        API.getPrestasi(this.token),
        API.getEkskul(this.token),
      ]);
      this._raporData = rapor || [];
      this._prestasiData = prestasi || [];
      this._ekskulData = ekskul || [];`;

if (js.includes(loadPortofolioOld)) {
    js = js.replace(loadPortofolioOld, loadPortofolioNew);
}

// 2. Add _ekskulData = []
if (!js.includes('_ekskulData: []')) {
    js = js.replace('_prestasiData: [],', '_prestasiData: [],\n  _ekskulData: [],');
}

// 3. Update switchPortoTab
const switchOld = `const tabs = ['rapor', 'prestasi'];`;
const switchNew = `const tabs = ['rapor', 'prestasi', 'ekskul'];`;
if (js.includes(switchOld)) {
    js = js.replace(switchOld, switchNew);
}

const renderCallOld = `if (tab === 'prestasi') this.renderPrestasiList();`;
const renderCallNew = `if (tab === 'prestasi') this.renderPrestasiList();
    if (tab === 'ekskul') this.renderEkskulList();`;
if (js.includes(renderCallOld) && !js.includes('renderEkskulList()')) {
    js = js.replace(renderCallOld, renderCallNew);
}

// 4. Add Ekskul CRUD functions
const ekskulFunctions = `
  // ─────────────────────────────────────
  // EKSKUL / ORGANISASI
  // ─────────────────────────────────────
  renderEkskulList() {
    const list = _('ekskul-list');
    if (!list) return;
    if (!this._ekskulData || this._ekskulData.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted);font-size:13px;">Belum ada data Ekstrakurikuler / Organisasi.</div>';
      return;
    }
    list.innerHTML = this._ekskulData.map(e => \`
      <div style="padding:12px 16px;border:1px solid var(--border);border-radius:8px;margin-bottom:12px;background:#fafafa;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div style="font-weight:700;font-size:14px;color:var(--text-primary);margin-bottom:4px;">\${e.nama_kegiatan}</div>
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">\${e.jenis} \${e.posisi ? '• ' + e.posisi : ''}</div>
            <div style="font-size:12px;color:var(--text-muted);">Tahun: \${e.tahun || '-'}</div>
            \${e.keterangan ? \`<div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">\${e.keterangan}</div>\` : ''}
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-outline" style="padding:4px 8px;font-size:12px;" onclick="StudentApp.editEkskul(\${e.id})">Edit</button>
            <button class="btn" style="padding:4px 8px;font-size:12px;background:#fef2f2;color:#ef4444;border-color:#fecaca;" onclick="StudentApp.deleteEkskul(\${e.id})">Hapus</button>
          </div>
        </div>
      </div>
    \`).join('');
  },

  async submitEkskul() {
    const btn = _('form-ekskul').querySelector('button[type="submit"]');
    const oldText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Menyimpan...';
    try {
      const id = _('ekskul-edit-id').value;
      const payload = {
        nama_kegiatan: _('ekskul-nama').value.trim(),
        jenis: _('ekskul-jenis').value,
        posisi: _('ekskul-posisi').value.trim(),
        tahun: _('ekskul-tahun').value.trim(),
        keterangan: _('ekskul-keterangan').value.trim()
      };
      let res;
      if (id) {
        res = await API.updateEkskul(id, payload, this.token);
        const idx = this._ekskulData.findIndex(x => x.id == id);
        if (idx !== -1) this._ekskulData[idx] = res.data;
      } else {
        res = await API.addEkskul(payload, this.token);
        this._ekskulData.unshift(res.data);
      }
      this.resetFormEkskul();
      this.renderEkskulList();
      const st = _('ekskul-save-status');
      st.textContent = 'Berhasil disimpan!';
      setTimeout(() => st.textContent = '', 3000);
    } catch (e) {
      Toast.error('Gagal menyimpan ekstrakurikuler: ' + e.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = oldText;
    }
  },

  editEkskul(id) {
    const data = this._ekskulData.find(x => x.id == id);
    if (!data) return;
    _('ekskul-edit-id').value = data.id;
    _('ekskul-nama').value = data.nama_kegiatan;
    _('ekskul-jenis').value = data.jenis;
    _('ekskul-posisi').value = data.posisi || '';
    _('ekskul-tahun').value = data.tahun || '';
    _('ekskul-keterangan').value = data.keterangan || '';
    _('btn-cancel-ekskul').style.display = 'inline-block';
    _('form-ekskul').querySelector('button[type="submit"]').textContent = 'Update Data';
  },

  resetFormEkskul() {
    _('form-ekskul').reset();
    _('ekskul-edit-id').value = '';
    _('btn-cancel-ekskul').style.display = 'none';
    _('form-ekskul').querySelector('button[type="submit"]').textContent = 'Simpan Data';
  },

  async deleteEkskul(id) {
    if (!confirm('Yakin ingin menghapus ekstrakurikuler/organisasi ini?')) return;
    try {
      await API.deleteEkskul(id, this.token);
      this._ekskulData = this._ekskulData.filter(x => x.id != id);
      this.renderEkskulList();
      Toast.success('Ekstrakurikuler berhasil dihapus');
    } catch (e) {
      Toast.error('Gagal menghapus: ' + e.message);
    }
  },
`;

if (!js.includes('renderEkskulList()')) {
    const targetPre = `  // ─────────────────────────────────────
  // QUIZ & KUESIONER`;
    if (js.includes(targetPre)) {
        js = js.replace(targetPre, ekskulFunctions + '\n' + targetPre);
    }
}

fs.writeFileSync(path, js);
console.log('student.js updated for ekskul!');
