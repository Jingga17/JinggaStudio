const fs = require('fs');
let css = fs.readFileSync('frontend/css/report.css', 'utf8');

const newCss = `
/* Validity Charts UI */
.validity-container {
  display: flex;
  gap: 20px;
  margin-top: 15px;
  margin-bottom: 30px;
  position: relative;
}
.validity-card {
  flex: 1;
  border-radius: 12px;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.validity-card.blue {
  border: 2px solid #3b82f6;
}
.validity-card.green {
  border: 2px solid #10b981;
}
.validity-header {
  color: #fff;
  padding: 8px 15px;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 10px 10px 0 0;
}
.validity-card.blue .validity-header {
  background: #3b82f6;
}
.validity-card.green .validity-header {
  background: #10b981;
}
.validity-body {
  padding: 15px;
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.validity-score-box {
  background: #f0fdf4;
  border: 1px solid #10b981;
  border-radius: 6px;
  padding: 6px 10px;
  text-align: center;
  font-size: 13px;
  display: inline-block;
  margin-bottom: 10px;
  align-self: flex-start;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.validity-card.blue .validity-score-box {
  background: #eff6ff;
  border-color: #bfdbfe;
}
.validity-desc {
  font-size: 11px;
  color: #475569;
  margin-top: auto;
  line-height: 1.4;
}
.validity-bar {
  display: flex;
  height: 12px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 5px;
  margin-top: 10px;
}
.validity-legend {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: #475569;
}
.kesimpulan-badge {
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  background: #f8fafc;
  border: 2px solid #94a3b8;
  border-radius: 10px;
  padding: 10px 15px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.kesimpulan-badge h4 {
  margin: 0;
  font-size: 12px;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 6px;
}
.kesimpulan-badge ul {
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 10px;
  font-weight: 700;
  color: #334155;
  text-transform: uppercase;
}
.kesimpulan-badge ul li {
  display: flex;
  align-items: center;
  gap: 4px;
}
.kesimpulan-badge ul li::before {
  content: "dY""";
  color: #10b981;
}
`;

if (!css.includes('.validity-container')) {
  fs.writeFileSync('frontend/css/report.css', css + '\\n' + newCss);
  console.log('CSS updated');
} else {
  console.log('CSS already has validity classes');
}
