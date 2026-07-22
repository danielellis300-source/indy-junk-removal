// Adds a "Blog" link to the header dropdown and footer Services list
// on index.html and all city landing pages.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const files = [
  'index.html','avon.html','beech-grove.html','brownsburg.html','carmel.html',
  'fishers.html','greenwood.html','lawrence.html','lebanon.html','noblesville.html',
  'plainfield.html','speedway.html','westfield.html','zionsville.html'
];

const dropdownFind = `            <a href="#areas">Service Areas</a>\n            <a href="#quote">Get a Quote</a>`;
const dropdownReplace = `            <a href="#areas">Service Areas</a>\n            <a href="blog/index.html">Blog</a>\n            <a href="#quote">Get a Quote</a>`;

const footerFind = `          <h4>Services</h4>\n          <ul class="footer-links">\n            <li><a href="#services">Furniture Removal</a></li>`;
const footerReplace = `          <h4>Services</h4>\n          <ul class="footer-links">\n            <li><a href="blog/index.html">Blog</a></li>\n            <li><a href="#services">Furniture Removal</a></li>`;

let changed = 0;
for (const file of files) {
  const p = path.join(ROOT, file);
  const raw = fs.readFileSync(p, 'utf8');
  const isCRLF = raw.includes('\r\n');
  let html = raw.replace(/\r\n/g, '\n'); // normalize
  let updated = html;

  if (updated.includes(dropdownFind)) {
    updated = updated.replace(dropdownFind, dropdownReplace);
  } else {
    console.warn(`WARN: dropdown pattern not found in ${file}`);
  }

  if (updated.includes(footerFind)) {
    updated = updated.replace(footerFind, footerReplace);
  } else {
    console.warn(`WARN: footer pattern not found in ${file}`);
  }

  if (updated !== html) {
    if (isCRLF) updated = updated.replace(/\n/g, '\r\n');
    fs.writeFileSync(p, updated, 'utf8');
    changed++;
  }
}
console.log(`Updated ${changed}/${files.length} files with Blog nav link.`);
