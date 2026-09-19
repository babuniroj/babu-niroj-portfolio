import fs from 'fs';import path from 'path';import {minify} from 'html-minifier-terser';import CleanCSS from 'clean-css';import JavaScriptObfuscator from 'javascript-obfuscator';
const root=process.cwd(),out=path.join(root,'dist');
const siteUrl=String(process.env.SITE_URL||'').trim().replace(/\/$/,'');
const absoluteUrl=p=>siteUrl?`${siteUrl}/${String(p).replace(/^\//,'')}`:'';fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(path.join(out,'assets/css'),{recursive:true});fs.mkdirSync(path.join(out,'assets/js'),{recursive:true});fs.cpSync(path.join(root,'assets/images'),path.join(out,'assets/images'),{recursive:true});
const minHtml=async s=>minify(s,{collapseWhitespace:true,removeComments:true,removeRedundantAttributes:true,minifyCSS:true,minifyJS:true});
// HTML is written after article data is loaded so the homepage can receive the latest-post feed.

for(const name of ['style.css','lekh.css']){const src=path.join(root,'assets/css',name);if(fs.existsSync(src)){const css=new CleanCSS({level:2}).minify(fs.readFileSync(src,'utf8')).styles;fs.writeFileSync(path.join(out,'assets/css',name),css)}}
for(const name of ['main.js','lekh.js']){const src=path.join(root,'assets/js',name);if(fs.existsSync(src)){const js=fs.readFileSync(src,'utf8');const ob=JavaScriptObfuscator.obfuscate(js,{compact:true,controlFlowFlattening:true,deadCodeInjection:true,stringArray:true,stringArrayEncoding:['base64'],selfDefending:true}).getObfuscatedCode();fs.writeFileSync(path.join(out,'assets/js',name),ob)}}
if(fs.existsSync(path.join(root,'assets/favicon.svg')))fs.copyFileSync(path.join(root,'assets/favicon.svg'),path.join(out,'assets/favicon.svg'));
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const npDigits=s=>String(s).replace(/\d/g,d=>'०१२३४५६७८९'[d]);
const dateLabel=d=>{if(!d)return'';const x=new Date(`${d}T00:00:00`);if(Number.isNaN(x.getTime()))return d;return npDigits(x.toLocaleDateString('en-CA',{year:'numeric',month:'short',day:'numeric'}))};

const escAttr=s=>esc(s).replace(/'/g,'&#39;');
const postsDir=path.join(root,'content/posts'),postBySlug=new Map();
if(fs.existsSync(postsDir)){for(const file of fs.readdirSync(postsDir).filter(f=>f.endsWith('.json'))){try{const p=JSON.parse(fs.readFileSync(path.join(postsDir,file),'utf8'));if(p.published===true&&p.title&&p.slug){const previous=postBySlug.get(p.slug);if(!previous||String(p.date||'')>=String(previous.date||''))postBySlug.set(p.slug,p)}}catch(e){console.warn(`Skipping invalid post ${file}: ${e.message}`)}}}
const published=[...postBySlug.values()];
published.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));

