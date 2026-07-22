// Generates /blog/index.html and /blog/<slug>.html from scripts/blog-data-*.js
// Run: node scripts/generate-blog.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');

const articles = [
  ...require('./blog-data-1'),
  ...require('./blog-data-2'),
  ...require('./blog-data-3'),
];

const bySlug = Object.fromEntries(articles.map(a => [a.slug, a]));

const SITE = 'https://indianapolisjunkremoval.org';
const PHONE_DISPLAY = '(317) 537-0940';
const PHONE_TEL = '3175370940';

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

function head({ title, description, canonical, ogTitle, ogDescription, extraSchema }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:title" content="${ogTitle}" />
  <meta property="og:description" content="${ogDescription}" />
  <meta property="og:type" content="article" />
  <meta name="robots" content="index, follow" />
  <meta name="geo.region" content="US-IN" />
  <meta name="geo.placename" content="Indianapolis" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../assets/style.css" />

${extraSchema}
</head>`;
}

function header() {
  return `<header class="site-header">
    <div class="container header-inner">
      <div class="logo">Indianapolis<span>Junk</span> Removal Co</div>
      <div class="header-right">
        <div class="header-phone">Call us: <a href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a></div>
        <a href="../index.html#quote" class="btn btn-primary">Free Quote</a>
        <div class="menu-wrap">
          <button class="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="menuDropdown">&#9776; Menu</button>
          <div class="menu-dropdown" id="menuDropdown" role="menu">
            <a href="../index.html">Home</a>
            <a href="../index.html#services">Services</a>
            <a href="../index.html#areas">Service Areas</a>
            <a href="index.html">Blog</a>
            <a href="../index.html#quote">Get a Quote</a>
          </div>
        </div>
      </div>
    </div>
  </header>`;
}

function footer() {
  const cities = [
    ['Indianapolis', '../index.html'],
    ['Carmel', '../carmel.html'],
    ['Fishers', '../fishers.html'],
    ['Zionsville', '../zionsville.html'],
    ['Westfield', '../westfield.html'],
    ['Noblesville', '../noblesville.html'],
    ['Avon', '../avon.html'],
    ['Greenwood', '../greenwood.html'],
    ['Brownsburg', '../brownsburg.html'],
    ['Plainfield', '../plainfield.html'],
    ['Lawrence', '../lawrence.html'],
    ['Beech Grove', '../beech-grove.html'],
    ['Speedway', '../speedway.html'],
    ['Lebanon', '../lebanon.html'],
  ];
  return `<footer class="site-footer">
    <div class="container">
      <div class="footer-grid">

        <div>
          <div class="footer-brand">Indianapolis<span>Junk</span> Removal Co</div>
          <div class="footer-nap">
            <strong style="color:#ddd;">Indianapolis, Indiana</strong><br>
            Phone: <a href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a><br>
            Email: <a href="mailto:crossroadleads@gmail.com">crossroadleads@gmail.com</a><br>
            Serving Marion County, Hamilton County &amp; surrounding areas<br>
            <br>
            Mon – Fri: 7am – 6pm · Sat: 7am – 6pm · Sun: 8am – 5pm<br>
            <span style="color:#9CA3AF; font-weight:700;">Same-day service available!</span>
          </div>
        </div>

        <div class="footer-col">
          <h4>Resources</h4>
          <ul class="footer-links">
            <li><a href="index.html">Blog</a></li>
            <li><a href="../index.html#services">Services</a></li>
            <li><a href="../index.html#areas">Service Areas</a></li>
            <li><a href="../index.html#quote">Get a Quote</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Service Areas</h4>
          <ul class="footer-links">
            ${cities.map(([name, href]) => `<li><a href="${href}">${name}</a></li>`).join('\n            ')}
          </ul>
        </div>

      </div>
      <div class="footer-bottom" style="color:#ddd;">
        &copy; 2026 Indianapolis Junk Removal Co. All rights reserved.
      </div>
    </div>
  </footer>`;
}

function scripts() {
  return `<script>
  (function(){
    var btn = document.getElementById('menuBtn');
    var drop = document.getElementById('menuDropdown');
    if(!btn) return;
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var open = drop.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function(){
      drop.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
  })();
  </script>`;
}

function relatedCard(slug) {
  const a = bySlug[slug];
  if (!a) return '';
  return `<a href="${a.slug}.html" class="post-card" style="text-decoration:none;">
          <span class="post-category">${a.category}</span>
          <h2 style="font-size:1.05rem;">${a.title}</h2>
          <p>${a.excerpt}</p>
          <div class="post-meta">${formatDate(a.date)} · ${a.readTime}</div>
        </a>`;
}

function articlePage(a) {
  const canonical = `${SITE}/blog/${a.slug}.html`;
  const title = `${a.title} | Indianapolis Junk Removal Co`;

  const articleSchema = `  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": ${JSON.stringify(a.title)},
    "description": ${JSON.stringify(a.metaDescription)},
    "datePublished": "${a.date}",
    "dateModified": "${a.date}",
    "author": { "@type": "Organization", "name": "Indianapolis Junk Removal Co" },
    "publisher": {
      "@type": "Organization",
      "name": "Indianapolis Junk Removal Co",
      "logo": { "@type": "ImageObject", "url": "${SITE}/logo.jpg" }
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": "${canonical}" }
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "${SITE}/" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": "${SITE}/blog/index.html" },
      { "@type": "ListItem", "position": 3, "name": ${JSON.stringify(a.title)}, "item": "${canonical}" }
    ]
  }
  </script>`;

  const relatedHtml = (a.related || []).map(relatedCard).filter(Boolean).join('\n        ');

  return `${head({
    title,
    description: a.metaDescription,
    canonical,
    ogTitle: a.title,
    ogDescription: a.metaDescription,
    extraSchema: articleSchema,
  })}
<body>

  ${header()}

  <nav class="breadcrumb">
    <div class="container">
      <a href="../index.html">Home</a> &rsaquo; <a href="index.html">Blog</a> &rsaquo; <span>${a.title}</span>
    </div>
  </nav>

  <section class="article-header">
    <div class="container">
      <span class="article-category">${a.category}</span>
      <h1>${a.title}</h1>
      <div class="article-meta">
        <span>${formatDate(a.date)}</span>
        <span>${a.readTime}</span>
        <span>Indianapolis Junk Removal Co</span>
      </div>
    </div>
  </section>

  <article class="container article-body">
    ${a.body.trim()}
  </article>

  ${relatedHtml ? `<section class="section related-section">
    <div class="container">
      <h2 class="section-title text-center">Related Articles</h2>
      <div class="related-grid">
        ${relatedHtml}
      </div>
    </div>
  </section>` : ''}

  <section class="cta-banner">
    <div class="container">
      <h2>Ready to Clear the Clutter?</h2>
      <p>Fast, upfront-priced junk removal across Indianapolis and every surrounding suburb. Free quote, same-day service available.</p>
      <div class="cta-actions">
        <a href="tel:${PHONE_TEL}" class="btn btn-white" style="font-size:1.08rem; padding:17px 32px;">Call ${PHONE_DISPLAY}</a>
        <a href="../index.html#quote" class="btn btn-outline">Request Online Quote</a>
      </div>
    </div>
  </section>

  ${footer()}

  ${scripts()}

</body>
</html>
`;
}

function indexPage() {
  const canonical = `${SITE}/blog/index.html`;
  const title = 'Junk Removal Tips & Guides | Indianapolis Junk Removal Co Blog';
  const description = 'Practical, insightful guides on junk removal, decluttering, estate cleanouts, and disposal rules for Indianapolis and the surrounding suburbs.';

  const schema = `  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "${title}",
    "description": ${JSON.stringify(description)},
    "url": "${canonical}"
  }
  </script>`;

  const sorted = [...articles].sort((a, b) => (a.date < b.date ? 1 : -1));

  const cards = sorted.map(a => `<a href="${a.slug}.html" class="post-card" style="text-decoration:none;">
          <span class="post-category">${a.category}</span>
          <h2>${a.title}</h2>
          <p>${a.excerpt}</p>
          <div class="post-meta">${formatDate(a.date)} · ${a.readTime}</div>
        </a>`).join('\n        ');

  return `${head({ title, description, canonical, ogTitle: title, ogDescription: description, extraSchema: schema })}
