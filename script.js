(function(){
const C = CONTENU, $ = id => document.getElementById(id);
const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ini = (C.prenom1[0] + C.prenom2[0]).toUpperCase();
document.title = `${C.prenom1} & ${C.prenom2} — Notre mariage`;

/* Remplissage des textes */
$('cachet').textContent = ini;
$('cNoms').textContent = `${C.prenom1} & ${C.prenom2}`;
$('cDate').textContent = C.dateTexte.toUpperCase();
$('n1').textContent = C.prenom1; $('n2').textContent = C.prenom2;
$('accueil').textContent = C.accueil;
$('dateH').textContent = C.dateTexte;
$('hero').style.setProperty('--photo', `url("${C.photoAccueil}")`);
$('frise').insertAdjacentHTML('beforeend', C.histoire.map(e =>
  `<div class="etape rev"><span class="petit">${e.date}</span><h3>${e.titre}</h3><p>${e.texte}</p></div>`).join(''));
$('galerieBox').innerHTML = C.photos.map((p,i) =>
  `<figure class="rev" data-v="${(0.08 + (i%3)*0.03).toFixed(2)}"><img src="${p}" alt="Photo ${i+1}" loading="lazy" decoding="async"></figure>`).join('');
$('prog').innerHTML = C.programme.map(m =>
  `<li class="rev"><span class="h">${m.h}</span><div><h3>${m.t}</h3><p>${m.d}</p></div></li>`).join('');
const lieu = `${C.salle}, ${C.adresse}, ${C.ville}`;
$('lSalle').textContent = C.salle; $('lAdr').textContent = `${C.adresse}, ${C.ville}`;
$('map').src = `https://www.google.com/maps?q=${encodeURIComponent(lieu)}&output=embed`;
$('itin').href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lieu)}`;
$('tTexte').textContent = C.tenue;
$('pastilles').innerHTML = C.pastilles.map(p => `<div class="pastille"><i style="background:${p.c}"></i>${p.nom}</div>`).join('');
$('limite').textContent = C.dateLimite; $('conf').textContent = C.confidentialite || '';
const cotes = C.cotes.map(t => t.replace('{1}', C.prenom1).replace('{2}', C.prenom2));
$('cote').innerHTML = '<option value="">Choisir…</option>' + cotes.map((t,i) => `<option value="${i}">${t}</option>`).join('');
$('init').textContent = `${C.prenom1[0]} & ${C.prenom2[0]}`; $('hash').textContent = C.hashtag;

/* Titres mot par mot */
document.querySelectorAll('.mots, .mots-p').forEach(el => {
  el.classList.add('mots');
  el.innerHTML = el.textContent.split(' ').map((w,i) => `<span class="m" style="--i:${i}">${w}</span>`).join(' ');
});

/* Compte à rebours */
const cible = new Date(C.dateISO).getTime();
function tic(){
  let d = Math.max(0, cible - Date.now()), s = Math.floor(d/1000);
  $('cj').textContent = Math.floor(s/86400);
  $('ch').textContent = String(Math.floor(s%86400/3600)).padStart(2,'0');
  $('cm').textContent = String(Math.floor(s%3600/60)).padStart(2,'0');
  $('cs').textContent = String(s%60).padStart(2,'0');
}
tic(); setInterval(tic, 1000);

/* Apparition au défilement */
function lancerReveal(){
  const io = new IntersectionObserver(es => es.forEach(e => {
    if(e.isIntersecting){ e.target.classList.add('vu'); io.unobserve(e.target); }
  }), {threshold:.18, rootMargin:'0px 0px -6% 0px'});
  document.querySelectorAll('.rev, .mots').forEach(el => io.observe(el));
}

/* Frise qui se dessine + profondeur de la galerie */
const frise = $('frise'), figs = [...document.querySelectorAll('.galerie figure')];
let tick = false;
function maj(){
  tick = false;
  const vh = innerHeight, r = frise.getBoundingClientRect();
  frise.style.setProperty('--p', Math.min(1, Math.max(0, (vh*.75 - r.top)/r.height)));
  if(calme) return;
  figs.forEach(f => {
    const b = f.getBoundingClientRect();
    if(b.bottom < -50 || b.top > vh + 50) return;
    const d = b.top + b.height/2 - vh/2;
    f.firstChild.style.transform = `translate3d(0,${(-d*f.dataset.v).toFixed(1)}px,0) scale(1.2)`;
  });
}
addEventListener('scroll', () => { if(!tick){ tick = true; requestAnimationFrame(maj); } }, {passive:true});
addEventListener('resize', maj);

/* Affichage du site */
function afficherSite(){
  document.body.classList.remove('fige'); scrollTo(0,0);
  document.querySelectorAll('.hero .rev').forEach(el => el.classList.add('vu'));
  lancerReveal(); maj();
}

/* Codage du code QR (adresse du site + informations de l’invité) */
const encode = o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const decode = s => { s = s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length % 4) s += '='; return JSON.parse(decodeURIComponent(escape(atob(s)))); };

/* Base de données Firestore (API REST, sans bibliothèque) */
const FB = C.firebase || {};
const base = FB.projectId && FB.apiKey ? `https://firestore.googleapis.com/v1/projects/${FB.projectId}/databases/(default)/documents/invites` : '';
const idNouveau = () => [...crypto.getRandomValues(new Uint8Array(12))].map(b => b.toString(16).padStart(2,'0')).join('');
const S = v => ({stringValue:String(v)}), I = v => ({integerValue:String(v)});
async function enregistrer(id, d){
  const r = await fetch(`${base}?documentId=${id}&key=${FB.apiKey}`, {method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({fields:{n:S(d.n), p:S(d.p), t:S(d.t), c:I(d.c), o:I(d.o), cote:S(cotes[d.c]), date:{timestampValue:new Date().toISOString()}}})});
  if(!r.ok) throw new Error('db');
}
async function lire(id){
  const r = await fetch(`${base}/${encodeURIComponent(id)}?key=${FB.apiKey}`);
  if(!r.ok) throw new Error('absent');
  const doc = await r.json(), f = doc.fields;
  return {n:f.n.stringValue, p:f.p.stringValue, t:f.t.stringValue, c:+f.c.integerValue, o:+f.o.integerValue,
          entre:!!(f.entre && f.entre.booleanValue), heure:f.heure ? f.heure.timestampValue : '', maj:doc.updateTime};
}

