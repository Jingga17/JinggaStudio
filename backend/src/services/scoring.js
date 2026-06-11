const { query } = require('../db');

async function calculateStudentScores(studentId) {
    // 1. Fetch all questions from the database
    const questions = await query('SELECT * FROM questions');
    
    // 2. Fetch all answers for the student
    const answers = await query('SELECT question_id, jawaban FROM answers WHERE student_id = ?', [studentId]);
    const answersMap = {};
    answers.forEach(a => {
        answersMap[a.question_id] = a.jawaban.toLowerCase();
    });

    // 3. Counters
    let lieScore = 0;
    let ccScore = 0;
    
    const bidangProblems = { Pribadi: 0, Belajar: 0, Sosial: 0, Karir: 0 };
    const bidangTotal = { Pribadi: 0, Belajar: 0, Sosial: 0, Karir: 0 };
    
    const subBidangProblems = {};
    const subBidangTotal = {};

    // 4. Process each question
    const consistencyPairs = {}; // consistency_pair_id -> [answers]

    questions.forEach(q => {
        const ans = answersMap[q.id];
        
        // Handle Lie Scale
        if (q.tipe_soal === 'Lie Scale') {
            if (ans === 'ya') {
                lieScore++;
            }
            return;
        }

        // Handle Consistency Check
        if (q.tipe_soal === 'Consistency Check' && q.consistency_pair_id) {
            if (!consistencyPairs[q.consistency_pair_id]) {
                consistencyPairs[q.consistency_pair_id] = [];
            }
            if (ans) {
                consistencyPairs[q.consistency_pair_id].push(ans);
            }
            return;
        }

        // Handle Core Questions (Problems)
        if (q.tipe_soal === 'Core') {
            const b = q.bidang;
            const sb = q.sub_bidang;
            
            if (b) {
                bidangTotal[b] = (bidangTotal[b] || 0) + 1;
                if (ans) {
                    const isProblem = (q.arah_jawaban === 'Negative' && ans === 'ya') || 
                                      (q.arah_jawaban === 'Positive' && ans === 'tidak');
                    if (isProblem) {
                        bidangProblems[b] = (bidangProblems[b] || 0) + 1;
                    }
                }
            }

            if (sb) {
                subBidangTotal[sb] = (subBidangTotal[sb] || 0) + 1;
                if (!subBidangProblems[sb]) subBidangProblems[sb] = 0;
                if (ans) {
                    const isProblem = (q.arah_jawaban === 'Negative' && ans === 'ya') || 
                                      (q.arah_jawaban === 'Positive' && ans === 'tidak');
                    if (isProblem) {
                        subBidangProblems[sb] = (subBidangProblems[sb] || 0) + 1;
                    }
                }
            }
        }
    });

    // Calculate Consistency Score
    Object.values(consistencyPairs).forEach(pairAnswers => {
        // Inconsistency pair check: if both questions in the pair are answered
        if (pairAnswers.length === 2) {
            // Since all pairs are opposite, same answer means inconsistent
            if (pairAnswers[0] === pairAnswers[1]) {
                ccScore++;
            }
        }
    });

    // Calculate percentages
    const pribadi_pct = bidangTotal.Pribadi > 0 ? Math.round((bidangProblems.Pribadi / bidangTotal.Pribadi) * 100) : 0;
    const belajar_pct = bidangTotal.Belajar > 0 ? Math.round((bidangProblems.Belajar / bidangTotal.Belajar) * 100) : 0;
    const sosial_pct = bidangTotal.Sosial > 0 ? Math.round((bidangProblems.Sosial / bidangTotal.Sosial) * 100) : 0;
    const karir_pct = bidangTotal.Karir > 0 ? Math.round((bidangProblems.Karir / bidangTotal.Karir) * 100) : 0;

    const subBidangPct = {};
    Object.keys(subBidangTotal).forEach(sb => {
        subBidangPct[sb] = Math.round((subBidangProblems[sb] / subBidangTotal[sb]) * 100);
    });

    // Determine status
    let status = 'Valid';
    let isValid = 1;

    if (lieScore > 7 || ccScore >= 5) {
        status = 'Tidak Valid';
        isValid = 0;
    } else if (lieScore > 4 || ccScore >= 3) {
        status = 'Valid dengan Syarat';
        isValid = 1;
    }

    return {
        pribadi_pct,
        belajar_pct,
        sosial_pct,
        karir_pct,
        lie_score: lieScore,
        cc_score: ccScore,
        status,
        is_valid: isValid,
        subBidangPct
    };
}

module.exports = { calculateStudentScores };
