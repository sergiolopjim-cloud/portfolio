// Generates sitemap.xml and a real, crawlable index.html at every route.
//
// GitHub Pages serves 404.html with a 404 STATUS, so the client-side routing
// shim alone would leave every deep link invisible to search engines. This
// writes a real page per route instead: 200, with its own metadata already in
// the markup. The client router takes over once JS boots.
//
// Runs as a plain node script (not `node -e`) so there is no shell escaping.

const fs = require('fs');

const HOST = 'https://sergiolopezfoto.com';
const NAME = 'Sergio López';

const LOCATIONS = [
  'mexico-city', 'valle-de-bravo', 'todos-santos', 'playa-del-carmen',
  'santo-domingo', 'puerto-escondido', 'mexico', 'oaxaca', 'malinalco',
  'tepoztlan', 'xochimilco', 'tulum', 'honduras', 'roatan', 'copenhagen',
  'guadalajara', 'monterrey', 'cdmx', 'malmo', 'stockholm',
];

const norm = (c) => (/^architecture/.test(c) || /^interior/.test(c) ? 'architecture-and-interiors' : c);

// Mirrors parseFileName() in index.html.
function parse(fn) {
  const dd = String(fn).split('/').pop().replace(/\.[^.]+$/, '').trim().toLowerCase();
  if (dd.includes('--')) {
    const f = dd.split('--').map((x) => x.trim()).filter(Boolean);
    const c = (f[0] || '').replace(/-?photography$/, '') || f[0];
    if (!c) return null;
    return { category: norm(c), project: (f[2] || '').replace(/[-_]?\d+$/, '') };
  }
  if (dd.includes('_')) {
    const f = dd.split('_').map((x) => x.trim()).filter(Boolean);
    const c = (f[0] || '').replace(/-?photography$/, '') || f[0];
    if (!c) return null;
    const fld = (x) => (x && !/^\d+$/.test(x) ? x : '');
    return { category: norm(c), project: fld(f[2]) };
  }
  const t = dd.split('-').map((x) => x.trim()).filter(Boolean);
  if (t.length < 3) return null;
  const pi = t.indexOf('photography');
  let c, rest;
  if (pi >= 0) { c = t.slice(0, pi).join('-'); rest = t.slice(pi + 1); }
  else { c = t[0]; rest = t.slice(1); }
  if (!c) return null;
  while (rest.length && /^\d+$/.test(rest[rest.length - 1])) rest.pop();
  if (rest[0] === 'otro') rest.shift();
  if (!rest.length) return null;
  const rs = rest.join('-');
  const locs = LOCATIONS.slice().sort((a, b) => b.split('-').length - a.split('-').length);
  let project = rs;
  for (const L of locs) {
    if (rs === L || rs.startsWith(L + '-')) { project = rs.slice(L.length).replace(/^-/, ''); break; }
  }
  return { category: norm(c), project };
}

