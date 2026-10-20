/* Oside Rentals site script: menu, gallery + lightbox, neighborhood map, tour form */

/* ===== Contact form: paste your Formspree form ID between the quotes (e.g. "xyzabcd") ===== */
const FORMSPREE_ID = "myekaowy";

/* ===== Lead source: remember where a visitor first came from, sent along with the form ===== */
/* Share links like osiderentals.com/?from=instagram to label a source; the tag is removed from the address bar after load. */
const SOURCE=(function(){
  const q=new URLSearchParams(location.search),tag=(q.get('from')||q.get('utm_source')||'').trim().slice(0,40);
  let ref='';try{if(document.referrer){const h=new URL(document.referrer).hostname.replace(/^www\./,'');if(h!==location.hostname.replace(/^www\./,''))ref=h}}catch(e){}
  let s=null;try{s=JSON.parse(localStorage.getItem('leadSource'))}catch(e){}
  if(!s||(tag&&!s.tagged)){
    s={from:tag||ref||'direct (typed, bookmark, or a text/app that hides links)',tagged:!!tag,page:location.pathname,date:new Date().toISOString().slice(0,10)};
    try{localStorage.setItem('leadSource',JSON.stringify(s))}catch(e){}
  }
  if(tag){q.delete('from');q.delete('utm_source');const qs=q.toString();history.replaceState(null,'',location.pathname+(qs?'?'+qs:'')+location.hash)}
  return s;
})();

/* Old #studio / #twobed links -> new pages */
(function(){
  const h=(location.hash||'').slice(1);
  if(document.body.dataset.page==='home'){
    if(h==='studio')location.replace('/homes/unit2');
    else if(h==='twobed')location.replace('/homes/unit1');
  }
})();

/* ===== Photos + lightbox ===== */
(function(){
  const PHOTOS=window.PHOTOS; if(!PHOTOS)return;
  const lb=document.getElementById('lb'),lbImg=document.getElementById('lbImg'),lbCap=document.getElementById('lbCap'),strip=document.getElementById('lbStrip');
  let cur=0,lastFocus=null;
  PHOTOS.forEach(([src,cap],i)=>{
    const t=document.createElement('button');t.type='button';t.setAttribute('aria-label',`Photo ${i+1}: ${cap}`);
    t.innerHTML=`<img src="${src}" alt="" loading="lazy">`;t.addEventListener('click',()=>show(i));strip.appendChild(t);
  });
  document.querySelectorAll('[data-i]').forEach(b=>b.addEventListener('click',()=>openLb(+b.dataset.i)));
  function show(i){
    cur=(i+PHOTOS.length)%PHOTOS.length;const [src,cap]=PHOTOS[cur];
    lbImg.src=src;lbImg.alt=cap;lbCap.innerHTML=`<b>${cur+1} / ${PHOTOS.length}</b>${cap}`;
    [...strip.children].forEach((b,k)=>b.classList.toggle('on',k===cur));
    strip.children[cur].scrollIntoView({block:'nearest',inline:'center'});
    new Image().src=PHOTOS[(cur+1)%PHOTOS.length][0];
  }
  function openLb(i){lastFocus=document.activeElement;lb.hidden=false;document.body.style.overflow='hidden';show(i);document.getElementById('lbClose').focus()}
  function closeLb(){lb.hidden=true;document.body.style.overflow='';lastFocus&&lastFocus.focus()}
  document.getElementById('lbClose').addEventListener('click',closeLb);
  document.getElementById('lbPrev').addEventListener('click',()=>show(cur-1));
  document.getElementById('lbNext').addEventListener('click',()=>show(cur+1));
  document.getElementById('lbStage').addEventListener('click',e=>{if(e.target.id==='lbStage')closeLb()});
  document.addEventListener('keydown',e=>{if(lb.hidden)return;if(e.key==='Escape')closeLb();if(e.key==='ArrowRight')show(cur+1);if(e.key==='ArrowLeft')show(cur-1)});
  let tx=null;
  lbImg.addEventListener('touchstart',e=>{tx=e.touches[0].clientX},{passive:true});
  lbImg.addEventListener('touchend',e=>{if(tx===null)return;const dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>40)show(cur+(dx<0?1:-1));tx=null});
})();

