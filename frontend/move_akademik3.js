const fs = require('fs');

const indexPath = 'C:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM\\frontend\\index.html';
const snippetPath = 'C:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM\\frontend\\akademik_snippet_kelas.html';

let html = fs.readFileSync(indexPath, 'utf-8');
const snippetHtml = fs.readFileSync(snippetPath, 'utf-8');

const portoStart = '<div id="porto-content-rapor">';
const portoEnd = '<!-- TAB: PRESTASI -->';

if (html.includes(portoStart) && html.includes(portoEnd)) {
    const p1 = html.indexOf(portoStart) + portoStart.length;
    const p2 = html.indexOf(portoEnd);
    
    // We intentionally use an actual newline instead of a literal "\\n" string in HTML.
    html = html.substring(0, p1) + '\n' + snippetHtml + '\n          </div>\n\n          ' + html.substring(p2);
    // Let's also remove the literal `\n` that was accidentally left after <div id="porto-content-rapor">
    html = html.replace('<div id="porto-content-rapor">\\n<form', '<div id="porto-content-rapor">\n<form');
    
    fs.writeFileSync(indexPath, html);
    console.log('Replaced successfully!');
} else {
    console.log('Markers not found!');
}
