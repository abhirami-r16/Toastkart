const fs = require('fs');
const path = require('path');

const indexCssPath = path.resolve('d:/shopify/Aug19/latest_code/frontend/src/index.css');
const jewelryCssPath = path.resolve('d:/shopify/Aug19/latest_code/frontend/src/styles/theme-jewelry.css');

let indexCss = fs.readFileSync(indexCssPath, 'utf8');
const lines = indexCss.split('\n');

const startIdx = lines.findIndex(l => l.includes('/* AUREUM Black & Gold Theme Utilities */'));
const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('.home-card-gold:hover {')) + 5; // +5 to include the closing brace

if (startIdx !== -1 && endIdx !== -1) {
  const extractedLines = lines.slice(startIdx, endIdx);
  const newIndexCss = [...lines.slice(0, startIdx), ...lines.slice(endIdx)].join('\n');
  
  fs.writeFileSync(indexCssPath, newIndexCss);
  
  const jewelryCss = fs.readFileSync(jewelryCssPath, 'utf8');
  fs.writeFileSync(jewelryCssPath, jewelryCss + '\n\n' + extractedLines.join('\n'));
  
  console.log('Successfully refactored CSS.');
} else {
  console.log('Could not find CSS blocks to extract.');
}
