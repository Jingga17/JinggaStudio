const { db, query, run, get } = require('./index.js');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

async function seed() {
    try {
        console.log('Seeding database...');
        
        // 1. Check if admin exists
        const hash = await bcrypt.hash('admin123', 10);
        const adminExists = await get("SELECT * FROM admins WHERE username = 'admin'");
        if (!adminExists) {
            await run("INSERT INTO admins (username, password, nama) VALUES ('admin', ?, 'Administrator')", [hash]);
            console.log('Created default admin (admin / admin123)');
        } else {
            await run("UPDATE admins SET password = ?, nama = 'Administrator' WHERE username = 'admin'", [hash]);
            console.log('Updated default admin password to admin123');
        }

        // 2. Seed questions from data-soal.js if the table is empty
        const qCount = await get("SELECT COUNT(*) as count FROM questions");
        if (qCount.count === 0) {
            console.log('Seeding questions from data-soal.js...');
            const dataSoalPath = path.join(__dirname, '../../../frontend/js/data-soal.js');
            if (fs.existsSync(dataSoalPath)) {
                const fileContent = fs.readFileSync(dataSoalPath, 'utf8');
                const jsonStart = fileContent.indexOf('[');
                const jsonEnd = fileContent.lastIndexOf(']') + 1;
                const jsonStr = fileContent.substring(jsonStart, jsonEnd);
                
                let questionsData = [];
                try {
                    questionsData = eval(jsonStr);
                } catch (evalErr) {
                    console.error('Failed to eval questions string:', evalErr.message);
                }

                if (questionsData && questionsData.length > 0) {
                    db.serialize(() => {
                        db.run("BEGIN TRANSACTION");
                        const stmt = db.prepare(`
                            INSERT INTO questions (id, teks_soal, tipe_soal, bidang, sub_bidang, arah_jawaban, consistency_pair_id)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        `);
                        for (const q of questionsData) {
                            stmt.run(
                                q.id,
                                q.teks,
                                q.tipe,
                                q.bidang,
                                q.sub_bidang,
                                q.arah,
                                q.pair || null
                            );
                        }
                        stmt.finalize();
                        db.run("COMMIT", (err) => {
                            if (err) console.error("Commit error:", err);
                            else console.log(`Successfully seeded ${questionsData.length} questions into DB!`);
                        });
                    });
                }
            } else {
                console.warn('data-soal.js not found at:', dataSoalPath);
            }
        } else {
            console.log(`Questions table already has ${qCount.count} records.`);
        }

        // 3. Add dummy students if none exist
        const studentExists = await get("SELECT * FROM students");
        if (!studentExists) {
            await run("INSERT INTO students (nama, jenis_kelamin, kelas, nisn, is_valid, lie_scale_score, consistency_score, is_complete) VALUES ('Ahmad Fauzi', 'L', 'XII IPA 1', '0012345678', 1, 2, 1, 1)");
            await run("INSERT INTO students (nama, jenis_kelamin, kelas, nisn, is_valid, lie_scale_score, consistency_score, is_complete) VALUES ('Siti Rahayu', 'P', 'XII IPA 1', '0023456789', 1, 4, 2, 1)");
            console.log('Created dummy students for testing PDF');
        }

        // 4. Add dummy answers for dummy students if they don't have any answers
        const students = await query("SELECT id, nama FROM students");
        for (const s of students) {
            const answersCount = await get("SELECT COUNT(*) as count FROM answers WHERE student_id = ?", [s.id]);
            if (answersCount.count < 220 && (s.nama === 'Ahmad Fauzi' || s.nama === 'Siti Rahayu')) {
                console.log(`Seeding/resetting dummy answers for ${s.nama}...`);
                await run("DELETE FROM answers WHERE student_id = ?", [s.id]);
                const questions = await query("SELECT * FROM questions");
                
                db.serialize(() => {
                    db.run("BEGIN TRANSACTION");
                    const stmt = db.prepare(`
                        INSERT INTO answers (student_id, question_id, jawaban)
                        VALUES (?, ?, ?)
                    `);
                    
                    let lieIndex = 0;
                    let ccPairCounts = {};
                    
                    for (const q of questions) {
                        let jawaban = 'tidak';
                        
                        if (q.tipe_soal === 'Lie Scale') {
                            const maxLie = s.nama === 'Ahmad Fauzi' ? 2 : 4;
                            if (lieIndex < maxLie) {
                                jawaban = 'ya';
                                lieIndex++;
                            } else {
                                jawaban = 'tidak';
                            }
                        } else if (q.tipe_soal === 'Consistency Check' && q.consistency_pair_id) {
                            const maxInconsistent = s.nama === 'Ahmad Fauzi' ? 1 : 2;
                            const pairId = q.consistency_pair_id;
                            if (!ccPairCounts[pairId]) {
                                ccPairCounts[pairId] = 0;
                            }
                            ccPairCounts[pairId]++;
                            
                            if (ccPairCounts[pairId] === 1) {
                                jawaban = 'ya';
                            } else {
                                const shouldBeInconsistent = pairId <= maxInconsistent;
                                jawaban = shouldBeInconsistent ? 'ya' : 'tidak';
                            }
                        } else if (q.tipe_soal === 'Core') {
                            const problemProb = s.nama === 'Ahmad Fauzi' ? 0.25 : 0.45;
                            const isProblem = Math.random() < problemProb;
                            
                            if (isProblem) {
                                jawaban = q.arah_jawaban === 'Negative' ? 'ya' : 'tidak';
                            } else {
                                jawaban = q.arah_jawaban === 'Negative' ? 'tidak' : 'ya';
                            }
                        }
                        
                        stmt.run(s.id, q.id, jawaban);
                    }
                    
                    stmt.finalize();
                    db.run("COMMIT", async (err) => {
                        if (err) {
                            console.error(`Error committing answers for ${s.nama}:`, err);
                        } else {
                            console.log(`Successfully seeded answers for ${s.nama}!`);
                            const { calculateStudentScores } = require('../services/scoring');
                            const scores = await calculateStudentScores(s.id);
                            await run(`
                                UPDATE students 
                                SET lie_scale_score = ?, consistency_score = ?, is_valid = ?
                                WHERE id = ?
                            `, [scores.lie_score, scores.cc_score, scores.is_valid, s.id]);
                            console.log(`Updated scores in DB for ${s.nama}: Pribadi ${scores.pribadi_pct}%, Belajar ${scores.belajar_pct}%, Sosial ${scores.sosial_pct}%, Karir ${scores.karir_pct}%`);
                        }
                    });
                });
            }
        }

        console.log('Seeding complete!');
    } catch (err) {
        console.error('Seeding error:', err);
    }
}

seed();
