const express = require('express');
const router = express.Router();
const { run, query } = require('../db');

// Submit final answers (POST to /)
router.post('/', async (req, res, next) => {
    try {
        const { student_id, answers, is_final } = req.body;
        
        if (answers && answers.length > 0) {
            const qIds = answers.map(a => a.qId);
            await run(`DELETE FROM answers WHERE student_id = ? AND question_id IN (${qIds.map(() => '?').join(',')})`, [student_id, ...qIds]);
            
            for (const a of answers) {
                await run('INSERT INTO answers (student_id, question_id, jawaban) VALUES (?, ?, ?)', [student_id, a.qId, a.answer]);
            }
        }

        if (is_final) {
            await run('UPDATE students SET is_complete = 1, durasi_pengisian = ? WHERE id = ?', [req.body.duration || 0, student_id]);
        }

        res.json({ status: 'success', message: 'Jawaban disimpan' });
    } catch (err) { next(err); }
});

// Submit partial answers (POST to /partial)
router.post('/partial', async (req, res, next) => {
    try {
        const { student_id, halaman, answers } = req.body; // answers is an object of { [qId]: 'ya'|'tidak' }
        
        if (answers && typeof answers === 'object') {
            const qIds = Object.keys(answers).map(Number);
            if (qIds.length > 0) {
                // Delete existing matching answers
                await run(`DELETE FROM answers WHERE student_id = ? AND question_id IN (${qIds.map(() => '?').join(',')})`, [student_id, ...qIds]);
                
                // Insert new ones
                for (const [qId, ans] of Object.entries(answers)) {
                    if (ans) {
                        await run('INSERT INTO answers (student_id, question_id, jawaban) VALUES (?, ?, ?)', [student_id, Number(qId), ans]);
                    }
                }
            }
        }
        res.json({ status: 'success', message: 'Jawaban parsial disimpan' });
    } catch (err) { next(err); }
});

module.exports = router;
