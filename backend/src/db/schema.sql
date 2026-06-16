CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nama TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_sekolah TEXT,
    alamat TEXT,
    kota TEXT,
    nama_konselor TEXT,
    logo_sekolah TEXT,
    logo_bk TEXT,
    cap_konselor TEXT,
    ttd_konselor TEXT,
    tahun_ajaran TEXT,
    nip TEXT,
    is_assessment_open BOOLEAN DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE NOT NULL,
    name TEXT DEFAULT 'Sesi Default',
    created_by INTEGER,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME,
    FOREIGN KEY(created_by) REFERENCES admins(id)
);

CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    jenis_kelamin TEXT,
    kelas TEXT,
    ttl TEXT,
    nisn TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    alamat TEXT,
    nama_ortu TEXT,
    pekerjaan_ortu TEXT,
    hobi TEXT,
    cita_cita TEXT,
    no_hp TEXT,
    session_id INTEGER,
    is_valid BOOLEAN,
    validation_note TEXT,
    lie_scale_score INTEGER,
    consistency_score INTEGER,
    durasi_pengisian INTEGER,
    is_complete BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES sessions(id),
    UNIQUE(nisn, session_id)
);

CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY,
    teks_soal TEXT NOT NULL,
    tipe_soal TEXT NOT NULL,
    bidang TEXT,
    sub_bidang TEXT,
    arah_jawaban TEXT,
    consistency_pair_id INTEGER
);

CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    jawaban TEXT NOT NULL,
    answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY(question_id) REFERENCES questions(id)
);

CREATE TABLE IF NOT EXISTS descriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    konteks TEXT NOT NULL,
    rentang_min REAL NOT NULL,
    rentang_max REAL NOT NULL,
    kategori TEXT NOT NULL,
    deskripsi TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER,
    aksi TEXT NOT NULL,
    detail TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(admin_id) REFERENCES admins(id)
);
