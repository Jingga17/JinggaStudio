const fs = require('fs');

const transcriptPath = "C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\5986ac45-d17f-4ac2-adae-ff8b38a8e49a\\.system_generated\\logs\\transcript.jsonl";

try {
  const content = fs.readFileSync(transcriptPath, 'utf8');
  const lines = content.split('\n');
  let counter = 0;
  for (const line of lines) {
    if (line.includes('replace_file_content') && line.includes('switchPemetaanTab(tabId)')) {
      try {
        const data = JSON.parse(line);
        if (data.tool_calls) {
          for (const call of data.tool_calls) {
            if (call.name === 'replace_file_content') {
              if (call.args && call.args.ReplacementContent) {
                fs.writeFileSync('scratch/pemetaan_code_' + counter + '.js', call.args.ReplacementContent, 'utf8');
                counter++;
              }
            }
          }
        }
      } catch(e) {}
    }
  }
  console.log('Saved ' + counter + ' files.');
} catch(e) {
  console.error(e);
}
