(function(){
const C = CONTENU, FB = C.firebase || {}, $ = id => document.getElementById(id);
const base = `https://firestore.googleapis.com/v1/projects/${FB.projectId}/databases/(default)/documents/invites`;
const cotes = C.cotes.map(t => t.replace('{1}', C.prenom1).replace('{2}', C.prenom2));
const el = (t, c, x) => { const e = document.createElement(t); if(c) e.className = c; if(x !== undefined) e.textContent = x; return e; };
let jeton = null, exp = 0, liste = [], echecs = 0, verrou = 0, derniere = Date.now(), minuteur = null;
$('lt').textContent = $('ttl').textContent = `${C.prenom1} & ${C.prenom2}`; $('sous').textContent = C.dateTexte;
document.title = `Admin — ${C.prenom1} & ${C.prenom2}`;

function deconnexion(msg){
  jeton = null; liste = []; clearInterval(minuteur);
  $('app').hidden = true; $('login').hidden = false; $('tb').replaceChildren(); $('lerr').textContent = msg || '';
}
async function api(url, opt = {}){
  if(!jeton || Date.now() > exp){ deconnexion('Session expirée, reconnectez-vous.'); throw new Error('exp'); }
  const r = await fetch(url, {...opt, headers:{'Content-Type':'application/json', Authorization:'Bearer ' + jeton}});
  if(r.status === 401 || r.status === 403){
    deconnexion(r.status === 403 ? 'Accès refusé : ce compte n’est pas administrateur.' : 'Session expirée, reconnectez-vous.'); throw new Error('auth');
  }
  return r;
}
async function charger(){
  const tout = []; let tok = '';
  do{
    const r = await api(`${base}?pageSize=300&key=${FB.apiKey}${tok ? '&pageToken=' + encodeURIComponent(tok) : ''}`);
    const j = await r.json();
    (j.documents || []).forEach(d => { const f = d.fields || {};
      tout.push({id:d.name.split('/').pop(), n:f.n?.stringValue || '', p:f.p?.stringValue || '', t:f.t?.stringValue || '',
        c:+(f.c?.integerValue || 0), o:+(f.o?.integerValue || 0), entre:!!f.entre?.booleanValue,
        heure:f.heure?.timestampValue || '', date:f.date?.timestampValue || ''}); });
    tok = j.nextPageToken || '';
  } while(tok);
  liste = tout; rendre();
}
const hr = h => h ? new Date(h).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'}) : '';
function rendre(){
  const total = liste.length, oui = liste.filter(x => x.o === 1).length, non = liste.filter(x => x.o === 0).length, att = total - oui - non, ent = liste.filter(x => x.entre).length;
  $('kT').textContent = total; $('kO').textContent = oui; $('kN').textContent = non; $('kA').textContent = att; $('kE').textContent = ent;
  const pe = oui ? Math.round(ent / oui * 100) : 0;
  $('kEs').textContent = `sur ${oui} présents (${pe} %)`; $('kEb').style.width = Math.min(100, pe) + '%';
  const po = total ? oui / total * 100 : 0, pn = total ? non / total * 100 : 0;
  $('donut').innerHTML = `<svg viewBox="0 0 42 42"><circle cx="21" cy="21" r="15.9155" fill="none" stroke="#E7D6BF" stroke-width="6"/><circle cx="21" cy="21" r="15.9155" fill="none" stroke="#4C7A4A" stroke-width="6" stroke-dasharray="${po.toFixed(1)} ${(100 - po).toFixed(1)}" stroke-dashoffset="25"/><circle cx="21" cy="21" r="15.9155" fill="none" stroke="#B4563A" stroke-width="6" stroke-dasharray="${pn.toFixed(1)} ${(100 - pn).toFixed(1)}" stroke-dashoffset="${(25 - po).toFixed(1)}"/><text x="21" y="23.5" text-anchor="middle" font-size="8" fill="#3A2318">${total}</text></svg><div class="leg"><p><i style="background:#4C7A4A"></i>Présents : ${oui}</p><p><i style="background:#B4563A"></i>Absents : ${non}</p><p><i style="background:#E7D6BF"></i>Sans réponse : ${att}</p></div>`;
  const nc = cotes.map((_, i) => liste.filter(x => x.c === i && x.o === 1).length), mx = Math.max(1, ...nc);
  $('cotes').replaceChildren(...cotes.map((nom, i) => {
    const d = el('div', 'ligne'), l = el('div'), b = el('div', 'barre'), s = el('i');
    l.append(el('span', '', nom), el('b', '', nc[i])); s.style.width = nc[i] / mx * 100 + '%'; b.append(s); d.append(l, b); return d; }));
  const jr = []; for(let k = 13; k >= 0; k--){ const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - k); jr.push(d); }
  const cn = jr.map(d => liste.filter(x => x.date && new Date(x.date).toDateString() === d.toDateString()).length), m = Math.max(1, ...cn);
  $('jours').replaceChildren(...jr.map((d, i) => { const c = el('div'), b = el('i');
    b.style.height = Math.round(cn[i] / m * 70) + 'px'; c.append(el('span', '', cn[i] || ''), b, el('span', '', d.getDate())); return c; }));
  tableau();
}
const lien = id => (C.urlSite || location.origin).replace(/\/+$/, '') + '/?i=' + id;
const chiffres = t => t.replace(/\D/g, '');
const numWa = t => { const d = chiffres(t); if(t.trim().startsWith('+')) return d; if(d.startsWith('00')) return d.slice(2); return (C.indicatif || '') + d.replace(/^0+/, ''); };
const msgWa = x => (C.messageWhatsapp || 'Bonjour {nom}, voici votre invitation au mariage de {1} & {2} : {lien}')
  .replace('{nom}', `${x.n} ${x.p}`).replace('{1}', C.prenom1).replace('{2}', C.prenom2).replace('{lien}', lien(x.id));
const badge = (t, c) => el('span', 'badge ' + c, t);
function tableau(){
  const q = $('q').value.trim().toLowerCase(), f = $('f').value;
  const v = liste.filter(x => (!q || `${x.n} ${x.p} ${x.t}`.toLowerCase().includes(q)) &&
    (f === 'tous' || (f === 'oui' && x.o === 1) || (f === 'non' && x.o === 0) || (f === 'rep' && x.o === 2) || (f === 'entre' && x.entre) || (f === 'attente' && x.o === 1 && !x.entre)))
    .sort((a, b) => (a.n + a.p).localeCompare(b.n + b.p, 'fr'));
  const dup = {}; liste.forEach(x => { const k = chiffres(x.t); if(k.length >= 8) dup[k] = (dup[k] || 0) + 1; });
  const nd = Object.values(dup).filter(n => n > 1).length;
  $('nb').textContent = `${v.length} invité(s)` + (nd ? ` · ${nd} numéro(s) en double` : '');
  $('tb').replaceChildren(...v.map(x => {
    const tr = el('tr'), td = (...n) => { const e = el('td'); e.append(...n); return e; };
    const act = td();
    if(chiffres(x.t).length >= 8){ const w = el('a', '', 'WhatsApp'); w.href = 'https://wa.me/' + numWa(x.t) + '?text=' + encodeURIComponent(msgWa(x)); w.target = '_blank'; w.rel = 'noopener'; act.append(w); }
    if(x.entre){ const b = el('button', '', 'Remettre à zéro'); b.onclick = () => raz(x); act.append(b); }
    if(x.o !== 2 && !x.entre){ const b = el('button', '', 'Réponse à zéro'); b.onclick = () => rep0(x); act.append(b); }
    const s = el('button', '', 'Supprimer'); s.onclick = () => suppr(x); act.append(s);
    tr.append(td(el('b', '', `${x.n} ${x.p}`), ...(dup[chiffres(x.t)] > 1 ? [document.createTextNode(' '), badge('Doublon', 'b-no')] : [])), td(cotes[x.c] || ''), td(x.t), td(badge(['Absent','Présent','En attente'][x.o], ['b-no','b-ok','b-gr'][x.o])),
      td(x.entre ? badge('Entré à ' + hr(x.heure), 'b-ok') : badge(x.o === 1 ? 'Pas encore' : '—', 'b-gr')), act);
    return tr; }));
}
async function raz(x){
  if(!confirm(`Remettre l’entrée de ${x.n} ${x.p} à zéro ?`)) return;
  await api(`${base}/${x.id}?updateMask.fieldPaths=entre&updateMask.fieldPaths=heure&key=${FB.apiKey}`, {method:'PATCH', body:JSON.stringify({fields:{entre:{booleanValue:false}}})});
  charger();
}
async function rep0(x){
  if(!confirm(`Remettre ${x.n} ${x.p} en attente de réponse ? Il pourra répondre à nouveau avec son lien.`)) return;
  await api(`${base}/${x.id}?updateMask.fieldPaths=o&updateMask.fieldPaths=rep&key=${FB.apiKey}`, {method:'PATCH', body:JSON.stringify({fields:{o:{integerValue:'2'}}})});
  charger();
}
async function suppr(x){
  if(!confirm(`Supprimer définitivement ${x.n} ${x.p} ? Son code QR ne fonctionnera plus.`)) return;
  await api(`${base}/${x.id}?key=${FB.apiKey}`, {method:'DELETE'}); charger();
}
function csv(){
  const e = s => { s = String(s ?? ''); if(/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
  const l = [['Nom','Post-nom','Téléphone','Côté','Présence','Entré','Heure d’entrée','Inscrit le']].concat(liste.map(x =>
    [x.n, x.p, x.t, cotes[x.c] || '', ['Absent','Présent','En attente'][x.o], x.entre ? 'Oui' : 'Non', x.heure ? new Date(x.heure).toLocaleString('fr-FR') : '', x.date ? new Date(x.date).toLocaleDateString('fr-FR') : '']));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + l.map(r => r.map(e).join(';')).join('\r\n')], {type:'text/csv;charset=utf-8'}));
  a.download = 'invites.csv'; a.click();
}
$('lf').addEventListener('submit', async ev => {
  ev.preventDefault();
  if(Date.now() < verrou){ $('lerr').textContent = `Trop d’essais. Patientez ${Math.ceil((verrou - Date.now()) / 1000)} s.`; return; }
  $('lerr').textContent = '';
  try{
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FB.apiKey}`,
      {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:$('mail').value.trim(), password:$('mdp').value, returnSecureToken:true})});
    if(!r.ok) throw new Error('login');
    const j = await r.json(); jeton = j.idToken; exp = Date.now() + (+j.expiresIn - 120) * 1000; echecs = 0; $('mdp').value = '';
  }catch(x){
    if(++echecs >= 5){ verrou = Date.now() + 60000; echecs = 0; }
    $('lerr').textContent = 'E-mail ou mot de passe incorrect.'; return;
  }
  $('login').hidden = true; $('app').hidden = false; derniere = Date.now();
  clearInterval(minuteur);
  minuteur = setInterval(() => { if(Date.now() - derniere > 30*60000) deconnexion('Déconnecté après 30 minutes d’inactivité.'); else if(!document.hidden) charger().catch(() => {}); }, 120000);
  charger().catch(() => {});
});
['click','keydown','touchstart'].forEach(e => addEventListener(e, () => derniere = Date.now()));
$('maj').onclick = () => charger().catch(() => {}); $('csv').onclick = csv; $('out').onclick = () => deconnexion('Vous êtes déconnecté.');
$('ac').innerHTML = '<option value="">Côté…</option>' + cotes.map((t, i) => `<option value="${i}">${t}</option>`).join('');
$('add').onclick = () => { $('ajout').hidden = !$('ajout').hidden; };
$('af').addEventListener('submit', async ev => {
  ev.preventDefault(); $('aerr').textContent = '';
  const n = $('an').value.trim(), p = $('ap').value.trim(), t = $('at').value.trim(), c = $('ac').value;
  if(!n || !p || c === ''){ $('aerr').textContent = 'Nom, post-nom et côté sont obligatoires.'; return; }
  const id = [...crypto.getRandomValues(new Uint8Array(12))].map(b => b.toString(16).padStart(2, '0')).join(''), S = v => ({stringValue:String(v)});
  try{
    const r = await api(`${base}?documentId=${id}&key=${FB.apiKey}`, {method:'POST', body:JSON.stringify({fields:{n:S(n), p:S(p), t:S(t), c:{integerValue:String(+c)}, o:{integerValue:'2'}, cote:S(cotes[+c]), date:{timestampValue:new Date().toISOString()}}})});
    if(!r.ok) throw new Error('add');
    $('af').reset(); await charger();
  }catch(e){ if(e.message === 'add') $('aerr').textContent = 'Ajout impossible. Vérifiez les règles Firestore puis réessayez.'; }
});
$('impAide').textContent = 'Une ligne par invité : Nom;Post-nom;Téléphone;N° du côté (vous pouvez coller depuis Excel). Côtés : ' + cotes.map((t, i) => `${i + 1} = ${t}`).join(', ') + '.';
$('impBtn').onclick = async () => {
  $('aerr').textContent = '';
  const lignes = $('imp').value.split(/\r?\n/).map(l => l.split(/[;\t]/).map(s => s.trim())).filter(a => a[0] || a[1]);
  if(!lignes.length) return;
  const bad = lignes.findIndex(a => !a[0] || !a[1] || !(+a[3] >= 1 && +a[3] <= cotes.length));
  if(bad >= 0){ $('aerr').textContent = `Ligne ${bad + 1} incorrecte : il faut Nom;Post-nom;Téléphone;N° du côté.`; return; }
  const racine = `projects/${FB.projectId}/databases/(default)/documents/invites/`, S = v => ({stringValue:String(v)});
  const idHex = () => [...crypto.getRandomValues(new Uint8Array(12))].map(b => b.toString(16).padStart(2, '0')).join('');
  const mk = a => { const c = +a[3] - 1; return {update:{name:racine + idHex(), fields:{n:S(a[0]), p:S(a[1]), t:S(a[2] || ''), c:{integerValue:String(c)}, o:{integerValue:'2'}, cote:S(cotes[c]), date:{timestampValue:new Date().toISOString()}}}, currentDocument:{exists:false}}; };
  for(let i = 0; i < lignes.length; i += 200){
    const r = await api(`https://firestore.googleapis.com/v1/projects/${FB.projectId}/databases/(default)/documents:commit?key=${FB.apiKey}`, {method:'POST', body:JSON.stringify({writes:lignes.slice(i, i + 200).map(mk)})});
    if(!r.ok){ $('aerr').textContent = 'Import interrompu. Vérifiez les règles Firestore et le format des lignes.'; return; }
  }
  $('imp').value = ''; $('aerr').textContent = `${lignes.length} invité(s) importé(s).`; charger();
};
$('purge').onclick = async () => {
  if(!liste.length) return;
  csv();
  if(prompt(`Une sauvegarde Excel vient d’être téléchargée.\nTapez SUPPRIMER pour effacer définitivement les ${liste.length} fiches.`) !== 'SUPPRIMER') return;
  const racine = `projects/${FB.projectId}/databases/(default)/documents/invites/`;
  for(let i = 0; i < liste.length; i += 400){
    const r = await api(`https://firestore.googleapis.com/v1/projects/${FB.projectId}/databases/(default)/documents:commit?key=${FB.apiKey}`, {method:'POST', body:JSON.stringify({writes:liste.slice(i, i + 400).map(x => ({delete:racine + x.id}))})});
    if(!r.ok){ alert('Suppression interrompue.'); break; }
  }
  charger();
};
$('q').addEventListener('input', tableau); $('f').addEventListener('change', tableau);
})();
