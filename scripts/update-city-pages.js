// Applies shared SEO pieces to the hand-maintained pages (index.html + city pages):
//   - favicon / og:image / twitter:image tags in <head>
//   - absolute internal links (href="carmel.html" -> href="/carmel.html")
//   - BreadcrumbList JSON-LD matching the visible breadcrumb (city pages only)
//   - "Helpful Guides" section linking evergreen blog posts (city pages only),
//     with titles/categories pulled from scripts/blog-data-*.js
// Safe to re-run: every step is idempotent. Run: node scripts/update-city-pages.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://indianapolisjunkremoval.org';

const articles = [
  ...require('./blog-data-1'),
  ...require('./blog-data-2'),
  ...require('./blog-data-3'),
];
const bySlug = Object.fromEntries(articles.map(a => [a.slug, a]));

const GUIDE_SLUGS = [
  'how-much-does-junk-removal-cost-in-indianapolis',
  'what-cant-be-thrown-in-trash-marion-county',
  'estate-cleanout-checklist-indianapolis',
];

const CITY_FILES = [
  'avon.html','beech-grove.html','brownsburg.html','carmel.html','fishers.html',
  'greenwood.html','lawrence.html','lebanon.html','noblesville.html','plainfield.html',
  'speedway.html','westfield.html','zionsville.html',
];

const HEAD_TAGS = `  <meta property="og:image" content="${SITE}/assets/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${SITE}/assets/og-image.png" />
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png" />
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
`;

const GUIDES_CSS = `    /* guides:css:start */
    /* ── Helpful Guides ── */
    .guides-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 22px;
      margin-top: 48px;
      text-align: left;
    }
    .guide-card {
      display: flex;
      flex-direction: column;
      border: 1.5px solid #E5E7EB;
      border-radius: 12px;
      padding: 26px 22px;
      background: #fff;
      text-decoration: none;
      transition: box-shadow .25s, transform .25s;
    }
    .guide-card:hover { box-shadow: 0 10px 36px rgba(0,0,0,.09); transform: translateY(-4px); }
    .guide-category {
      align-self: flex-start;
      font-size: .74rem;
      font-weight: 700;
      letter-spacing: .4px;
      text-transform: uppercase;
      color: var(--brand);
      background: var(--light-bg);
      border-radius: 100px;
      padding: 4px 12px;
      margin-bottom: 14px;
    }
    .guide-card h3 { font-size: 1.05rem; font-weight: 700; color: var(--dark); line-height: 1.4; margin-bottom: 8px; }
    .guide-card p  { font-size: .9rem; color: #718096; line-height: 1.65; flex-grow: 1; margin-bottom: 14px; }
    .guide-more { font-size: .88rem; font-weight: 700; color: var(--brand); }
    /* guides:css:end */
`;

function guidesSection(city) {
  const cards = GUIDE_SLUGS.map(slug => {
    const a = bySlug[slug];
    if (!a) throw new Error(`Guide slug not found in blog data: ${slug}`);
    return `        <a class="guide-card" href="/blog/${a.slug}.html">
          <span class="guide-category">${a.category}</span>
          <h3>${a.title}</h3>
          <p>${a.excerpt}</p>
          <span class="guide-more">Read the guide &rarr;</span>
        </a>`;
  }).join('\n');
  return `  <!-- guides:start -->
  <section class="section">
    <div class="container text-center">
      <h2 class="section-title">Helpful Guides</h2>
      <p class="section-sub">Planning a cleanout in ${city}? Start with these.</p>
      <div class="guides-grid">
${cards}
      </div>
    </div>
  </section>
  <!-- guides:end -->

`;
}

function breadcrumbSchema(name, url) {
  return `  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "${SITE}/" },
      { "@type": "ListItem", "position": 2, "name": "${name}", "item": "${url}" }
    ]
  }
  </script>
`;
}

function replaceBlock(html, start, end, block, insertBefore) {
  const re = new RegExp(`[ \\t]*${start}[\\s\\S]*?${end}\\n(\\n)?`);
  if (re.test(html)) return html.replace(re, block);
  if (!html.includes(insertBefore)) throw new Error(`anchor not found: ${insertBefore}`);
  return html.replace(insertBefore, block + insertBefore);
}

function update(file, isCity) {
  const p = path.join(ROOT, file);
  const raw = fs.readFileSync(p, 'utf8');
  const isCRLF = raw.includes('\r\n');
  let html = raw.replace(/\r\n/g, '\n');

  // Head tags
  if (!html.includes('rel="icon"')) {
    html = html.replace(/(  <meta property="og:type"[^\n]*\n)/, `$1${HEAD_TAGS}`);
    if (!html.includes('rel="icon"')) throw new Error(`${file}: og:type anchor not found`);
  }

  // Absolute internal links: page.html, blog/..., assets/...
  html = html.replace(/href="((?:[a-z0-9-]+\.html)|(?:(?:blog|assets)\/[^"]*))"/g, 'href="/$1"');

  if (isCity) {
    const crumb = html.match(/<nav class="breadcrumb">[\s\S]*?<span>([^<]+)<\/span>/);
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
    if (!crumb || !canonical) throw new Error(`${file}: breadcrumb or canonical missing`);
    if (!html.includes('"BreadcrumbList"')) {
      html = html.replace('</head>', breadcrumbSchema(crumb[1], canonical[1]) + '</head>');
    }

    const city = crumb[1].replace(/^Junk Removal in /, '').replace(/, IN$/, '');
    html = replaceBlock(html, '<!-- guides:start -->', '<!-- guides:end -->', guidesSection(city), '  <section class="cta-banner">');
    html = replaceBlock(html, '/\\* guides:css:start \\*/', '/\\* guides:css:end \\*/', GUIDES_CSS, '    /* ── Responsive polish ── */');
  }

  if (isCRLF) html = html.replace(/\n/g, '\r\n');
  if (html !== raw) fs.writeFileSync(p, html, 'utf8');
  return html !== raw;
}

let changed = 0;
if (update('index.html', false)) changed++;
for (const f of CITY_FILES) if (update(f, true)) changed++;
console.log(`Updated ${changed}/${CITY_FILES.length + 1} hand-maintained pages.`);