/* Contrôle d’entrée (accueil) : un seul passage par code */
let jeton = null, courant = null;
try{ const s = JSON.parse(sessionStorage.getItem('accueil') || 'null'); if(s && s.exp > Date.now()) jeton = s.t; }catch(e){}
function statut(d){
  const el = $('vStatut'); el.hidden = false;
  if(d.entre){
    const h = d.heure ? new Date(d.heure).toLocaleString('fr-FR', {dateStyle:'short', timeStyle:'short'}) : '';
    el.textContent = `DÉJÀ ENTRÉ · ${h}`; el.className = 'statut ko'; $('vAction').hidden = true;
  } else {
    el.textContent = d.o === 1 ? 'PAS ENCORE ENTRÉ' : 'PRÉSENCE NON CONFIRMÉE'; el.className = d.o === 1 ? 'statut ok' : 'statut ko'; $('vAction').hidden = d.o !== 1;
  }
}
async function connexion(email, mdp){
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FB.apiKey}`,
    {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email, password:mdp, returnSecureToken:true})});
  if(!r.ok) throw new Error('auth');
  const j = await r.json(); jeton = j.idToken;
  sessionStorage.setItem('accueil', JSON.stringify({t:jeton, exp:Date.now() + (+j.expiresIn - 120) * 1000}));
}
async function valider(){
  const q = `updateMask.fieldPaths=entre&updateMask.fieldPaths=heure&currentDocument.updateTime=${encodeURIComponent(courant.maj)}&key=${FB.apiKey}`;
  const r = await fetch(`${base}/${encodeURIComponent(idScan)}?${q}`, {method:'PATCH',
    headers:{'Content-Type':'application/json', 'Authorization':'Bearer ' + jeton},
    body:JSON.stringify({fields:{entre:{booleanValue:true}, heure:{timestampValue:new Date().toISOString()}}})});
  if(r.status === 401 || r.status === 403){
    jeton = null; sessionStorage.removeItem('accueil');
    $('vLogin').hidden = false; $('vAction').hidden = true; $('vErr').textContent = 'Connexion requise pour l’accueil.'; return;
  }
  if(r.ok){
    const el = $('vStatut'); el.textContent = 'ENTRÉE VALIDÉE ✓'; el.className = 'statut ok'; $('vAction').hidden = true; return;
  }
  try{ courant = await lire(idScan); statut(courant); }catch(e){ $('vErr').textContent = 'Erreur, réessayez.'; }
}
$('vValider').onclick = () => {
  $('vErr').textContent = '';
  if(!jeton){ $('vLogin').hidden = false; $('vAction').hidden = true; return; }
  valider();
};
$('vLogin').addEventListener('submit', async e => {
  e.preventDefault(); $('vErr').textContent = '';
  try{ await connexion($('vMail').value.trim(), $('vMdp').value); $('vLogin').hidden = true; $('vMdp').value = ''; await valider(); }
  catch(x){ $('vErr').textContent = 'E-mail ou mot de passe incorrect.'; }
});

/* Scan d’un code QR : affichage des informations de l’invité */
let scan = false;
const idScan = new URLSearchParams(location.search).get('id');
const mi = location.hash.match(/^#invite=([\w-]+)$/);
function remplirVerif(d){
  $('vEtat').textContent = 'Invitation valide';
  $('vNom').textContent = `${d.n} ${d.p}`;
  $('vInfos').textContent = `${cotes[d.c] || ''} · ${d.o === 1 ? 'Présence confirmée' : d.o === 0 ? 'Absence annoncée' : 'Sans réponse'}`;
  $('vTel').textContent = d.t;
}
if(idScan && base){
  scan = true; $('intro').remove(); $('verif').hidden = false;
  $('vEtat').textContent = 'Vérification…'; $('vNom').textContent = '…';
  lire(idScan).then(d => { courant = d; remplirVerif(d); statut(d); if(d.o === 1) $('vQr').hidden = false; }).catch(() => {
    $('vEtat').textContent = 'Code non reconnu'; $('vNom').textContent = 'Invitation introuvable'; $('vInfos').textContent = ''; $('vTel').textContent = '';
  });
} else if(mi){
  try{ remplirVerif(decode(mi[1])); $('intro').remove(); $('verif').hidden = false; scan = true; }catch(e){}
}
if(scan) $('vOk').onclick = () => { $('verif').hidden = true; history.replaceState(null,'',location.pathname); afficherSite(); };

/* Ouverture de l’enveloppe */
if(!scan) $('ouvrir').addEventListener('click', function(){
  this.disabled = true;
  const intro = $('intro'), k = calme ? 0.05 : 1;
  intro.classList.add('open');
  setTimeout(() => intro.classList.add('fin'), 2900*k);
  setTimeout(() => { intro.remove(); afficherSite(); }, 4100*k);
});

/* Enregistrement de l’invité */
const form = $('form'), err = $('err');
if(C.limiteISO && Date.now() > new Date(C.limiteISO)){ $('repP').hidden = true; $('clos').hidden = false; }
$('rep').addEventListener('click', () => {
  const b = $('boite'); b.hidden = !b.hidden;
  $('rep').setAttribute('aria-expanded', String(!b.hidden));
  if(!b.hidden) setTimeout(() => b.scrollIntoView({behavior: calme ? 'auto' : 'smooth', block:'start'}), 60);
});

async function faireCarte(d, url){
  if(typeof QRCode === 'undefined') throw new Error('qr');
  const tmp = document.createElement('div');
  new QRCode(tmp, {text:url, width:560, height:560, colorDark:'#3A2318', colorLight:'#F4EBDD', correctLevel:QRCode.CorrectLevel.M});
  const qc = tmp.querySelector('canvas');
  await Promise.all(['80px "Pinyon Script"','40px "Bodoni Moda"','26px Jost','26px Cinzel'].map(f => document.fonts.load(f))).catch(() => {});
  const W = 900, H = 1240, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  x.fillStyle = '#F4EBDD'; x.fillRect(0,0,W,H);
  x.strokeStyle = '#B4563A'; x.lineWidth = 2; x.strokeRect(36,36,W-72,H-72);
  x.textAlign = 'center';
  x.fillStyle = '#B4563A'; x.font = '84px "Pinyon Script"'; x.fillText(`${C.prenom1} & ${C.prenom2}`, W/2, 190);
  x.fillStyle = '#3A2318'; x.font = '28px Cinzel'; x.fillText(C.dateTexte.toUpperCase(), W/2, 260);
  x.drawImage(qc, 170, 330, 560, 560);
  const t = `${d.n} ${d.p}`; let s = 44;
  do { x.font = `${s}px "Bodoni Moda"`; s -= 2; } while(x.measureText(t).width > 760 && s > 20);
  x.fillText(t, W/2, 990);
  x.font = '28px Jost'; x.fillStyle = '#6B4A3A';
  x.fillText(cotes[d.c], W/2, 1045); x.fillText('Présentez ce code à l’entrée', W/2, 1130);
  const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
  const u = URL.createObjectURL(blob);
  $('qrImg').src = u; $('dl').href = u;
  $('dl').download = ('invitation-' + d.n + '-' + d.p).replace(/[^\wÀ-ÿ-]+/g,'_') + '.png';
}

/* Liste fermée : chaque invité a un lien personnel ?i=… */
const idPerso = new URLSearchParams(location.search).get('i');
let perso = null;
const cloture = () => C.limiteISO && Date.now() > new Date(C.limiteISO);
const carteInvite = (d, id) => faireCarte(d, (C.urlSite || location.origin + location.pathname) + '?id=' + id);
function sans(t){ $('sans').textContent = t; $('sans').hidden = false; $('repP').hidden = true; $('clos').hidden = true; }
async function repondre(id, o){
  const r = await fetch(`${base}/${encodeURIComponent(id)}?updateMask.fieldPaths=o&updateMask.fieldPaths=rep&currentDocument.updateTime=${encodeURIComponent(perso.maj)}&key=${FB.apiKey}`,
    {method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({fields:{o:I(o), rep:{timestampValue:new Date().toISOString()}}})});
  if(!r.ok) throw new Error('rep');
}
if(base && !scan){
  $('champs').hidden = true;
  if(!idPerso) sans('Cette invitation est personnelle : utilisez le lien que les mariés vous ont envoyé.');
  else lire(idPerso).then(async d => {
    perso = d; $('salut').textContent = `${d.n} ${d.p}`;
    if(d.o === 2){ if(cloture()) sans('Les réponses sont closes. Merci !'); return; }
    $('repP').hidden = true; $('clos').hidden = true; $('boite').hidden = false; form.hidden = true;
    if(d.o === 0) $('merci').hidden = false;
    else try{ await carteInvite(d, idPerso); $('resultat').hidden = false; }
    catch(e){ $('merci').textContent = 'Réponse enregistrée. Le code n’a pas pu être affiché : rechargez la page.'; $('merci').hidden = false; }
  }).catch(() => sans('Lien d’invitation invalide. Contactez les mariés.'));
}

form.addEventListener('submit', async e => {
  e.preventDefault(); err.textContent = '';
  const f = new FormData(form), g = k => (f.get(k) || '').toString().trim();
  if(f.get('web')) return;
  if(base){
    if(!perso || perso.o !== 2) return;
    if(!g('pres')){ err.textContent = 'Merci de choisir Oui ou Non.'; return; }
    const o = g('pres') === 'oui' ? 1 : 0, btn = form.querySelector('[type=submit]'); btn.disabled = true;
    try{ await repondre(idPerso, o); }
    catch(x){ err.textContent = 'L’enregistrement a échoué. Vérifiez votre connexion puis réessayez.'; btn.disabled = false; return; }
    perso.o = o; form.hidden = true;
    if(!o){ $('merci').hidden = false; return; }
    try{ await carteInvite(perso, idPerso); $('resultat').hidden = false; }
    catch(x){ $('merci').textContent = 'Réponse enregistrée. Le code n’a pas pu être créé : rechargez la page.'; $('merci').hidden = false; }
    return;
  }
  if(!g('nom') || !g('post') || !g('tel') || g('cote') === '' || !g('pres')){ err.textContent = 'Merci de remplir tous les champs.'; return; }
  if(g('tel').replace(/\D/g,'').length < 8){ err.textContent = 'Le numéro de téléphone semble incomplet.'; return; }
  { let dernier = 0; try{ dernier = +localStorage.getItem('dernierEnvoi') || 0; }catch(x){}
    if(Date.now() - dernier < 30000){ err.textContent = 'Patientez quelques secondes avant un nouvel envoi.'; return; } }
  const d = {n:g('nom'), p:g('post'), t:g('tel'), c:+g('cote'), o:g('pres') === 'oui' ? 1 : 0};
  const btn = form.querySelector('[type=submit]'); btn.disabled = true;
  const id = idNouveau();
  if(base){
    try{ await enregistrer(id, d); }
    catch(x){ err.textContent = 'L’enregistrement a échoué. Vérifiez votre connexion puis réessayez.'; btn.disabled = false; return; }
  } else if(C.envoi){
    fetch(C.envoi, {method:'POST', mode:'no-cors', body:JSON.stringify({...d, cote:cotes[d.c], date:new Date().toISOString()})}).catch(() => {});
  }
  try{ localStorage.setItem('dernierEnvoi', String(Date.now())); }catch(x){}
  if(!d.o){ form.hidden = true; $('merci').hidden = false; return; }
  const url = base ? (C.urlSite || location.origin + location.pathname) + '?id=' + id
                   : location.origin + location.pathname + '#invite=' + encode(d);
  try{ await faireCarte(d, url); form.hidden = true; $('resultat').hidden = false; }
  catch(x){ err.textContent = 'Le code n’a pas pu être créé. Vérifiez votre connexion puis réessayez.'; btn.disabled = false; }
});
/* Retrouver son code QR depuis le lien personnel */
$('vQr').onclick = async () => {
  try{
    await faireCarte(courant, (C.urlSite || location.origin + location.pathname) + '?id=' + idScan);
    $('verif').hidden = true; history.replaceState(null,'',location.pathname); afficherSite();
    $('boite').hidden = false; form.hidden = true; $('resultat').hidden = false;
    setTimeout(() => $('resultat').scrollIntoView({behavior: calme ? 'auto' : 'smooth', block:'center'}), 300);
  }catch(e){ $('vErr').textContent = 'Le code n’a pas pu être créé. Vérifiez votre connexion.'; }
};
maj();
})();
