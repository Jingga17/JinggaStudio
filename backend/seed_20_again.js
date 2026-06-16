const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const db = new sqlite3.Database('./src/db/database.sqlite');

const questions = JSON.parse(fs.readFileSync('../scratch/questions.json', 'utf8'));

db.serialize(() => {
    // We don't delete everything here, just insert new into active session
    db.get("SELECT id FROM sessions WHERE is_active = 1 ORDER BY id DESC LIMIT 1", (err, session) => {
        if (err || !session) return console.error("No active session! Please create one first.");
        const sessionId = session.id;

        const stmtS = db.prepare("INSERT INTO students (nama, jenis_kelamin, kelas, ttl, nisn, session_id, is_valid, validation_note, lie_scale_score, consistency_score, durasi_pengisian, is_complete) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        const stmtA = db.prepare("INSERT INTO answers (student_id, question_id, jawaban) VALUES (?, ?, ?)");

        const personas = [
            // Kelas: XI IPA 1
            { id: 1, name: "Andi (Sangat Kondusif)", kelas: "XI IPA 1", type: "perfect" },
            { id: 2, name: "Budi (Butuh Penanganan Segera)", kelas: "XI IPA 1", type: "terrible" },
            { id: 3, name: "Citra (Pembohong / Lie Scale Max)", kelas: "XI IPA 1", type: "liar" },
            { id: 4, name: "Dani (Tidak Konsisten)", kelas: "XI IPA 1", type: "inconsistent" },
            { id: 5, name: "Eka (Invalid - Bohong & Inkonsisten)", kelas: "XI IPA 1", type: "invalid" },
            { id: 6, name: "Fina (Bermasalah di Belajar)", kelas: "XI IPA 1", type: "bad_belajar" },
            { id: 7, name: "Gina (Bermasalah di Sosial)", kelas: "XI IPA 1", type: "bad_sosial" },

            // Kelas: XI IPA 2
            { id: 8, name: "Hadi (Bermasalah di Pribadi)", kelas: "XI IPA 2", type: "bad_pribadi" },
            { id: 9, name: "Ira (Bermasalah di Karir)", kelas: "XI IPA 2", type: "bad_karir" },
            { id: 10, name: "Joko (Valid dg Syarat - Lie Sedang)", kelas: "XI IPA 2", type: "warn_lie" },
            { id: 11, name: "Kiki (Valid dg Syarat - CC Sedang)", kelas: "XI IPA 2", type: "warn_cc" },
            { id: 12, name: "Lina (Invalid - Terlalu Cepat)", kelas: "XI IPA 2", type: "fast" },
            { id: 13, name: "Mira (Butuh Penanganan - Sedang)", kelas: "XI IPA 2", type: "mixed" },
            { id: 14, name: "Nina (Sangat Kondusif)", kelas: "XI IPA 2", type: "perfect" },

            // Kelas: XI IPS 1
            { id: 15, name: "Oka (Sangat Kondusif)", kelas: "XI IPS 1", type: "perfect" },
            { id: 16, name: "Putri (Butuh Penanganan Segera)", kelas: "XI IPS 1", type: "terrible" },
            { id: 17, name: "Qori (Butuh Penanganan)", kelas: "XI IPS 1", type: "mixed" },
            { id: 18, name: "Rama (Valid dg Syarat - Gabungan)", kelas: "XI IPS 1", type: "warn_both" },
            { id: 19, name: "Sari (Bermasalah Belajar & Pribadi)", kelas: "XI IPS 1", type: "bad_belajar_pribadi" },
            { id: 20, name: "Tomi (Bermasalah Sosial & Karir)", kelas: "XI IPS 1", type: "bad_sosial_karir" },
        ];

        let completed = 0;
        personas.forEach(p => {
            const nisn = '202400' + (p.id < 10 ? '0' + p.id : p.id) + Math.floor(Math.random()*1000); 
            const jk = p.id % 2 === 0 ? 'Perempuan' : 'Laki-laki';
            let durasi = p.type === 'fast' ? 180 : 1200; 
            
            // Insert basic student record first
            stmtS.run([p.name, jk, p.kelas, '2006-05-12', nisn, sessionId, 1, 'Valid', 0, 0, durasi, 1], function(err) {
                if (err) return console.error(err);
                const sid = this.lastID;
                
                let lieCount = 0;
                let ccCount = 0;
                let lastCcPair = null;

                questions.forEach(q => {
                    let ans = 'Tidak';
                    
                    if (p.type === 'perfect') {
                        ans = q.arah_jawaban === 'Positive' ? 'Ya' : 'Tidak';
                        if (q.tipe_soal === 'Lie Scale') ans = 'Tidak';
                    } else if (p.type === 'terrible') {
                        ans = q.arah_jawaban === 'Positive' ? 'Tidak' : 'Ya';
                        if (q.tipe_soal === 'Lie Scale') ans = 'Tidak';
                    } else if (p.type === 'mixed' || p.type === 'fast') {
                        ans = Math.random() > 0.5 ? 'Ya' : 'Tidak';
                    } else if (p.type === 'liar') {
                        ans = q.arah_jawaban === 'Positive' ? 'Ya' : 'Tidak'; 
                        if (q.tipe_soal === 'Lie Scale') ans = 'Ya';
                    } else if (p.type === 'inconsistent') {
                        ans = q.arah_jawaban === 'Positive' ? 'Ya' : 'Tidak'; 
                        if (q.tipe_soal === 'Lie Scale') ans = 'Tidak';
                        if (q.tipe_soal === 'Consistency Check') ans = 'Ya'; 
                    } else if (p.type === 'invalid') {
                        ans = Math.random() > 0.5 ? 'Ya' : 'Tidak';
                        if (q.tipe_soal === 'Lie Scale') ans = 'Ya';
                        if (q.tipe_soal === 'Consistency Check') ans = 'Tidak'; 
                    } else if (p.type === 'bad_belajar') {
                        ans = q.bidang === 'Belajar' ? (q.arah_jawaban === 'Positive' ? 'Tidak' : 'Ya') : (q.arah_jawaban === 'Positive' ? 'Ya' : 'Tidak');
                        if (q.tipe_soal === 'Lie Scale') ans = 'Tidak';
                    } else if (p.type === 'bad_sosial') {
                        ans = q.bidang === 'Sosial' ? (q.arah_jawaban === 'Positive' ? 'Tidak' : 'Ya') : (q.arah_jawaban === 'Positive' ? 'Ya' : 'Tidak');
                        if (q.tipe_soal === 'Lie Scale') ans = 'Tidak';
                    } else if (p.type === 'bad_pribadi') {
                        ans = q.bidang === 'Pribadi' ? (q.arah_jawaban === 'Positive' ? 'Tidak' : 'Ya') : (q.arah_jawaban === 'Positive' ? 'Ya' : 'Tidak');
                        if (q.tipe_soal === 'Lie Scale') ans = 'Tidak';
                    } else if (p.type === 'bad_karir') {
                        ans = q.bidang === 'Karir' ? (q.arah_jawaban === 'Positive' ? 'Tidak' : 'Ya') : (q.arah_jawaban === 'Positive' ? 'Ya' : 'Tidak');
                        if (q.tipe_soal === 'Lie Scale') ans = 'Tidak';
                    } else if (p.type === 'bad_belajar_pribadi') {
                        ans = (q.bidang === 'Belajar' || q.bidang === 'Pribadi') ? (q.arah_jawaban === 'Positive' ? 'Tidak' : 'Ya') : (q.arah_jawaban === 'Positive' ? 'Ya' : 'Tidak');
                        if (q.tipe_soal === 'Lie Scale') ans = 'Tidak';
                    } else if (p.type === 'bad_sosial_karir') {
                        ans = (q.bidang === 'Sosial' || q.bidang === 'Karir') ? (q.arah_jawaban === 'Positive' ? 'Tidak' : 'Ya') : (q.arah_jawaban === 'Positive' ? 'Ya' : 'Tidak');
                        if (q.tipe_soal === 'Lie Scale') ans = 'Tidak';
                    } else if (p.type === 'warn_lie') {
                        ans = q.arah_jawaban === 'Positive' ? 'Ya' : 'Tidak';
                        if (q.tipe_soal === 'Lie Scale') {
                            if (lieCount < 6) { ans = 'Ya'; lieCount++; } else { ans = 'Tidak'; }
                        }
                    } else if (p.type === 'warn_cc') {
                        ans = q.arah_jawaban === 'Positive' ? 'Ya' : 'Tidak';
                        if (q.tipe_soal === 'Lie Scale') ans = 'Tidak';
                        if (q.tipe_soal === 'Consistency Check') {
                            if (ccCount < 3 || (ccCount === 3 && lastCcPair === q.consistency_pair_id)) {
                                ans = 'Ya'; 
                                if (lastCcPair !== q.consistency_pair_id) { ccCount++; lastCcPair = q.consistency_pair_id; }
                            }
                        }
                    } else if (p.type === 'warn_both') {
                        ans = q.arah_jawaban === 'Positive' ? 'Ya' : 'Tidak';
                        if (q.tipe_soal === 'Lie Scale') {
                            if (lieCount < 6) { ans = 'Ya'; lieCount++; } else { ans = 'Tidak'; }
                        }
                        if (q.tipe_soal === 'Consistency Check') {
                            if (ccCount < 3 || (ccCount === 3 && lastCcPair === q.consistency_pair_id)) {
                                ans = 'Ya'; 
                                if (lastCcPair !== q.consistency_pair_id) { ccCount++; lastCcPair = q.consistency_pair_id; }
                            }
                        }
                    }

                    stmtA.run([sid, q.id, ans]);
                });
                
                completed++;
                if (completed === 20) {
                    console.log("20 dummy personas inserted!");
                    stmtS.finalize();
                    stmtA.finalize();
                    recalculateScores();
                }
            });
        });
        
        function recalculateScores() {
            db.all("SELECT student_id, q.tipe_soal, q.consistency_pair_id, a.jawaban, s.durasi_pengisian FROM answers a JOIN questions q ON a.question_id = q.id JOIN students s ON s.id = a.student_id", (err, rows) => {
                let scores = {};
                rows.forEach(r => {
                    if (!scores[r.student_id]) scores[r.student_id] = { lie: 0, consistRaw: {}, durasi: r.durasi_pengisian };
                    if (r.tipe_soal === 'Lie Scale' && r.jawaban === 'Ya') {
                        scores[r.student_id].lie++;
                    }
                    if (r.tipe_soal === 'Consistency Check') {
                        if (!scores[r.student_id].consistRaw[r.consistency_pair_id]) {
                            scores[r.student_id].consistRaw[r.consistency_pair_id] = [];
                        }
                        scores[r.student_id].consistRaw[r.consistency_pair_id].push(r.jawaban);
                    }
                });
                
                let s_completed = 0;
                let s_total = Object.keys(scores).length;
                
                for (let sid in scores) {
                    let consist = 0;
                    for (let pid in scores[sid].consistRaw) {
                        let pair = scores[sid].consistRaw[pid];
                        if (pair.length === 2 && pair[0] === pair[1]) consist++;
                    }
                    
                    let lie = scores[sid].lie;
                    let durasi = scores[sid].durasi;
                    
                    let is_valid = 1;
                    let note = 'Valid';
                    
                    if (durasi < 300) {
                        is_valid = 0;
                        note = 'Tidak Valid: Waktu pengerjaan terlalu cepat (< 5 menit)';
                    } else if (lie > 8 || consist > 4) {
                        is_valid = 0;
                        let reasons = [];
                        if (lie > 8) reasons.push('Skala Kebohongan terlalu tinggi');
                        if (consist > 4) reasons.push('Jawaban sangat inkonsisten');
                        note = 'Tidak Valid: ' + reasons.join(' & ');
                    } else if (lie >= 5 || consist >= 3) {
                        note = 'Valid dengan Syarat';
                    }
                    
                    db.run('UPDATE students SET lie_scale_score = ?, consistency_score = ?, is_valid = ?, validation_note = ? WHERE id = ?', 
                        [lie, consist, is_valid, note, sid], () => {
                            s_completed++;
                            if (s_completed === s_total) {
                                console.log("Finished recalculating all 20 students!");
                            }
                        });
                }
            });
        }
    });
});
