let C={};
const esc=t=>String(t??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[m]);
const src=p=>String(p||"").replace(/^\/+/,"");
async function boot(fn){const v="?v="+Date.now();const get=f=>fetch("data/"+f+v).then(r=>r.json());
 const [site,guides,reviews]=await Promise.all([get("site.json"),get("guides.json"),get("reviews.json").catch(()=>[])]);
 C=Object.assign({},site,{guides:(guides||[]).map(g=>Object.assign({},g,{image:src(g.image),topics:g.topics||[]})),reviews:(reviews||[]).filter(r=>r&&r.text)});
 document.querySelectorAll("[data-t]").forEach(el=>{const v=el.dataset.t.split(".").reduce((o,k)=>o&&o[k],C);if(v!=null)el.textContent=v});
 document.querySelectorAll("[data-h]").forEach(el=>{const v=el.dataset.h.split(".").reduce((o,k)=>o&&o[k],C);if(v!=null)el.innerHTML=v});
 document.querySelectorAll("[data-img]").forEach(el=>{const v=el.dataset.img.split(".").reduce((o,k)=>o&&o[k],C);if(v)el.src=src(v)});
 fn();}
const $=s=>document.querySelector(s);
const nis=n=>"₪"+Number(n).toLocaleString("he-IL");
const tag=g=>g.example?'<span class="tag">דוגמה</span>':"";
function header(solid){return `<header class="nav${solid?" solid":""}"><a class="brand" href="index.html">Studio Image<small>PHOTOGRAPHY · GUIDES</small></a><nav><a href="index.html#guides">מדריכים</a><a href="about.html">אודות</a><a href="contact.html">צור קשר</a></nav></header>`}
function footer(){return `<footer><div class="wrap"><div class="fgrid"><div><a class="brand" href="index.html" style="color:var(--paper)">Studio Image<small>PHOTOGRAPHY · GUIDES</small></a><p style="margin-top:1.4rem;max-width:22rem">מדריכי צילום מעשיים מצלם דור שני, מתוך למעלה מעשור של עבודה בשטח.</p></div>
<div><h4>ניווט</h4><a href="index.html#guides">מדריכים</a><a href="about.html">אודות</a><a href="contact.html">צור קשר</a></div>
<div><h4>סטודיו</h4><p>${esc(C.area||"")}</p><a href="mailto:${C.contactEmail}">${C.contactEmail}</a><a href="${C.bookingUrl}" target="_blank" rel="noopener">הזמנת צילום</a></div></div>
<div class="legal"><span>© ${new Date().getFullYear()} Studio Image Photography</span><span>תשלום מאובטח באמצעות PayPal · <a href="admin.html" style="display:inline;color:inherit;font-size:inherit">כניסת מנהל</a></span></div></div></footer>`}
function mount(solid){document.body.insertAdjacentHTML("afterbegin",header(solid));document.body.insertAdjacentHTML("beforeend",footer());
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{threshold:.12});
 document.querySelectorAll(".rv").forEach(el=>io.observe(el));}
