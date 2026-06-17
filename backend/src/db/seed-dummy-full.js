const { db, query, run, get } = require('./index.js');
const bcrypt = require('bcryptjs');

async function seedFullDummyData() {
    try {
        console.log('Generating FULL 50 dummy data...');

        // 1. Ensure an active session exists
        let session = await get("SELECT * FROM sessions WHERE is_active = 1 LIMIT 1");
        if (!session) {
            await run("INSERT INTO sessions (token, name, is_active) VALUES ('DUMMY-TOKEN-123', 'Sesi Ganjil 2025/2026', 1)");
            session = await get("SELECT * FROM sessions WHERE is_active = 1 LIMIT 1");
        }

        console.log('Clearing existing student data...');
        // Delete all answers, rapor, prestasi, ekskul
        await run("DELETE FROM answers");
        await run("DELETE FROM rapor");
        await run("DELETE FROM prestasi");
        await run("DELETE FROM ekskul");
        // Delete all students
        await run("DELETE FROM students");

        const firstNamesMale = ["Andi", "Budi", "Candra", "Dedi", "Eko", "Fajar", "Gilang", "Hadi", "Indra", "Joko", "Kevin", "Lukman", "Rizky", "Tomi", "Wahyu"];
        const firstNamesFemale = ["Ayu", "Bela", "Citra", "Dian", "Eka", "Fitri", "Gita", "Hana", "Intan", "Siti", "Nisa", "Putri", "Rina", "Sari", "Tia"];
        const lastNames = ["Santoso", "Pratama", "Wijaya", "Kusuma", "Setiawan", "Hermawan", "Lestari", "Putri", "Sari", "Rahmawati", "Nugroho", "Saputra"];
        const classes = ["XII IPA 1", "XII IPA 2", "XII IPS 1", "XII IPS 2", "XI IPA 1", "XI IPS 1", "X A", "X B"];

        const defaultPass = await bcrypt.hash('123456', 10);
        
        console.log('Inserting 50 new students...');

        for (let i = 1; i <= 50; i++) {
            const isMale = Math.random() > 0.5;
            const firstName = isMale ? firstNamesMale[Math.floor(Math.random() * firstNamesMale.length)] : firstNamesFemale[Math.floor(Math.random() * firstNamesFemale.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const fullName = `${firstName} ${lastName}`;
            const jk = isMale ? 'L' : 'P';
            const kls = classes[Math.floor(Math.random() * classes.length)];
            const nisn = String(1000000000 + i);

            const dataPribadi = {
                nama_panggilan: firstName,
                agama: 'Islam',
                kewarganegaraan: 'WNI',
                email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
                anak_ke: String(Math.floor(Math.random() * 3) + 1),
                dari_bersaudara: String(Math.floor(Math.random() * 2) + 3),
                ayah_nama: 'Bapak ' + lastName,
                ayah_status: 'Masih Hidup',
                ayah_pendidikan: ['SMA', 'D3', 'S1', 'S2'][Math.floor(Math.random() * 4)],
                ayah_pekerjaan: ['Wiraswasta', 'PNS', 'Karyawan Swasta', 'Buruh'][Math.floor(Math.random() * 4)],
                ayah_penghasilan: ['Rp 3.000.000', 'Rp 5.000.000 - Rp 10.000.000', '> Rp 10.000.000'][Math.floor(Math.random() * 3)],
                ayah_nohp: '081234567890',
                ibu_nama: 'Ibu ' + lastName,
                ibu_status: 'Masih Hidup',
                ibu_pendidikan: ['SMA', 'S1'][Math.floor(Math.random() * 2)],
                ibu_pekerjaan: ['Ibu Rumah Tangga', 'Guru', 'Wiraswasta'][Math.floor(Math.random() * 3)],
                ibu_penghasilan: ['Tidak Berpenghasilan', 'Rp 3.000.000'][Math.floor(Math.random() * 2)],
                ibu_nohp: '081234567891',
                status_ortu: 'Lengkap',
                gol_darah: ['A', 'B', 'AB', 'O'][Math.floor(Math.random() * 4)],
                tinggi: String(150 + Math.floor(Math.random() * 30)),
                berat: String(45 + Math.floor(Math.random() * 30)),
                penyakit: Math.random() > 0.8 ? 'Asma' : 'Tidak ada',
                disabilitas: 'Tidak ada',
                kacamata: Math.random() > 0.7 ? 'Ya' : 'Tidak',
                alergi: Math.random() > 0.8 ? 'Debu' : 'Tidak ada',
                asal_sekolah: 'SMPN 1 Kota',
                status_siswa: 'Baru',
                tinggal_kelas: 'Tidak Pernah',
                ikut_bimbel: Math.random() > 0.5 ? 'Ya' : 'Tidak',
                jenis_bimbel: 'Online',
                nama_bimbel: 'Ruang Guru',
                lama_bimbel: '1 Tahun',
                kendala_belajar: ['Kurang konsentrasi', 'Sering mengantuk', 'Tidak ada', 'Susah menghafal'][Math.floor(Math.random() * 4)],
                mapel_suka: ['Matematika', 'Biologi', 'Sejarah', 'Olahraga', 'Seni'][Math.floor(Math.random() * 5)],
                mapel_tidaksuka: ['Matematika', 'Sejarah', 'Bahasa Inggris', 'Fisika'][Math.floor(Math.random() * 4)],
                gaya_belajar: ['Visual', 'Auditori', 'Kinestetik'][Math.floor(Math.random() * 3)],
                rencana_lulus: ['Melanjutkan ke PTN', 'Kerja', 'Kedinasan'][Math.floor(Math.random() * 3)],
                status_tempat_tinggal: 'Bersama Orang Tua',
                status_rumah: 'Milik Sendiri',
                internet: 'Wifi Rumah, Kuota Pribadi',
                gadget: 'Smartphone, Laptop',
                kendaraan_motor: 'Ya, bawa sendiri',
                kendaraan_mobil: 'Tidak',
                waktu_belajar: 'Malam hari',
                jarak_rumah: String(Math.floor(Math.random() * 10) + 1) + ' km',
                transportasi: 'Kendaraan Pribadi',
                teman_sekolah: 'Mudah bergaul',
                bergaul: 'Lebih suka dalam kelompok',
                hub_sekelas: 'Sangat baik',
                bullying: 'Tidak pernah',
                curhat: 'Orang Tua, Sahabat',
                medsos: 'Instagram, TikTok, WhatsApp'
            };

            const dataPribadiJson = JSON.stringify(dataPribadi);

            await run(`
                INSERT INTO students (
                    nama, jenis_kelamin, kelas, nisn, password_hash, 
                    session_id, is_valid, lie_scale_score, consistency_score, is_complete,
                    data_pribadi, ttl, alamat, nama_ortu, pekerjaan_ortu, hobi, cita_cita, no_hp
                ) VALUES (?, ?, ?, ?, ?, ?, 1, 1, 1, 1, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                fullName, jk, kls, nisn, defaultPass,
                session.id, 
                dataPribadiJson,
                'Jakarta, 10-05-2008', 'Jl. Merdeka No 123', dataPribadi.ayah_nama, dataPribadi.ayah_pekerjaan, 'Membaca', 'Dokter', '08123456789'
            ]);
            
            let student = await get("SELECT * FROM students WHERE nisn = ?", [nisn]);

            // Build JSON for nilai_akademik
            const nilaiAkademik = {};
            const mapelPilihanList = kls.includes('IPA') ? ['Biologi', 'Fisika', 'Kimia', 'Matematika Tingkat Lanjut'] 
                                   : kls.includes('IPS') ? ['Sosiologi', 'Ekonomi', 'Geografi', 'Sejarah Tingkat Lanjut'] 
                                   : ['Informatika Tingkat Lanjut', 'Bahasa Inggris Tingkat Lanjut', 'Fisika', 'Sosiologi'];
            
            // Set nama mapel pilihan
            for(let p=1; p<=4; p++) {
                nilaiAkademik[`pil_${p}`] = mapelPilihanList[p-1];
            }

            // Determine max semester based on class
            let maxSemester = 2;
            if (kls.startsWith('XII') || kls.includes('XII')) maxSemester = 6;
            else if (kls.startsWith('XI') || kls.includes('XI')) maxSemester = 4;
            else if (kls.startsWith('X') || kls.includes('X')) maxSemester = 2;

            // Generate nilai untuk Fase E (Semester 1 & 2) -> 10 mapel wajib
            for (let s of [1, 2]) {
                if (s <= maxSemester) {
                    for (let i = 0; i < 10; i++) {
                        nilaiAkademik[`akademik_s${s}_${i}`] = 75 + Math.floor(Math.random() * 20);
                    }
                }
            }

            // Generate nilai untuk Fase F (Semester 3 to 6) -> 9 mapel wajib + 4 pilihan
            for (let s of [3, 4, 5, 6]) {
                if (s <= maxSemester) {
                    for (let i = 0; i < 9; i++) {
                        nilaiAkademik[`akademik_s${s}_w${i}`] = 75 + Math.floor(Math.random() * 20);
                    }
                    for(let p=1; p<=4; p++) {
                        nilaiAkademik[`akademik_s${s}_p${p}`] = 75 + Math.floor(Math.random() * 20);
                    }
                }
            }

            const nilaiAkademikJson = JSON.stringify(nilaiAkademik);

            await run(`UPDATE students SET nilai_akademik = ? WHERE id = ?`, [nilaiAkademikJson, student.id]);

            // Insert Prestasi (30% chance)
            if (Math.random() > 0.7) {
                await run(`
                    INSERT INTO prestasi (student_id, nama_prestasi, tingkat, posisi, tahun, penyelenggara, keterangan)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [student.id, 'Lomba Cerdas Cermat', 'Kabupaten', 'Juara 1', '2023', 'Dinas Pendidikan', '']);
            }

            // Insert Ekskul (80% chance)
            if (Math.random() > 0.2) {
                await run(`
                    INSERT INTO ekskul (student_id, nama_kegiatan, jenis, posisi, tahun, keterangan)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [student.id, 'Pramuka', 'Ekstrakurikuler', 'Anggota', '2023', 'Aktif']);
            }
            
            // Answers (220)
            const questions = await query("SELECT id FROM questions ORDER BY id");
            
            await new Promise((resolve, reject) => {
                db.serialize(() => {
                    db.run("BEGIN TRANSACTION");
                    const stmt = db.prepare("INSERT INTO answers (student_id, question_id, jawaban) VALUES (?, ?, ?)");
                    for (const q of questions) {
                        const jaw = Math.random() > 0.5 ? 'ya' : 'tidak';
                        stmt.run(student.id, q.id, jaw);
                    }
                    stmt.finalize();
                    db.run("COMMIT", async (err) => {
                        if(err) reject(err);
                        else {
                            const { calculateStudentScores } = require('../services/scoring');
                            const scores = await calculateStudentScores(student.id);
                            await run(`
                                UPDATE students 
                                SET lie_scale_score = ?, consistency_score = ?, is_valid = ?
                                WHERE id = ?
                            `, [scores.lie_score, scores.cc_score, scores.is_valid, student.id]);
                            resolve();
                        }
                    });
                });
            });
        }

        console.log('✅ 50 Dummy Students Data Generated Successfully!');
    } catch (e) {
        console.error('Error generating dummy data:', e);
    }
}

seedFullDummyData();