/* ===== Neighborhood map + list ===== */
(function(){
  const mapBox=document.getElementById('mapBox'),groups=document.getElementById('groups'),filters=document.getElementById('filters');
  if(!mapBox||!groups)return;
  const CATS=[
    {k:"surf",t:"Surf & beach",items:[
      {n:"Cassidy Street",d:"Beach stairs at the end of Cassidy. Uncrowded sandbar peaks, best on summer south swells around low-to-mid tide.",w:"10 min walk",x:28.8,y:70.9},
      {n:"Buccaneer Beach",d:"Mellow A-frame that suits beginners, best mid-to-high tide. Lifeguarded, with a park and beachfront café; surf either side of the guard area.",w:"13 min walk",x:14.37,y:47.81},
      {n:"Wisconsin Street",d:"Sand-and-rock beach break, best mid-to-high tide on west or south swell. Usually less crowded than the pier.",w:"1.2 mi · bike",far:"↑"},
      {n:"Oceanside Pier",d:"The most consistent waves in town, with peaks on both sides. North side is mellower; south side is hollower and busy on weekends.",w:"2 mi · bike",far:"↑"}]},
    {k:"coffee",t:"Coffee & breakfast",items:[
      {n:"Revolution Roasters",d:"Coffee roaster and café",w:"3 min walk",x:49.89,y:60.59},
      {n:"Beach Break Café",d:"Breakfast and brunch spot",w:"3 min walk",x:47.81,y:57.3},
      {n:"Rose Cafe",d:"Coffee, pastries, and all-day breakfast and lunch",w:"3 min walk",x:56.57,y:68.03},
      {n:"Bound Coffee Co.",d:"Coffee with house-made sourdough bagels and breakfast burritos",w:"10 min walk",x:71.84,y:92.85},
      {n:"Vigilante Coffee",d:"Roastery and café",w:"13 min walk",x:24.11,y:22.05}]},
    {k:"eat",t:"Restaurants",items:[
      {n:"Freeman Collective",d:"Courtyard of local spots: Tanner's Prime Burgers (Michelin-listed), Corner Pizza, La Corriente (Baja seafood), PopUp Bagels, and Artifex Brewing",w:"5 min walk",x:64.23,y:75.04,id:"freeman"},
      {n:"Wrench & Rodent Seabasstropub",d:"Inventive, zero-waste sushi and seafood",w:"4 min walk",x:46.4,y:62.6},
      {n:"The Plot",d:"Plant-based restaurant with a full bar",w:"5 min walk",x:42.23,y:52.99},
      {n:"The Taco Stand",d:"Counter-service tacos",w:"5 min walk",x:41.63,y:47.52},
      {n:"The Privateer Coal Fire Pizza",d:"Coal-fired pizza, handmade pasta, and wine",w:"6 min walk",x:40.53,y:44.2},
      {n:"Downtown favorites",d:"Valle (Michelin star), Dija Mara (Bib Gourmand), Little Fawn",w:"2 mi · bike",far:"↑"}]},
    {k:"drink",t:"Bars & breweries",items:[
      {n:"Pour House",d:"Neighborhood cocktail bar",w:"4 min walk",x:53.83,y:68.98},
      {n:"Merenda",d:"Wine bar with crudo and small plates",w:"5 min walk",x:58.6,y:77.6},
      {n:"Artifex Brewing",d:"Taproom with a big patio at the Freeman Collective",w:"5 min walk",ref:"freeman"},
      {n:"Hill Street Brewing Co.",d:"Brewery and BBQ at Coast Hwy and Vista Way",w:"6 min walk",x:63.52,y:80.4}]},
    {k:"fit",t:"Fitness studios",items:[
      {n:"Black Sheep Yoga",d:"Flow classes, sound baths, and restorative yoga",w:"3 min walk",x:52.4,y:62.6},
      {n:"CrossFit Counter Culture North",d:"CrossFit and HYROX classes, open gym",w:"3 min walk",x:54.3,y:65.6},
      {n:"VERVE Studios",d:"Indoor cycling, plus strength and yoga rooms",w:"4 min walk",x:57.4,y:70.6},
      {n:"Therapy Social Fitness",d:"Barre, pilates, TRX, dance, and yoga",w:"4 min walk",x:54.7,y:72.6},
      {n:"Coastal Core Pilates",d:"Mat pilates; reformer studio downtown",w:"5 min walk",x:56.2,y:75.2},
      {n:"The Yard Gym",d:"Strength and conditioning classes",w:"5 min walk",x:43.6,y:48.6}]},
    {k:"every",t:"Everyday & getting around",items:[
      {n:"Cream of the Crop",d:"Independent natural-foods market",w:"7 min walk",x:62.64,y:84.67},
      {n:"Buena Vista Lagoon",d:"Nature preserve at the south edge of town",w:"13 min walk",x:88.86,y:94.89},
      {n:"Coast Highway station",d:"SPRINTER light rail to the Oceanside Transit Center and inland",w:"18 min walk",x:10.21,y:8.47},
      {n:"Carlsbad Village",d:"Shops, restaurants, and Carlsbad's beach, just over the lagoon",w:"1.3 mi · bike",far:"↓"},
      {n:"Downtown & the pier",d:"Thursday morning farmers market and Thursday-night Sunset Market",w:"2 mi · bike",far:"↑"},
      {n:"Trader Joe's",d:"On Vista Way",w:"1.7 mi · drive",far:"→"}]}
  ];
  const pins={};let num=0;
  const flash=k=>{const pr=pins[k];if(!pr)return;pr.forEach(e=>e.classList.add('on'));setTimeout(()=>pr.forEach(e=>e.classList.remove('on')),1600)};
  CATS.forEach(cat=>{
    const g=document.createElement('div');g.className='group';g.style.setProperty('--c',`var(--c-${cat.k})`);
    g.innerHTML=`<h3><i></i>${cat.t}</h3>`;const ul=document.createElement('ul');ul.className='places';g.appendChild(ul);groups.appendChild(g);
    cat.items.forEach(p=>{
      const li=document.createElement('li');let badge;
      if(p.ref){const k=p.ref;badge=`<div class="n" style="--c:var(--c-eat)">${pins[k][0].dataset.n}</div>`;li.dataset.pin=k;pins[k].push(li)}
      else if(p.far){badge=`<div class="n far" aria-hidden="true">${p.far}</div>`}
      else{
        num++;const k=p.id||('p'+num);
        const pin=document.createElement('button');pin.type='button';pin.className='pin';pin.textContent=num;pin.dataset.n=num;pin.dataset.cat=cat.k;
        pin.style.cssText=`left:${p.x}%;top:${p.y}%;--c:var(--c-${cat.k})`;pin.setAttribute('aria-label',p.n);pin.title=p.n;mapBox.appendChild(pin);
        badge=`<div class="n">${num}</div>`;li.dataset.pin=k;pins[k]=[pin,li];
        pin.addEventListener('mouseenter',()=>pins[k].forEach(e=>e.classList.add('on')));
        pin.addEventListener('mouseleave',()=>pins[k].forEach(e=>e.classList.remove('on')));
        pin.addEventListener('click',()=>{flash(k)});
      }
      li.innerHTML=`${badge}<div><strong>${p.n}</strong><span>${p.d}</span></div><em>${p.w}</em>`;
      if(li.dataset.pin){const k=li.dataset.pin;
        li.addEventListener('mouseenter',()=>pins[k][0].classList.add('on'));li.addEventListener('mouseleave',()=>pins[k][0].classList.remove('on'));
        li.addEventListener('click',()=>{if(window.innerWidth<900)mapBox.scrollIntoView({behavior:'smooth',block:'center'});flash(k)})}
      ul.appendChild(li);
    });
  });
  const groupEls=[...groups.children];
  function setFilter(k){
    [...filters.children].forEach(b=>{const on=b.dataset.k===k;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1});
    mapBox.querySelectorAll('.pin[data-cat]').forEach(p=>p.classList.toggle('off',p.dataset.cat!==k));
    groupEls.forEach((g,n)=>{g.hidden=CATS[n].k!==k});
  }
  CATS.forEach(c=>{
    const b=document.createElement('button');b.type='button';b.className='tab';b.dataset.k=c.k;b.setAttribute('role','tab');
    b.style.setProperty('--c',`var(--c-${c.k})`);b.innerHTML=`<i></i>${c.t}`;b.addEventListener('click',()=>setFilter(c.k));filters.appendChild(b);
  });
  filters.addEventListener('keydown',e=>{if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;const ts=[...filters.children];const k=ts.findIndex(t=>t.getAttribute('aria-selected')==='true');const n=ts[(k+(e.key==='ArrowRight'?1:-1)+ts.length)%ts.length];n.focus();setFilter(n.dataset.k)});
  setFilter(CATS[0].k);
})();

