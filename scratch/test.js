const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('../frontend/admin.html', 'utf8');
const script1 = fs.readFileSync('../frontend/js/utils/api.js', 'utf8');
const script2 = fs.readFileSync('../frontend/js/pages/admin.js', 'utf8');

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on("error", (err) => { console.error("JSDOM Error:", err); });
virtualConsole.on("jsdomError", (err) => { console.error("JSDOM Intern Error:", err); });


const dom = new JSDOM(html, { runScripts: "dangerously", virtualConsole });

// Mock localStorage
dom.window.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

dom.window.eval(script1);
dom.window.eval(script2);
dom.window.eval('AdminApp.init()');

console.log('Finished');
