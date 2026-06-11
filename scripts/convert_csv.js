const fs = require('fs');
const path = require('path');

function parseCSV(csv) {
    let result = [];
    let row = [];
    let inQuotes = false;
    let field = '';
    for (let i = 0; i < csv.length; i++) {
        let char = csv[i];
        if (inQuotes) {
            if (char === '"') {
                if (csv[i+1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                row.push(field.trim());
                field = '';
            } else if (char === '\n' || char === '\r') {
                if (char === '\r' && csv[i+1] === '\n') i++;
                row.push(field.trim());
                if (row.length > 1) result.push(row); // skip empty rows
                row = [];
                field = '';
            } else {
                field += char;
            }
        }
    }
    if (field !== '' || row.length > 0) {
        row.push(field.trim());
        if (row.length > 1) result.push(row);
    }
    return result;
}

const basePath = path.join(__dirname, '../../SOAL DAN ANALISIS DCM');
const outPath = path.join(__dirname, '../frontend/js/data-analisis.js');

try {
    const bidangCsv = fs.readFileSync(path.join(basePath, 'analisis Bidang.csv'), 'utf8');
    const subBidangCsv = fs.readFileSync(path.join(basePath, 'analisis sub Bidang.csv'), 'utf8');

    const parsedBidang = parseCSV(bidangCsv).slice(1); // skip header
    const parsedSubBidang = parseCSV(subBidangCsv).slice(1); // skip header

    const dataBidang = parsedBidang.map(row => {
        // No,Kategori,Rentang / Skala,Status / Validitas,Deskripsi Analisis,Jumlah Kata,Keterangan
        return {
            kategori: row[1], // Lie Scale, Consistency, Pribadi, Belajar, dll
            rentang: row[2], // 0-4, 5-8, 0% - 12%
            status: row[3],
            deskripsi: row[4]
        };
    });

    const dataSubBidang = parsedSubBidang.map(row => {
        // No,Sub Bidang,Bidang Induk,Rentang,Status,Deskripsi Analisis,Jml Kata
        return {
            sub_bidang: row[1], // Gaya Hidup, Kematangan Emosi, dll
            bidang_induk: row[2],
            rentang: row[3], // 0% - 12%
            status: row[4],
            deskripsi: row[5]
        };
    });

    const outputContent = `// Auto-generated from CSV
const DATA_ANALISIS = {
    bidang: ${JSON.stringify(dataBidang, null, 4)},
    subBidang: ${JSON.stringify(dataSubBidang, null, 4)}
};
`;

    fs.writeFileSync(outPath, outputContent, 'utf8');
    console.log('Successfully generated ' + outPath);
} catch(err) {
    console.error('Error parsing CSVs:', err);
}
