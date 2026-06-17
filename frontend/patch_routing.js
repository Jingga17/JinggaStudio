const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'js', 'pages', 'admin.js');
let currentJS = fs.readFileSync(filePath, 'utf-8');

// 1. Add title
if (!currentJS.includes("'buku-induk':")) {
    currentJS = currentJS.replace(
        "'data-master':",
        "'buku-induk': '<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"margin-right:6px; vertical-align:-4px;\"><path d=\"M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20\"/></svg> Buku Induk Siswa',\n      'data-master':"
    );
}

// 2. Add to allPages array
if (!currentJS.includes("'buku-induk'")) {
    currentJS = currentJS.replace(
        "const allPages = ['dashboard-global'",
        "const allPages = ['dashboard-global', 'buku-induk'"
    );
}

// 3. Add to initialization block
if (!currentJS.includes("page === 'buku-induk'")) {
    currentJS = currentJS.replace(
        "} else if (page === 'data-master') {",
        "} else if (page === 'buku-induk') {\n      await this.renderBukuIndukList();\n    } else if (page === 'data-master') {"
    );
}

fs.writeFileSync(filePath, currentJS, 'utf-8');
console.log('admin.js routing patched.');