<body>

  ${header()}

  <nav class="breadcrumb">
    <div class="container">
      <a href="../index.html">Home</a> &rsaquo; <span>Blog</span>
    </div>
  </nav>

  <section class="blog-hero">
    <div class="container">
      <h1>Junk Removal Tips &amp; Local Guides</h1>
      <p>Practical, no-fluff advice on decluttering, disposal rules, and cleanouts for homeowners and businesses across Indianapolis and the surrounding suburbs.</p>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="blog-grid">
        ${cards}
      </div>
    </div>
  </section>

  <section class="cta-banner">
    <div class="container">
      <h2>Have Junk to Get Rid Of?</h2>
      <p>Skip the research and just call. Free quote, upfront pricing, same-day service available across Indianapolis.</p>
      <div class="cta-actions">
        <a href="tel:${PHONE_TEL}" class="btn btn-white" style="font-size:1.08rem; padding:17px 32px;">Call ${PHONE_DISPLAY}</a>
        <a href="../index.html#quote" class="btn btn-outline">Request Online Quote</a>
      </div>
    </div>
  </section>

  ${footer()}

  ${scripts()}

</body>
</html>
`;
}

// ── Run ──
if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });

for (const a of articles) {
  fs.writeFileSync(path.join(BLOG_DIR, `${a.slug}.html`), articlePage(a), 'utf8');
}
fs.writeFileSync(path.join(BLOG_DIR, 'index.html'), indexPage(), 'utf8');

console.log(`Generated ${articles.length} blog posts + blog/index.html`);

// ── sitemap.xml ──
const rootPages = [
  'index.html','avon.html','beech-grove.html','brownsburg.html','carmel.html',
  'fishers.html','greenwood.html','lawrence.html','lebanon.html','noblesville.html',
  'plainfield.html','speedway.html','westfield.html','zionsville.html'
];

const urls = [
  ...rootPages.map(p => ({ loc: `${SITE}/${p === 'index.html' ? '' : p}`, changefreq: 'monthly', priority: p === 'index.html' ? '1.0' : '0.8' })),
  { loc: `${SITE}/blog/index.html`, changefreq: 'weekly', priority: '0.7' },
  ...articles.map(a => ({ loc: `${SITE}/blog/${a.slug}.html`, changefreq: 'monthly', priority: '0.6', lastmod: a.date })),
];

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ''}    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemapXml, 'utf8');
console.log('Generated sitemap.xml');

// ── robots.txt (create if missing) ──
const robotsPath = path.join(ROOT, 'robots.txt');
if (!fs.existsSync(robotsPath)) {
  fs.writeFileSync(robotsPath, `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`, 'utf8');
  console.log('Generated robots.txt');
}