const words = (v) => (v || '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Mirrors _metaFor() in index.html — served HTML and client state must agree.
function metaFor(seg) {
  if (!seg.length) {
    return { title: NAME + ' — Hotel & Architecture Photographer, Malmö',
      desc: NAME + ' is a hotel and architecture photographer based in Malmö, Sweden, photographing hotels, interiors and buildings across Europe and North America.' };
  }
  if (seg[0] === 'about') {
    return { title: 'About — ' + NAME + ', Hotel & Architecture Photographer',
      desc: NAME + ' is a hotel and architecture photographer based in Malmö, Sweden, working across Europe and North America.' };
  }
  if (seg[0] === 'contact') {
    return { title: 'Contact — ' + NAME + ', Hotel & Architecture Photographer',
      desc: 'Enquiries for hotel, architecture and interiors photography commissions with ' + NAME + ', Malmö.' };
  }
  if (seg[0] === 'video') {
    return { title: 'Video — ' + NAME, desc: 'Motion and film work by ' + NAME + ', hotel and architecture photographer.' };
  }
  if (seg[0] === 'work') {
    return { title: 'Work — ' + NAME + ', Hotel & Architecture Photographer',
      desc: 'Hotel, architecture and interiors photography projects by ' + NAME + ', Malmö, Sweden.' };
  }
  const cat = words(seg[0]);
  if (seg[1]) {
    const proj = words(seg[1]);
    return { title: proj + ' — ' + cat + ' Photography by ' + NAME,
      desc: proj + ', photographed by ' + NAME + ', ' + cat.toLowerCase() + ' photographer based in Malmö, Sweden.' };
  }
  return { title: cat + ' Photography — ' + NAME,
    desc: cat + ' photography by ' + NAME + ', based in Malmö, Sweden, working across Europe and North America.' };
}

// A no-JS fallback body, unique per route. Without it every generated page
// ships byte-identical markup apart from its meta tags, and Google folds them
// together as duplicates of one canonical.
const li = (href, label) => '<li><a href="' + href + '">' + esc(label) + '</a></li>';

function bodyFor(seg, cats) {
  const m = metaFor(seg);
  let links = '';
  if (!seg.length) {
    links = Object.keys(cats).sort().map((k) => li('/' + k + '/', words(k) + ' Photography')).join('')
      + li('/work/', 'Work') + li('/about/', 'About') + li('/contact/', 'Contact');
  } else if (seg.length === 1 && cats[seg[0]]) {
    links = [...cats[seg[0]]].sort().map((p) => li('/' + seg[0] + '/' + p + '/', words(p))).join('');
  } else if (seg.length === 2) {
    links = li('/' + seg[0] + '/', words(seg[0]) + ' Photography');
  }
  return '<noscript id="seo-body"><h1>' + esc(m.title) + '</h1><p>' + esc(m.desc) + '</p>'
    + (links ? '<ul>' + links + '</ul>' : '') + '</noscript>';
}

const SEO_RE = /<noscript id="seo-body">[\s\S]*?<\/noscript>/;

// ---- collect routes from the published manifest ----
const files = JSON.parse(fs.readFileSync('images/manifest.json', 'utf8'));
const cats = {};
files.forEach((f) => {
  if (/(^|\/)slideshow\//.test(f)) return; // presentation only, never a category
  const m = parse(f);
  if (!m || !m.category) return;
  const k = m.category.toLowerCase();
  cats[k] = cats[k] || new Set();
  if (m.project) cats[k].add(m.project);
});

const urls = ['/', '/work/', '/about/', '/contact/', '/video/'];
Object.keys(cats).sort().forEach((k) => {
  urls.push('/' + k + '/');
  [...cats[k]].sort().forEach((p) => urls.push('/' + k + '/' + p + '/'));
});

// ---- sitemap ----
const today = new Date().toISOString().slice(0, 10);
const body = urls.map((u) =>
  '  <url>\n    <loc>' + HOST + u + '</loc>\n    <lastmod>' + today + '</lastmod>\n  </url>').join('\n');
fs.writeFileSync('sitemap.xml',
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + body + '\n</urlset>\n');
console.log('sitemap: ' + urls.length + ' urls');

// ---- route pages ----
// Clear the previous run's folders so renamed or deleted categories don't
// leave orphan pages behind.
try {
  JSON.parse(fs.readFileSync('.routes.json', 'utf8'))
    .forEach((p) => fs.rmSync(p, { recursive: true, force: true }));
} catch (e) {}

const shell = fs.readFileSync('index.html', 'utf8');
const written = [];

urls.forEach((u) => {
  if (u === '/') return; // the root index.html is the source
  const seg = u.split('/').filter(Boolean);
  const m = metaFor(seg);
  const canon = HOST + u;
  const sub = (src, re, val) => src.replace(re, (full, p1) => p1 + '"' + val + '"');
  let out = shell.replace(/<title>[\s\S]*?<\/title>/, '<title>' + esc(m.title) + '</title>');
  out = sub(out, /(<meta name="description" content=)"[^"]*"/, esc(m.desc));
  out = sub(out, /(<meta property="og:title" content=)"[^"]*"/, esc(m.title));
  out = sub(out, /(<meta property="og:description" content=)"[^"]*"/, esc(m.desc));
  out = sub(out, /(<meta property="og:url" content=)"[^"]*"/, canon);
  out = sub(out, /(<meta name="twitter:title" content=)"[^"]*"/, esc(m.title));
  out = sub(out, /(<meta name="twitter:description" content=)"[^"]*"/, esc(m.desc));
  out = sub(out, /(<link rel="canonical" href=)"[^"]*"/, canon);
  out = out.replace(SEO_RE, bodyFor(seg, cats));
  // index.html already carries <base href="/">, so relative refs resolve from
  // the site root at any depth — nothing to rewrite here.
  fs.mkdirSync(u.slice(1, -1), { recursive: true });
  fs.writeFileSync(u.slice(1) + 'index.html', out);
  written.push(seg[0]);
});

fs.writeFileSync('.routes.json', JSON.stringify([...new Set(written)]) + '\n');
console.log('route pages: ' + (urls.length - 1));

// The homepage is served from the source index.html, so patch its fallback
// body in place (idempotent — the block is replaced whole on every run).
fs.writeFileSync('index.html', shell.replace(SEO_RE, bodyFor([], cats)));
