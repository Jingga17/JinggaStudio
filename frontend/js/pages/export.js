/**
 * export.js - Frontend export & cetak laporan functions
 * Berisi fungsi-fungsi untuk:
 * - Cetak laporan PDF individu
 * - Download ZIP rapor kelas
 * - Export Excel buku induk
 * - Export Excel master siswa
 */

const ExportApp = {

  /**
   * Buka laporan PDF individu siswa di tab baru
   */
  cetakLaporanIndividu(studentId) {
    if (!studentId) {
      Toast.error('ID Siswa tidak ditemukan.');
      return;
    }
    window.open(`/report?id=${studentId}`, '_blank');
  },

  /**
   * Download ZIP berisi semua laporan PDF kelas
   */
  async downloadZipKelas(kelas) {
    if (!kelas) {
      Toast.error('Pilih kelas terlebih dahulu.');
      return;
    }
    Spinner.show('Menyiapkan file ZIP...');
    try {
      const response = await fetch(`/api/export/zip?kelas=${encodeURIComponent(kelas)}`, {
        headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
      });
      if (!response.ok) throw new Error('Gagal mengunduh. Server error: ' + response.status);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-kelas-${kelas}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      Toast.success('Download berhasil!');
    } catch (e) {
      Toast.error(e.message || 'Gagal mengunduh ZIP.');
    } finally {
      Spinner.hide();
    }
  },

  /**
   * Export Data Master Siswa ke Excel
   */
  exportMasterSiswaExcel(data) {
    if (!data || data.length === 0) {
      Toast.error('Tidak ada data untuk diekspor.');
      return;
    }
    try {
      const rows = [
        ['No', 'Nama', 'NISN', 'Kelas', 'Username', 'Status DCM']
      ];
      data.forEach((s, i) => {
        rows.push([
          i + 1,
          s.nama || '-',
          s.nisn || '-',
          s.kelas || '-',
          s.username || '-',
          s.dcm_valid ? 'Sudah Mengisi' : 'Belum Mengisi'
        ]);
      });
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');
      XLSX.writeFile(wb, `master-siswa-${new Date().toISOString().split('T')[0]}.xlsx`);
      Toast.success('Export Excel berhasil!');
    } catch (e) {
      Toast.error('Gagal export: ' + e.message);
    }
  },

  /**
   * Export Buku Induk ke Excel
   */
  async exportBukuIndukExcel(data) {
    if (!data || data.length === 0) {
      Toast.error('Tidak ada data buku induk untuk diekspor.');
      return;
    }
    try {
      const rows = [
        ['No', 'Nama', 'NISN', 'Kelas', 'Jenis Kelamin', 'Tempat Lahir', 'Tanggal Lahir', 'Agama', 'Alamat', 'No HP', 'Nama Ayah', 'Pekerjaan Ayah', 'Nama Ibu', 'Pekerjaan Ibu']
      ];
      data.forEach((s, i) => {
        let pribadi = {};
        try { if (s.data_pribadi) pribadi = typeof s.data_pribadi === 'string' ? JSON.parse(s.data_pribadi) : s.data_pribadi; } catch(e) {}
        rows.push([
          i + 1,
          s.nama || '-',
          s.nisn || '-',
          s.kelas || '-',
          pribadi.jk || pribadi.jenis_kelamin || '-',
          pribadi.tempat_lahir || '-',
          pribadi.tanggal_lahir || '-',
          pribadi.agama || '-',
          pribadi.alamat || '-',
          pribadi.no_hp || pribadi.no_hp_ortu || '-',
          pribadi.nama_ayah || '-',
          pribadi.pekerjaan_ayah || '-',
          pribadi.nama_ibu || '-',
          pribadi.pekerjaan_ibu || '-'
        ]);
      });
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      // Set column widths
      ws['!cols'] = rows[0].map(() => ({ wch: 20 }));
      XLSX.utils.book_append_sheet(wb, ws, 'Buku Induk');
      XLSX.writeFile(wb, `buku-induk-${new Date().toISOString().split('T')[0]}.xlsx`);
      Toast.success('Export Buku Induk berhasil!');
    } catch (e) {
      Toast.error('Gagal export: ' + e.message);
    }
  },

  /**
   * Export Rapor/Nilai Siswa ke Excel
   */
  async exportRaporExcel(studentId, nama) {
    Spinner.show('Mengambil data rapor...');
    try {
      const res = await API.get(`/students/${studentId}/rapor`);
      const raporList = res.data || [];
      if (raporList.length === 0) {
        Toast.error('Belum ada data rapor untuk siswa ini.');
        return;
      }
      const rows = [
        ['Nama Siswa', nama || '-'],
        [],
        ['Semester', 'Kelas', 'Mata Pelajaran', 'Nilai', 'Catatan']
      ];
      raporList.forEach(r => {
        rows.push([
          r.semester || '-',
          r.kelas || '-',
          r.mata_pelajaran || '-',
          r.nilai !== undefined ? r.nilai : '-',
          r.catatan || '-'
        ]);
      });
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 25 }, { wch: 10 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Rapor');
      XLSX.writeFile(wb, `rapor-${(nama || 'siswa').replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`);
      Toast.success('Export Rapor berhasil!');
    } catch (e) {
      Toast.error('Gagal export rapor: ' + e.message);
    } finally {
      Spinner.hide();
    }
  },

  /**
   * Cetak halaman laporan menggunakan browser print
   */
  printReport(elementId) {
    const el = document.getElementById(elementId);
    if (!el) {
      Toast.error('Elemen laporan tidak ditemukan.');
      return;
    }
    window.print();
  },

  /**
   * Buka rekap ZIP download dialog untuk kelas tertentu
   */
  openDownloadDialog() {
    const modal = document.getElementById('download-zip-modal');
    if (modal) modal.classList.add('open');
  },

  closeDownloadDialog() {
    const modal = document.getElementById('download-zip-modal');
    if (modal) modal.classList.remove('open');
  }
};

// Make globally accessible
window.ExportApp = ExportApp;
