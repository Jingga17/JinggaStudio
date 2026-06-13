const fs = require('fs');
let code = fs.readFileSync('frontend/js/pages/report.js', 'utf8');

const inject1 = `
    const kekuatanSubNames = kekuatan.map(k => k.name);
    const strengthAnswers = answers.filter(a => {
      if (!kekuatanSubNames.includes(a.sub_bidang)) return false;
      const ans = a.jawaban.toLowerCase();
      return (a.arah_jawaban === 'Negative' && ans === 'tidak') ||
             (a.arah_jawaban === 'Positive' && ans === 'ya');
    }).slice(0, 10);
    
    let kekuatanAnsRows = '';
    let kRowNo = 1;
    strengthAnswers.forEach(a => {
      const displayAns = a.jawaban.toLowerCase() === 'ya' ? 'Ya' : 'Tidak';
      const indicator = '✅ Kondusif';
      kekuatanAnsRows += \`<tr>
        <td style="text-align:center">\${kRowNo++}</td>
        <td style="text-align:center"><b>\${a.sub_bidang}</b></td>
        <td style="text-align:left">\${a.teks_soal}</td>
        <td style="text-align:center"><b>\${displayAns}</b></td>
        <td style="text-align:center; color: #10b981;">\${indicator}</td>
      </tr>\`;
    });
    if (strengthAnswers.length === 0) {
      kekuatanAnsRows = \`<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">Tidak ditemukan pernyataan kekuatan.</td></tr>\`;
    }
`;

const splitStr1 = `      }).join('');\n\n      let html = \`\n        \${this.getKopSurat('LAPORAN ANALISIS INDIVIDU')}`;
const parts1 = code.split(splitStr1);
if (parts1.length === 2) {
  code = parts1[0] + `      }).join('');\n` + inject1 + `\n      let html = \`\n        \${this.getKopSurat('LAPORAN ANALISIS INDIVIDU')}` + parts1[1];
  console.log('Fixed renderIndividuReal');
} else {
  console.log('parts1 length:', parts1.length);
}

const inject2 = `
      const classKekuatanSubNames = kekuatan.map(k => k.name);
      const classKekuatanQuestions = QUESTIONS_DATA.filter(q => {
        return q.tipe === 'Core' && classKekuatanSubNames.includes(q.sub_bidang);
      })
      .map(q => {
        const pCount = questionProblemsCount[q.id] || 0;
        const nonProblemCount = total_valid - pCount;
        const pct = total_valid > 0 ? ((nonProblemCount / total_valid) * 100) : 0;
        return { ...q, nonProblemCount, pct };
      })
      .sort((a,b) => b.nonProblemCount - a.nonProblemCount)
      .slice(0, 10);
      
      let classKekuatanAnsRows = classKekuatanQuestions.map((q, idx) => {
        const arahKekuatan = q.arah === 'Negative' ? 'Tidak' : 'Ya';
        return \`<tr>
          <td style="text-align:center">\${idx+1}</td>
          <td style="text-align:center"><b>\${q.sub_bidang}</b></td>
          <td style="text-align:left">\${q.teks}</td>
          <td style="text-align:center"><b>\${arahKekuatan}</b></td>
          <td style="text-align:center">\${q.nonProblemCount} siswa</td>
          <td style="text-align:center; color: #10b981;"><b>\${q.pct.toFixed(1)}%</b> ✅ Kondusif</td>
        </tr>\`;
      }).join('');
      if (classKekuatanQuestions.length === 0) {
        classKekuatanAnsRows = \`<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">Tidak ditemukan pernyataan kekuatan.</td></tr>\`;
      }
`;

const splitStr2 = `      }).join('');\n\n      let html = \`\n        \${this.getKopSurat(\`LAPORAN ANALISIS KELAS<br>KELAS \${kelas}\`)}`;
const parts2 = code.split(splitStr2);
if (parts2.length === 2) {
  code = parts2[0] + `      }).join('');\n` + inject2 + `\n      let html = \`\n        \${this.getKopSurat(\`LAPORAN ANALISIS KELAS<br>KELAS \${kelas}\`)}` + parts2[1];
  console.log('Fixed renderKelasReal');
} else {
  console.log('parts2 length:', parts2.length);
}

fs.writeFileSync('frontend/js/pages/report.js', code);
console.log('Done.');
