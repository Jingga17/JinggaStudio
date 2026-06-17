const fs = require('fs');

const transcriptPath = "C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\5986ac45-d17f-4ac2-adae-ff8b38a8e49a\\.system_generated\\logs\\transcript.jsonl";

try {
  const content = fs.readFileSync(transcriptPath, 'utf8');
  const lines = content.split('\n');
  let lastReplacement = '';
  for (const line of lines) {
    if (line.includes('switchPemetaanTab(tabId)') && line.includes('replace_file_content')) {
      try {
        const data = JSON.parse(line);
        if (data.tool_calls) {
          for (const call of data.tool_calls) {
            if (call.name === 'replace_file_content') {
              if (call.args && call.args.ReplacementContent) {
                lastReplacement = call.args.ReplacementContent;
              }
            }
          }
        }
      } catch(e) {}
    }
  }
  if (lastReplacement) {
    fs.writeFileSync('scratch/pemetaan_recovered.js', lastReplacement, 'utf8');
    console.log('Recovered successfully!');
  } else {
    console.log('Not found.');
  }
} catch(e) {
  console.error(e);
}