// Keep the existing homepage design, but replace only the five placeholder article rows
// with the five newest published Pages CMS posts.
const latestArticleRows=published.slice(0,5).map((p,i)=>{
  const cover=String(p.cover||'').replace(/^\//,'');
  const thumb=cover
    ? `<span class="thumb" style="background-image:url('${escAttr(cover)}');background-size:cover;background-position:center"></span>`
    : `<span class="thumb t${(i%5)+1}"></span>`;
  const meta=[dateLabel(p.date),p.category||''].filter(Boolean).join(' · ')||'नयाँ लेख';
  return `<article role="link" tabindex="0" aria-label="${escAttr(p.title)}" style="cursor:pointer" onclick="location.href='lekh/${escAttr(p.slug)}.html'" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();location.href='lekh/${escAttr(p.slug)}.html'}">${thumb}<div><b>${esc(p.title)}</b><small>${esc(meta)}</small></div></article>`;
}).join('');

let homeHtml=fs.readFileSync(path.join(root,'index.html'),'utf8');
if(latestArticleRows){
  homeHtml=homeHtml.replace(/(<section class="card articles" id="articles">[\s\S]*?<div class="article-list">)[\s\S]*?(<\/div><\/section>)/,
    `$1${latestArticleRows}$2`);
}
fs.writeFileSync(path.join(out,'index.html'),await minHtml(homeHtml));
const lekhSrc=path.join(root,'lekh.html');
if(fs.existsSync(lekhSrc)){
  let lekhHtml=fs.readFileSync(lekhSrc,'utf8');
  const cards=published.map(p=>{const cover=String(p.cover||'').replace(/^\//,'');const img=cover?`<img class="lekh-cover" src="${escAttr(cover)}" alt="${escAttr(p.title)}" loading="lazy">`:'<span class="lekh-cover"></span>';const search=escAttr(`${p.title} ${p.excerpt||''} ${p.category||''} ${(p.tags||[]).join(' ')}`.toLowerCase());return `<article class="lekh-card" data-search="${search}">${img}<div class="lekh-card-body"><div class="lekh-meta"><span class="lekh-category">${esc(p.category||'लेख')}</span><span>•</span><time>${esc(dateLabel(p.date))}</time></div><a class="lekh-card-link" href="lekh/${escAttr(p.slug)}.html"><h2>${esc(p.title)}</h2></a><p>${esc(p.excerpt||'')}</p><a class="lekh-read" href="lekh/${escAttr(p.slug)}.html">पूरा लेख पढ्नुहोस् →</a></div></article>`}).join('');
  const listing=cards||'<div class="lekh-empty">अहिले प्रकाशित लेख भेटिएन।</div>';
  lekhHtml=lekhHtml.replace(/(<section id="articleGrid" class="lekh-grid" aria-live="polite">)[\s\S]*?(<\/section>)/,`$1${listing}<div id="searchEmpty" class="lekh-empty" hidden>खोजीसँग मिल्ने लेख भेटिएन।</div>$2`);
  lekhHtml=lekhHtml.replace('<span id="articleCount">लेखहरू लोड हुँदैछन्…</span>',`<span id="articleCount">${npDigits(published.length)} लेख</span>`);
  fs.writeFileSync(path.join(out,'lekh.html'),await minHtml(lekhHtml));
}
fs.mkdirSync(path.join(out,'data'),{recursive:true});fs.writeFileSync(path.join(out,'data/articles.json'),JSON.stringify(published.map(p=>({title:p.title,slug:p.slug,date:p.date,dateLabel:dateLabel(p.date),category:p.category||'',excerpt:p.excerpt||'',cover:p.cover||'',tags:p.tags||[],url:`lekh/${p.slug}.html`})),null,2));
const articleDir=path.join(out,'lekh');fs.mkdirSync(articleDir,{recursive:true});
for(const p of published){
  const seoTitle=p.seo_title||`${p.title} | बाबु निरोज`,seoDesc=p.seo_description||p.excerpt||'';
  const tags=(p.tags||[]).map(t=>`<span>${esc(t)}</span>`).join('');
  const cover=p.cover?`<img class="article-cover" src="../${esc(String(p.cover).replace(/^\//,''))}" alt="${esc(p.title)}">`:'';
  const jsonLd=JSON.stringify({'@context':'https://schema.org','@type':'Article',headline:p.title,datePublished:p.date||undefined,author:{'@type':'Person',name:'बाबु निरोज'},description:seoDesc,image:p.cover?(absoluteUrl(String(p.cover).replace(/^\//,''))||p.cover):undefined,mainEntityOfPage:siteUrl?absoluteUrl(`lekh/${p.slug}.html`):undefined});
  const html=`<!doctype html><html lang="ne"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(seoTitle)}</title><meta name="description" content="${esc(seoDesc)}"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="theme-color" content="#087f7d">${siteUrl?`<link rel="canonical" href="${escAttr(absoluteUrl(`lekh/${p.slug}.html`))}">`:''}<meta property="og:type" content="article">${siteUrl?`<meta property="og:url" content="${escAttr(absoluteUrl(`lekh/${p.slug}.html`))}">`:''}<meta property="og:title" content="${esc(seoTitle)}"><meta property="og:description" content="${esc(seoDesc)}">${p.cover?`<meta property="og:image" content="${escAttr(absoluteUrl(String(p.cover).replace(/^\//,''))||`../${String(p.cover).replace(/^\//,'')}`)}">`:''}<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="../assets/css/style.css"><link rel="stylesheet" href="../assets/css/lekh.css"><script type="application/ld+json">${jsonLd}</script></head><body><header class="header article-site-header"><a class="brand" href="../index.html#home"><span aria-hidden="true" class="survey-logo"><svg role="img" viewBox="0 0 72 72"><path d="M12 58h48"></path><path d="M36 13v11"></path><path d="M27 25h18l5 12H22z"></path><circle cx="36" cy="31" r="4"></circle><path d="M31 37 20 58M41 37l11 21M36 37v21"></path><path d="M8 58 20 43l8 8 9-12 10 11 7-8 10 16"></path></svg></span><span class="brand-words"><strong>बाबु निरोज</strong><small>Surveyor</small></span></a><button aria-expanded="false" aria-label="मेनु" class="menu">☰</button><nav><a href="../index.html#home">गृह</a><a href="../index.html#about">मेरो बारेमा</a><a href="../index.html#experience">अनुभव</a><a href="../index.html#skills">विशेषज्ञता</a><a href="../index.html#work">काम परियोजना</a><a class="active" href="../lekh.html">लेख</a><a href="../index.html#gallery">फोटो ग्यालरी</a><a href="../index.html#contact">सम्पर्क</a></nav><a class="contact-pill" href="../index.html#contact">सम्पर्क गर्नुहोस्</a></header><main class="lekh-main article-page"><nav class="article-breadcrumb" aria-label="Breadcrumb"><a href="../index.html">गृहपृष्ठ</a><span>›</span><a href="../lekh.html">लेख</a><span>›</span><span aria-current="page">${esc(p.title)}</span></nav><article class="article-reader"><header class="article-head"><span class="lekh-kicker">${esc(p.category||'लेख')}</span><h1>${esc(p.title)}</h1><div class="lekh-meta"><time>${esc(dateLabel(p.date))}</time><span>·</span><span>बाबु निरोज</span></div><p class="article-excerpt">${esc(p.excerpt||'')}</p></header>${cover}<div class="article-body">${p.body||''}</div>${tags?`<div class="article-tags">${tags}</div>`:''}<div class="article-reader-footer"><span class="article-author">लेखक · बाबु निरोज</span><a href="../lekh.html">अन्य लेखहरू हेर्नुहोस् →</a></div></article></main><script src="../assets/js/lekh.js" defer></script></body></html>`;
  fs.writeFileSync(path.join(articleDir,`${p.slug}.html`),await minHtml(html));
}
const robots=`User-agent: *\nAllow: /\n${siteUrl?`Sitemap: ${siteUrl}/sitemap.xml\n`:''}`;fs.writeFileSync(path.join(out,'robots.txt'),robots);
if(siteUrl){const urls=[{loc:`${siteUrl}/`,lastmod:''},{loc:`${siteUrl}/lekh.html`,lastmod:''},...published.map(p=>({loc:absoluteUrl(`lekh/${p.slug}.html`),lastmod:p.date||''}))];const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`  <url><loc>${esc(u.loc)}</loc>${u.lastmod?`<lastmod>${esc(u.lastmod)}</lastmod>`:''}</url>`).join('\n')}\n</urlset>\n`;fs.writeFileSync(path.join(out,'sitemap.xml'),sitemap)}else{console.warn('SITE_URL is not set; sitemap.xml and canonical URLs were skipped. Set SITE_URL to the final production origin.')}
console.log(`Production build created in dist/ (${published.length} published article(s))`);
