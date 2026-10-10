const C=window.SITE_CONFIG;
const $=s=>document.querySelector(s);
const nis=n=>"₪"+Number(n).toLocaleString("he-IL");
const tag=g=>g.example?'<span class="tag">דוגמה</span>':"";
function header(solid){return `<header class="nav${solid?" solid":""}"><a class="brand" href="index.html">Studio Image<small>PHOTOGRAPHY · GUIDES</small></a><nav><a href="index.html#guides">מדריכים</a><a href="about.html">אודות</a><a href="contact.html">צור קשר</a></nav></header>`}
function footer(){return `<footer><div class="wrap"><div class="fgrid"><div><a class="brand" href="index.html" style="color:var(--paper)">Studio Image<small>PHOTOGRAPHY · GUIDES</small></a><p style="margin-top:1.4rem;max-width:22rem">מדריכי צילום מעשיים מצלם דור שני, מתוך למעלה מעשור של עבודה בשטח.</p></div>
<div><h4>ניווט</h4><a href="index.html#guides">מדריכים</a><a href="about.html">אודות</a><a href="contact.html">צור קשר</a></div>
<div><h4>סטודיו</h4><p>חיפה והקריות</p><a href="mailto:${C.contactEmail}">${C.contactEmail}</a><a href="${C.bookingUrl}" target="_blank" rel="noopener">הזמנת צילום</a></div></div>
<div class="legal"><span>© ${new Date().getFullYear()} Studio Image Photography</span><span>תשלום מאובטח באמצעות PayPal</span></div></div></footer>`}
function mount(solid){document.body.insertAdjacentHTML("afterbegin",header(solid));document.body.insertAdjacentHTML("beforeend",footer());
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{threshold:.12});
 document.querySelectorAll(".rv").forEach(el=>io.observe(el));}
function card(g){return `<a class="card rv" href="guide.html?id=${g.id}"><div class="ph"><img src="${g.image}" alt="${g.title}">${tag(g)}</div>
<div class="meta"><h3>${g.title}</h3><span class="price">${nis(g.price)}</span></div><div class="lvl">${g.level||""}</div><span class="more">לפרטי המדריך ←</span></a>`}
function paypal(g){return "https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business="+encodeURIComponent(C.paypalEmail)+"&item_name="+encodeURIComponent(g.title)+"&item_number="+encodeURIComponent(g.id)+"&amount="+g.price+"&currency_code="+C.currency+"&no_shipping=1"}