function card(g){return `<a class="card rv" href="guide.html?id=${g.id}"><div class="ph"><img src="${g.image}" alt="${g.title}">${tag(g)}</div>
<div class="meta"><h3>${g.title}</h3><span class="price">${nis(g.price)}</span></div><div class="lvl">${g.level||""}</div>${ratingLine(g.id)}<span class="more">לפרטי המדריך ←</span></a>`}
const ppReady=()=>/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(C.paypalEmail||"")&&!/YOUR_|example\.com/i.test(C.paypalEmail);
function paypal(g){const base=location.href.split("?")[0].replace(/[^/]*$/,"");const q=new URLSearchParams({cmd:"_xclick",business:C.paypalEmail,item_name:g.title,item_number:g.id,amount:Number(g.price).toFixed(2),currency_code:C.currency||"ILS",no_shipping:"1",charset:"utf-8",lc:"he_IL","return":base+"thanks.html",cancel_return:base+"guide.html?id="+g.id});return "https://www.paypal.com/cgi-bin/webscr?"+q}
function buyBtn(g){return ppReady()?`<a class="btn fill" href="${paypal(g)}" rel="noopener">לרכישה מאובטחת ב-PayPal</a>`:`<button class="btn fill" type="button" onclick="document.getElementById('ppmsg').hidden=false">לרכישה מאובטחת ב-PayPal</button><div class="ppmsg" id="ppmsg" hidden><b>מערכת התשלומים בהקמה</b>הרכישה באתר תיפתח בקרוב. בינתיים אפשר להזמין את המדריך במייל: <a href="mailto:${C.contactEmail}">${C.contactEmail}</a></div>`}
const STAR='<svg viewBox="0 0 24 24"><path d="M12 2.6l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>';
const stars=r=>(r=Math.max(0,Math.min(5,+r||0)),0)||`<span class="stars" aria-label="${r} מתוך 5">${[1,2,3,4,5].map(i=>`<i class="${i<=Math.round(r)?"on":""}">${STAR}</i>`).join("")}</span>`;
const revsFor=id=>(C.reviews||[]).filter(r=>!id||r.guide===id);
function avg(id){const r=revsFor(id);return r.length?{n:r.length,a:r.reduce((s,x)=>s+(+x.rating||0),0)/r.length}:null}
function ratingLine(id){const a=avg(id);return a?`<div class="rating">${stars(a.a)}<b>${a.a.toFixed(1)}</b><span>(${a.n} ${a.n==1?"ביקורת":"ביקורות"})</span></div>`:`<div class="rating none">טרם דורג</div>`}
function reviewCard(r){const g=C.guides.find(x=>x.id===r.guide);return `<figure class="review rv">${r.example?'<span class="tag">דוגמה</span>':""}${stars(r.rating)}<blockquote>״${esc(r.text)}״</blockquote><figcaption><b>${esc(r.name)}</b>${g?`<span>${g.title}</span>`:""}</figcaption></figure>`}
function reviewsSection(id){const list=revsFor(id);const opts=C.guides.map(g=>`<option value="${g.id}"${g.id===id?" selected":""}>${g.title}</option>`).join("");
return `<section class="block reviews" id="reviews"><div class="wrap"><div class="head rv"><div><div class="eyebrow">ביקורות</div><h2>${id?"מה אומרים על המדריך":"מה אומרים הלומדים"}</h2></div>${id?ratingLine(id):""}</div>
<div class="rgrid">${list.length?`<div class="rlist">${list.map(reviewCard).join("")}</div>`:`<div class="empty rv"><div class="empty-stars">${stars(0)}</div><h3>היו הראשונים לדרג</h3><p>עדיין אין ביקורות${id?" על המדריך הזה":""}. רכשתם מדריך? נשמח לשמוע מה חשבתם.</p></div>`}
<form class="rform rv" id="rform" novalidate><div class="eyebrow">כתבו ביקורת</div><h3>שתפו את החוויה שלכם</h3>
<label>שם<input name="name" required maxlength="60" placeholder="השם שיוצג בביקורת"></label>
<label>מדריך<select name="guide" required>${id?"":'<option value="" disabled selected>בחרו מדריך</option>'}${opts}</select></label>
<div class="lbl">דירוג<div class="starpick" role="radiogroup">${[1,2,3,4,5].map(i=>`<button type="button" data-v="${i}" aria-label="${i} כוכבים">${STAR}</button>`).join("")}</div><input type="hidden" name="rating"></div>
<label>הביקורת שלכם<textarea name="text" required rows="4" maxlength="800" placeholder="מה למדתם? מה אהבתם?"></textarea></label>
<button class="btn fill" type="submit">שליחת ביקורת</button><p class="fmsg" id="fmsg">ביקורות מתפרסמות לאחר אישור.</p></form></div></div></section>`}
function initForm(){const f=document.getElementById("rform");if(!f)return;const btns=[...f.querySelectorAll(".starpick button")],h=f.rating,m=document.getElementById("fmsg");
const paint=v=>btns.forEach(b=>b.classList.toggle("on",+b.dataset.v<=v));
btns.forEach(b=>{b.onmouseenter=()=>paint(+b.dataset.v);b.onclick=()=>{h.value=b.dataset.v;paint(+h.value)}});f.querySelector(".starpick").onmouseleave=()=>paint(+h.value||0);
f.onsubmit=async e=>{e.preventDefault();m.className="fmsg";
 if(!f.name.value.trim()||!f.guide.value||!h.value||!f.text.value.trim()){m.textContent="נא למלא שם, מדריך, דירוג וטקסט.";m.classList.add("err");return}
 if(!C.reviewsEndpoint){m.textContent="מערכת הביקורות עדיין בהקמה. בינתיים אפשר לשלוח את הביקורת במייל: "+C.contactEmail;m.classList.add("err");return}
 try{const r=await fetch(C.reviewsEndpoint,{method:"POST",headers:{Accept:"application/json"},body:new FormData(f)});if(!r.ok)throw 0;
  f.reset();h.value="";paint(0);m.textContent="תודה! הביקורת התקבלה ותפורסם לאחר אישור.";m.classList.add("ok")}
 catch{m.textContent="השליחה נכשלה. נסו שוב או כתבו לנו: "+C.contactEmail;m.classList.add("err")}}}
