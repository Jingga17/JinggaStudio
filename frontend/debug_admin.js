const fs = require('fs');
const vm = require('vm');

const context = {
  window: {},
  document: { addEventListener: () => {}, getElementById: () => null, querySelectorAll: () => [] },
  console: console,
  localStorage: { getItem: () => null, setItem: () => {} },
  _: () => ({ style: {}, classList: { toggle: () => {}, remove: () => {}, contains: () => false }, addEventListener: () => {}, focus: () => {} }),
  Toast: { error: console.error, success: console.log, info: console.log },
  Modal: { confirm: () => Promise.resolve(true), hide: () => {} },
  API: { login: () => Promise.resolve({ token: '123', user: { nama: 'Test' } }), logout: () => Promise.resolve() },
  Storage: { getAdminToken: () => '123', getAdminUser: () => ({ nama: 'Test' }), saveAdminToken: () => {}, saveAdminUser: () => {}, clearAdminToken: () => {} },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  Promise: Promise,
  Array: Array,
  Object: Object,
  String: String,
  Number: Number,
  Boolean: Boolean
};
context.window = context;

const vmContext = vm.createContext(context);

try {
  const code = fs.readFileSync('js/pages/admin.js', 'utf8');
  console.log('Parsing admin.js...');
  const script = new vm.Script(code);
  console.log('Running admin.js...');
  script.runInContext(vmContext);
  console.log('AdminApp is:', typeof vmContext.AdminApp);
  if (vmContext.AdminApp) {
    console.log('AdminApp keys:', Object.keys(vmContext.AdminApp).join(', '));
  }
} catch(e) {
  console.error('ERROR RUNNING ADMIN.JS:', e.stack);
}
