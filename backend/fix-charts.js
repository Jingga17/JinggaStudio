const fs = require('fs');
const path = 'c:/Users/LENOVO/Desktop/WORK/aplikasi/DCM/frontend/js/pages/admin.js';
let content = fs.readFileSync(path, 'utf8');

// Fix chart configs - replace field names to match seed data
const oldCharts = `    if (tabId === 'demografi') {\r\n        const agamaCounts = this.autoAggregate(filteredStudents, 'agama');\r\n        configs.push({ title: 'Agama', data: agamaCounts, type: 'pie' });\r\n    } else if (tabId === 'keluarga') {\r\n        const pddCounts = this.autoAggregate(filteredStudents, 'pendidikan_ayah');\r\n        configs.push({ title: 'Pendidikan Ayah', data: pddCounts, type: 'bar' });\r\n        const hslCounts = this.autoAggregate(filteredStudents, 'penghasilan_ayah');\r\n        configs.push({ title: 'Penghasilan Ayah', data: hslCounts, type: 'bar' });\r\n    } else if (tabId === 'akademik') {\r\n        const ekskulCounts = this.autoAggregate(filteredStudents, 'ekstrakurikuler');\r\n        configs.push({ title: 'Minat Ekstrakurikuler', data: ekskulCounts, type: 'bar' });\r\n    } else if (tabId === 'sosial') {\r\n        const jarakCounts = this.autoAggregate(filteredStudents, 'jarak_ke_sekolah');\r\n        configs.push({ title: 'Jarak ke Sekolah', data: jarakCounts, type: 'pie' });\r\n    } else if (tabId === 'kesehatan') {\r\n        configs.push({ title: 'Kesehatan Fisik', data: {'Sehat': filteredStudents.length}, type: 'pie' });\r\n    }`;

const newCharts = `    if (tabId === 'demografi') {
        const agamaCounts = this.autoAggregate(filteredStudents, 'agama');
        configs.push({ title: 'Agama', data: agamaCounts, type: 'pie' });
        const jkCounts = {};
        filteredStudents.forEach(s => { const v = s.jenis_kelamin === 'L' ? 'Laki-laki' : (s.jenis_kelamin === 'P' ? 'Perempuan' : 'Tidak Diisi'); jkCounts[v] = (jkCounts[v] || 0) + 1; });
        configs.push({ title: 'Jenis Kelamin', data: jkCounts, type: 'pie' });
    } else if (tabId === 'keluarga') {
        const pddCounts = this.autoAggregate(filteredStudents, 'ayah_pendidikan');
        configs.push({ title: 'Pendidikan Ayah', data: pddCounts, type: 'bar' });
        const hslCounts = this.autoAggregate(filteredStudents, 'ayah_penghasilan');
        configs.push({ title: 'Penghasilan Ayah', data: hslCounts, type: 'bar' });
        const statusKelCounts = this.autoAggregate(filteredStudents, 'status_keluarga');
        configs.push({ title: 'Status Keluarga', data: statusKelCounts, type: 'pie' });
    } else if (tabId === 'akademik') {
        const bimbelCounts = this.autoAggregate(filteredStudents, 'ikut_bimbel');
        configs.push({ title: 'Ikut Bimbel', data: bimbelCounts, type: 'pie' });
        const gBelajarCounts = this.autoAggregate(filteredStudents, 'gaya_belajar');
        configs.push({ title: 'Gaya Belajar', data: gBelajarCounts, type: 'bar' });
        const rencanaLulusCounts = this.autoAggregate(filteredStudents, 'rencana_lulus');
        configs.push({ title: 'Rencana Setelah Lulus', data: rencanaLulusCounts, type: 'bar' });
    } else if (tabId === 'sosial') {
        const transportasiCounts = this.autoAggregate(filteredStudents, 'transportasi');
        configs.push({ title: 'Moda Transportasi', data: transportasiCounts, type: 'pie' });
        const bgaulCounts = this.autoAggregate(filteredStudents, 'bergaul');
        configs.push({ title: 'Pola Bergaul', data: bgaulCounts, type: 'bar' });
    } else if (tabId === 'kesehatan') {
        const penyakitCounts = this.autoAggregate(filteredStudents, 'penyakit');
        configs.push({ title: 'Riwayat Penyakit', data: penyakitCounts, type: 'bar' });
        const kacamataCounts = this.autoAggregate(filteredStudents, 'kacamata');
        configs.push({ title: 'Pengguna Kacamata', data: kacamataCounts, type: 'pie' });
    }`;

if (content.includes(oldCharts)) {
    content = content.replace(oldCharts, newCharts);
    fs.writeFileSync(path, content);
    console.log('SUCCESS: Chart configs fixed!');
} else {
    // Try with \n instead of \r\n
    const oldChartsLF = oldCharts.replace(/\r\n/g, '\n');
    if (content.includes(oldChartsLF)) {
        content = content.replace(oldChartsLF, newCharts);
        fs.writeFileSync(path, content);
        console.log('SUCCESS (LF): Chart configs fixed!');
    } else {
        console.log('FAILED: Could not find target block. Showing nearby content...');
        const idx = content.indexOf("configs.push({ title: 'Agama'");
        console.log('Found at index:', idx);
        console.log('Content around it:', JSON.stringify(content.substring(idx - 200, idx + 500)));
    }
}
