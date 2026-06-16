const fs = require('fs');

const indexPath = 'C:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM\\frontend\\index.html';
const snippetPath = 'C:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM\\frontend\\akademik_snippet_nested.html';

let html = fs.readFileSync(indexPath, 'utf-8');
const snippetHtml = fs.readFileSync(snippetPath, 'utf-8');

const portoStart = '<div id="porto-content-rapor">';
const portoEnd = '<!-- TAB: PRESTASI -->';

if (html.includes(portoStart) && html.includes(portoEnd)) {
    const p1 = html.indexOf(portoStart) + portoStart.length;
    const p2 = html.indexOf(portoEnd);
    
    html = html.substring(0, p1) + '\n' + snippetHtml + '\n          </div>\n\n          ' + html.substring(p2);
    
    fs.writeFileSync(indexPath, html);
    console.log('Replaced successfully with nested tabs!');
} else {
    console.log('Markers not found!');
}
