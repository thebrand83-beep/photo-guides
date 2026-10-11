#!/usr/bin/env python3
"""Static SEO build: per-page meta, canonical, JSON-LD, prerendered guide pages, sitemap.
Run from repo root: python3 scripts/build.py  (also runs in GitHub Actions on data changes)."""
import json, re, html, os, glob, datetime
BASE = "https://thebrand83-beep.github.io/photo-guides/"
BRAND = "Studio Image Photography"
site = json.load(open("data/site.json", encoding="utf-8"))
guides = json.load(open("data/guides.json", encoding="utf-8"))
E = lambda s: html.escape(str(s or ""), quote=True)
strip = lambda s: re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", str(s or ""))).strip()
def intl(p):
    d = re.sub(r"\D", "", p or "")
    return "+972" + d[1:] if d.startswith("0") else "+" + d
def nis(n): return "₪" + f"{int(n):,}" if float(n).is_integer() else f"₪{n}"

ORG = {"@type": ["LocalBusiness", "ProfessionalService"], "@id": BASE + "#business", "name": BRAND,
       "url": BASE, "image": BASE + "img/og.jpg", "logo": BASE + "apple-touch-icon.png",
       "telephone": intl(site.get("phone")), "email": site.get("contactEmail"),
       "areaServed": [{"@type": "City", "name": n} for n in ["חיפה", "הקריות", "עכו", "נהריה"]],
       "address": {"@type": "PostalAddress", "addressLocality": "קריית ביאליק", "addressRegion": "חיפה והקריות", "addressCountry": "IL"}}