/* ===== Tour request form (Formspree) ===== */
(function(){
  const form=document.getElementById('tourForm');if(!form)return;
  const status=document.getElementById('formStatus'),btn=form.querySelector('button[type=submit]');
  const say=(msg,ok)=>{status.hidden=false;status.className='form-status '+(ok?'ok':'err');status.textContent=msg};
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!form.reportValidity())return;
    if(!FORMSPREE_ID){say("Online messages aren't set up yet. Please call, text, or email using the contact details on this page.",false);return}
    btn.disabled=true;const label=btn.textContent;btn.textContent='Sending…';
    try{
      const fd=new FormData(form);
      fd.append('Came from',SOURCE.from);fd.append('First page',SOURCE.page);fd.append('First visit',SOURCE.date);fd.append('Sent from',location.pathname);
      const r=await fetch('https://formspree.io/f/'+FORMSPREE_ID,{method:'POST',body:fd,headers:{Accept:'application/json'}});
      if(r.ok){form.reset();say("Thanks, your message was sent. We'll get back to you soon.",true)}
      else say('Something went wrong sending your message. Please try again, or text or email us directly.',false);
    }catch(err){say('Your message could not be sent. Check your connection and try again, or text or email us directly.',false)}
    btn.disabled=false;btn.textContent=label;
  });
})();