WEBSITE = {"@type": "WebSite", "@id": BASE + "#website", "url": BASE, "name": BRAND, "inLanguage": "he-IL", "publisher": {"@id": BASE + "#business"}}
def crumbs(*items):
    return {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": BASE + u} for i, (n, u) in enumerate(items)]}

PAGES = {
 "index.html": ("קורס צילום אונליין ומדריכי צילום למתחילים | Studio Image",
   "מדריכי צילום אונליין בעברית: לימוד צילום למתחילים ומתקדמים, פורטרט ועריכה, מצלם דור שני עם למעלה מעשור של ניסיון. לומדים בקצב שלכם.", "", [ORG, WEBSITE]),
 "about.html": ("אודות הצלם | Studio Image Photography, חיפה והקריות",
   "צלם דור שני עם למעלה מעשור של ניסיון בצילום בחיפה, בקריות ובצפון. הסיפור מאחורי מדריכי הצילום של Studio Image.", "about.html", [crumbs(("ראשי", ""), ("אודות", "about.html"))]),
 "contact.html": ("צור קשר | Studio Image Photography, 050-7888160",
   "שאלות על מדריכי הצילום או הזמנת צילום? טלפון, וואטסאפ ומייל של Studio Image Photography. חיפה, הקריות, עכו ונהריה.", "contact.html", [crumbs(("ראשי", ""), ("צור קשר", "contact.html"))]),
 "booking.html": ("קביעת פגישה לצילום אונליין | Studio Image Photography",
   "קביעת פגישה לצילום בסטודיו או בחוץ: בוחרים שירות, תאריך ושעה פנויים, ומקבלים אישור בוואטסאפ. חיפה והקריות.", "booking.html", [crumbs(("ראשי", ""), ("קביעת פגישה", "booking.html"))]),
 "terms.html": ("תקנון ותנאי שימוש | Studio Image Photography", "תקנון האתר: רכישת מדריכי צילום דיגיטליים, תשלום ב-PayPal, מסירה, ביטולים, זכויות יוצרים, קביעת פגישות וביקורות.", "terms.html", [crumbs(("ראשי", ""), ("תקנון", "terms.html"))]),
 "privacy.html": ("מדיניות פרטיות | Studio Image Photography", "איזה מידע נאסף באתר, לאיזו מטרה, עם מי הוא משותף ומה הזכויות שלכם לפי חוק הגנת הפרטיות.", "privacy.html", [crumbs(("ראשי", ""), ("מדיניות פרטיות", "privacy.html"))]),
 "accessibility.html": ("הצהרת נגישות | Studio Image Photography", "הצהרת הנגישות של האתר, ההתאמות שבוצעו ופרטי קשר לפניות בנושא נגישות.", "accessibility.html", [crumbs(("ראשי", ""), ("הצהרת נגישות", "accessibility.html"))]),
 "gallery.html": ("גלריית צילומים: פורטרטים, אירועים ונוף | Studio Image",
   "גלריית עבודות של Studio Image Photography: פורטרטים, חתונות ואירועים וצילומי נוף.", "gallery.html", [crumbs(("ראשי", ""), ("גלריה", "gallery.html"))]),
}
NOINDEX = ["admin.html", "reviews-admin.html", "bookings-admin.html", "thanks.html", "guide.html"]

def set_head(h, title, desc, path, ld, noindex=False, ogtype="website", image=None):
    image = image or BASE + "img/og.jpg"
    url = BASE + path
    h = re.sub(r"<title>.*?</title>", f"<title>{E(title)}</title>", h, count=1, flags=re.S)
    h = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{E(desc)}">', h, count=1)
    for k, v in [("og:title", title), ("og:description", desc), ("og:url", url), ("og:type", ogtype), ("og:image", image)]:
        h = re.sub(rf'<meta property="{k}" content="[^"]*">', f'<meta property="{k}" content="{E(v)}">', h, count=1)
    for k, v in [("twitter:title", title), ("twitter:description", desc), ("twitter:image", image)]:
        h = re.sub(rf'<meta name="{k}" content="[^"]*">', f'<meta name="{k}" content="{E(v)}">', h, count=1)
    h = re.sub(r"\n?<!--seo-->.*?<!--/seo-->", "", h, flags=re.S)
    block = f'<link rel="canonical" href="{E(url)}">'
    if noindex and 'name="robots"' not in h: block += '<meta name="robots" content="noindex">'
    if ld: block += '<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@graph": ld}, ensure_ascii=False) + "</script>"
    return h.replace('<link rel="stylesheet" href="style.css">', f"\n<!--seo-->{block}<!--/seo-->" + '<link rel="stylesheet" href="style.css">', 1)

def card(g):
    tag = '<span class="tag">דוגמה</span>' if g.get("example") else ""
    return (f'<a class="card rv" href="guide-{E(g["id"])}.html"><div class="ph"><img src="{E(g["image"])}" alt="{E(g["title"])}" loading="lazy" decoding="async" width="900" height="1125">{tag}</div>'
            f'<div class="meta"><h3>{E(g["title"])}</h3><span class="price">{nis(g["price"])}<small class="vat">עוסק פטור – לא נגבה מע"מ</small></span></div><div class="lvl">{E(g.get("level"))}</div><span class="more">לפרטי המדריך ←</span></a>')

# 1. per-page meta on static pages
for f, (t, d, p, ld) in PAGES.items():
    h = open(f, encoding="utf-8").read()
    h = set_head(h, t, d, p, ld)
    if f == "index.html":
        h = re.sub(r'<div class="grid" id="g">.*?</div><!--/g-->|<div class="grid" id="g"></div>', '<div class="grid" id="g">' + "".join(card(g) for g in guides) + "</div><!--/g-->", h, count=1, flags=re.S)
    open(f, "w", encoding="utf-8").write(h)
for f in NOINDEX:
    if os.path.exists(f):
        h = open(f, encoding="utf-8").read()
        canon = "index.html" if f != "guide.html" else ""
        h = set_head(h, re.search(r"<title>(.*?)</title>", h, re.S).group(1), re.search(r'<meta name="description" content="([^"]*)"', h).group(1), f, None, noindex=True)
        open(f, "w", encoding="utf-8").write(h)

# 2. prerendered guide pages from guide.html template
tpl = open("guide.html", encoding="utf-8").read()
tpl = re.sub(r"\n?<!--seo-->.*?<!--/seo-->", "", tpl, flags=re.S).replace('<meta name="robots" content="noindex">', "")
for old in glob.glob("guide-*.html"):
    os.remove(old)
for g in guides:
    gid, title = g["id"], g["title"]
    desc = (strip(g.get("short")) or strip(g.get("description")))[:150]
    desc = f"מדריך צילום אונליין: {title}. {desc} מחיר: {nis(g['price'])}."[:160]
    topics = "".join(f'<li><span>{i+1:02d}</span>{E(t)}</li>' for i, t in enumerate(g.get("topics") or []))
    tag = '<span class="tag">דוגמה</span>' if g.get("example") else ""
    body = (f'<div class="ph"><img src="{E(g["image"])}" alt="{E(title)}" width="900" height="1125">{tag}</div><div>'
            f'<nav aria-label="breadcrumb" class="back"><a href="index.html">ראשי</a> / <a href="index.html#guides">מדריכים</a> / {E(title)}</nav>'
            f'<div class="eyebrow" style="margin-top:2.5rem">מדריך · {E(g.get("level"))}</div><h1>{E(title)}</h1>'
            f'<div class="lead">{g.get("description") or ""}</div><h2 class="h4">מה תלמדו</h2><ul>{topics}</ul>'
            f'<div class="buy"><div class="eyebrow" style="margin-bottom:1rem">רכישה חד-פעמית</div><div class="p">{nis(g["price"])}</div><p class="vat-note">עוסק פטור – לא נגבה מע"מ</p>'
            f'<a class="btn fill" href="guide.html?id={E(gid)}">לרכישה מאובטחת ב-PayPal</a></div></div>')
    ld = [{"@type": "Product", "@id": BASE + f"guide-{gid}.html#product", "name": title, "description": strip(g.get("description")) or desc,
           "image": BASE + g["image"], "brand": {"@type": "Brand", "name": BRAND}, "category": "מדריך צילום דיגיטלי",
           "offers": {"@type": "Offer", "price": str(g["price"]), "priceCurrency": site.get("currency", "ILS"),
                      "availability": "https://schema.org/InStock", "url": BASE + f"guide-{gid}.html", "seller": {"@id": BASE + "#business"}}},
          crumbs(("ראשי", ""), ("מדריכים", "index.html#guides"), (title, f"guide-{gid}.html")), ORG]
    h = set_head(tpl, f"{title}: מדריך צילום אונליין | Studio Image", desc, f"guide-{gid}.html", ld, ogtype="product", image=BASE + g["image"])
    h = h.replace('<main class="guide" id="m"></main>', f'<main class="guide" id="m">{body}</main>', 1)
    h = h.replace('new URLSearchParams(location.search).get("id")', f'(new URLSearchParams(location.search).get("id")||"{gid}")', 1)
    open(f"guide-{gid}.html", "w", encoding="utf-8").write(h)

# 3. sitemap + robots
today = datetime.date.today().isoformat()
urls = [""] + [p for p in ["gallery.html", "booking.html", "about.html", "contact.html", "terms.html", "privacy.html", "accessibility.html"]] + [f"guide-{g['id']}.html" for g in guides]
sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(
    f"  <url><loc>{BASE}{u}</loc><lastmod>{today}</lastmod></url>\n" for u in urls) + "</urlset>\n"
old = open("sitemap.xml").read() if os.path.exists("sitemap.xml") else ""
if re.sub(r"<lastmod>.*?</lastmod>", "", old) != re.sub(r"<lastmod>.*?</lastmod>", "", sm):
    open("sitemap.xml", "w").write(sm)
open("robots.txt", "w").write("User-agent: *\nDisallow: /photo-guides/admin.html\nDisallow: /photo-guides/reviews-admin.html\nDisallow: /photo-guides/bookings-admin.html\nDisallow: /photo-guides/thanks.html\n\nSitemap: " + BASE + "sitemap.xml\n")
print("built", len(guides), "guide pages")
