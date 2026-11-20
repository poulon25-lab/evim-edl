// Génération du rapport PDF (dessin sur canvas A4 puis assemblage PDF, sans bibliothèque externe)
const Rapport = (() => {
  const W = 1240, H = 1754, M = 70;           // A4 à 150 dpi, marges
  const TOP = 120, BOTTOM = H - 90;
  const C = { brand: '#02adb4', anth: '#3d3a38', ink: '#1b2430', muted: '#6b7684', line: '#d5dbe2', light: '#eef3f8', bad: '#c62828', warn: '#a35f00', ok: '#2e7d32' };
  const COUL_ETAT = { 'Neuf': C.ok, 'Bon état': '#2f6fab', "État d'usage": C.warn, 'Mauvais état': C.bad };
  const RANG = { 'Neuf': 0, 'Bon état': 1, "État d'usage": 2, 'Mauvais état': 3 };

  const loadImg = src => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  const fmt = d => { if (!d) return ''; const [y, m, j] = d.split('-'); return `${j}/${m}/${y}`; };

  async function generer(edl, bien, entree, photos) {
    const pages = []; let ctx, y;
    const titreDoc = edl.type === 'entree' ? "ÉTAT DES LIEUX D'ENTRÉE" : 'ÉTAT DES LIEUX DE SORTIE';

    function newPage() {
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      ctx.textBaseline = 'top';
      ctx.fillStyle = C.brand; ctx.fillRect(0, 0, W, 8);
      ctx.font = '600 20px sans-serif'; ctx.fillStyle = C.muted;
      ctx.fillText(titreDoc + ' · ' + (bien.adresse || ''), M, 40, W - 2 * M - 160);
      ctx.textAlign = 'right'; ctx.fillText(fmt(edl.date), W - M, 40); ctx.textAlign = 'left';
      ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(M, 76); ctx.lineTo(W - M, 76); ctx.stroke();
      pages.push(cv); y = TOP;
    }
    function ensure(h) { if (y + h > BOTTOM) newPage(); }
    function wrap(str, maxW, font) {
      ctx.font = font; const out = [];
      for (const para of String(str ?? '').split('\n')) {
        const words = para.split(/\s+/); let line = '';
        for (const w of words) {
          const t = line ? line + ' ' + w : w;
          if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
        }
        out.push(line);
      }
      return out;
    }
    function text(str, { x = M, w = W - 2 * M, size = 24, weight = '400', color = C.ink, lh = 1.35, gap = 0 } = {}) {
      const font = `${weight} ${size}px sans-serif`; const lines = wrap(str, w, font);
      for (const l of lines) { ensure(size * lh); ctx.font = font; ctx.fillStyle = color; ctx.fillText(l, x, y); y += size * lh; }
      y += gap;
    }
    function section(t, min = 90) {
      ensure(min); y += 14;
      ctx.fillStyle = C.brand; ctx.fillRect(M, y, W - 2 * M, 50);
      ctx.font = '700 26px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(t, M + 18, y + 12);
      y += 66;
    }
    function kv(pairs, cols = 2) {
      const cw = (W - 2 * M) / cols;
      for (let i = 0; i < pairs.length; i += cols) {
        let hmax = 0; const y0 = y;
        ensure(70);
        pairs.slice(i, i + cols).forEach(([k, v], j) => {
          const x = M + j * cw;
          ctx.font = '600 19px sans-serif'; ctx.fillStyle = C.muted; ctx.fillText(k.toUpperCase(), x, y0);
          const lines = wrap(v || '—', cw - 20, '400 24px sans-serif');
          lines.forEach((l, n) => { ctx.fillStyle = C.ink; ctx.fillText(l, x, y0 + 26 + n * 32); });
          hmax = Math.max(hmax, 26 + lines.length * 32);
        });
        y = y0 + hmax + 12;
      }
    }

    // ---------- page 1 : en-tête ----------
    newPage();
    const logo = await loadImg('logo-h.png');
    if (logo) { const lw = 230, lh = logo.height * lw / logo.width, lx = W - M - lw, ly = y - 24; ctx.drawImage(logo, lx, ly, lw, lh); const g = ctx.createLinearGradient(lx + 20, 0, lx + lw * 0.58, 0); g.addColorStop(0, '#9c6f1c'); g.addColorStop(0.5, '#e2bd5c'); g.addColorStop(1, '#a87a22'); ctx.fillStyle = g; ctx.font = '600 21px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('By NSimo', lx + lw * 0.29, ly + lh * 0.80); ctx.textAlign = 'left'; }
    ctx.font = '800 44px sans-serif'; ctx.fillStyle = C.anth; ctx.fillText(titreDoc, M, y + 20, W - 2 * M - 280); y += 84;
    text('Établi contradictoirement entre les parties (loi n° 89-462 du 6 juillet 1989, décret n° 2016-382).', { size: 20, color: C.muted, w: W - 2 * M - 280, gap: 10 });
    y = Math.max(y, TOP + 150);
    section('Logement');
    kv([['Adresse', bien.adresse], ['Type', [bien.type, bien.surface ? bien.surface + ' m²' : ''].filter(Boolean).join(' · ')], ['Bailleur', bien.bailleur], ['Date de l\'état des lieux', fmt(edl.date)]]);
    section('Parties');
    kv([['Locataire(s)', edl.locataire], ['Agent / mandataire', edl.agent]]);
    if (entree) kv([["État des lieux d'entrée de référence", fmt(entree.date) + (entree.locataire ? ' · ' + entree.locataire : '')]], 1);

    const c = edl.compteurs || {};
    // ---------- synthèse comparative ----------
    if (entree) {
      section('Comparaison avec l\'état des lieux d\'entrée');
      const degr = [], ia = [];
      for (const p of edl.pieces) {
        const ref = entree.pieces.find(x => x.nom.toLowerCase() === p.nom.toLowerCase());
        if (ref) for (const e of p.elements) { const r = ref.elements.find(x => x.nom === e.nom); if (r && e.etat && r.etat && RANG[e.etat] > RANG[r.etat]) degr.push(`${p.nom} · ${e.nom} : ${r.etat} → ${e.etat}${e.commentaire ? ' — ' + e.commentaire : ''}`); }
        for (const d of (p.comparaison?.nouveaux_degats || [])) ia.push(`${p.nom} · ${d.element} — ${d.description} (${d.imputation === 'locataire' ? 'imputable au locataire' : d.imputation === 'vetuste' ? 'vétusté' : 'à vérifier'})`);
      }
      text(`${degr.length} élément(s) dont l'état s'est dégradé depuis l'entrée du ${fmt(entree.date)}.`, { size: 22, weight: '700', color: degr.length ? C.bad : C.ok, gap: 4 });
      degr.forEach(t => text('• ' + t, { size: 20, x: M + 10, w: W - 2 * M - 10 }));
      if (ia.length) { y += 6; text('Nouveaux dégâts détectés sur photos (IA, contrôlés par l\'agent) :', { size: 21, weight: '700', color: C.warn }); ia.forEach(t => text('• ' + t, { size: 20, x: M + 10, w: W - 2 * M - 10 })); }
      const cE = entree.compteurs || {}; const num = v => parseFloat(String(v).replace(',', '.'));
      const conso = [['Électricité', 'elec', 'kWh'], ['Gaz', 'gaz', 'm³'], ['Eau froide', 'eauFroide', 'm³'], ['Eau chaude', 'eauChaude', 'm³']].filter(([, k]) => cE[k] && c[k]).map(([l, k, u]) => `${l} : ${cE[k]} → ${c[k]} ${u} (consommation ${Math.round((num(c[k]) - num(cE[k])) * 100) / 100} ${u})`);
      if (conso.length) { y += 6; text('Consommations sur la période :', { size: 21, weight: '700' }); conso.forEach(t => text('• ' + t, { size: 20, x: M + 10, w: W - 2 * M - 10 })); }
      y += 6;
    }
    // ---------- compteurs ----------
    section('Relevés des compteurs et clés');
    kv([['Électricité', c.elec ? c.elec + ' kWh' : ''], ['Gaz', c.gaz ? c.gaz + ' m³' : ''], ['Eau froide', c.eauFroide ? c.eauFroide + ' m³' : ''], ['Eau chaude', c.eauChaude ? c.eauChaude + ' m³' : '']]);
    kv([['Clés remises', edl.cles]], 1);

    // ---------- pièces ----------
    for (const p of edl.pieces) {
      const ref = entree ? entree.pieces.find(x => x.nom.toLowerCase() === p.nom.toLowerCase()) : null;
      section(p.nom, 230);
      const avecRef = !!ref;
      const cols = avecRef ? [['Élément', .26], ["État d'entrée", .16], ['État de sortie', .16], ['Observations', .42]] : [['Élément', .30], ['État', .18], ['Observations', .52]];
      const tw = W - 2 * M; const xs = []; let acc = M; cols.forEach(([, f]) => { xs.push(acc); acc += f * tw; });
      const header = () => {
        ctx.fillStyle = C.light; ctx.fillRect(M, y, tw, 40);
        ctx.font = '700 19px sans-serif'; ctx.fillStyle = C.muted;
        cols.forEach(([t], i) => ctx.fillText(t.toUpperCase(), xs[i] + 10, y + 11));
        y += 40;
      };
      ensure(120); header();
      for (const e of p.elements) {
        const r = ref ? ref.elements.find(x => x.nom === e.nom) : null;
        const pire = r && e.etat && r.etat && RANG[e.etat] > RANG[r.etat];
        const cells = avecRef ? [e.nom, r?.etat || '—', e.etat || '—', e.commentaire] : [e.nom, e.etat || '—', e.commentaire];
        const fonts = cells.map((_, i) => (i === 0 ? '600 22px sans-serif' : '400 21px sans-serif'));
        const wrapped = cells.map((t, i) => wrap(t || '', cols[i][1] * tw - 20, fonts[i]));
        const h = Math.max(...wrapped.map(l => l.length)) * 28 + 18;
        if (y + h > BOTTOM) { newPage(); header(); }
        if (pire) { ctx.fillStyle = '#fff3f3'; ctx.fillRect(M, y, tw, h); }
        wrapped.forEach((lines, i) => {
          const isEtat = avecRef ? (i === 1 || i === 2) : i === 1;
          const val = cells[i];
          ctx.font = isEtat ? '700 21px sans-serif' : fonts[i];
          ctx.fillStyle = isEtat ? (COUL_ETAT[val] || C.muted) : C.ink;
          lines.forEach((l, n) => ctx.fillText(l, xs[i] + 10, y + 10 + n * 28));
        });
        y += h; ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(M, y); ctx.lineTo(M + tw, y); ctx.stroke();
      }
      y += 10;
      if (p.analyse && (p.analyse.defauts || []).length) {
        text('Défauts relevés (analyse IA validée par l\'agent) :', { size: 21, weight: '700', color: C.warn });
        for (const d of p.analyse.defauts) text('• ' + d.element + ' — ' + d.description + (d.gravite ? ' (' + d.gravite + ')' : ''), { size: 20, x: M + 10, w: W - 2 * M - 10 });
        y += 6;
      }
      if (p.comparaison && (p.comparaison.nouveaux_degats || []).length) {
        text('Nouvelles dégradations constatées depuis l\'entrée :', { size: 21, weight: '700', color: C.bad });
        for (const d of p.comparaison.nouveaux_degats) {
          const imp = d.imputation === 'locataire' ? 'imputable au locataire' : d.imputation === 'vetuste' ? 'vétusté / usure normale' : 'à vérifier';
          text('• ' + d.element + ' — ' + d.description + ' (' + imp + ')', { size: 20, x: M + 10, w: W - 2 * M - 10 });
        }
        y += 6;
      }
      // photos
      const imgs = (await Promise.all(p.photos.map(id => photos[id] ? loadImg(photos[id]) : null))).filter(Boolean);
      if (imgs.length) {
        const n = 4, gap = 14, s = (tw - gap * (n - 1)) / n, hh = s * 0.75;
        ensure(hh + 40); text(`Photos (${imgs.length})`, { size: 20, weight: '700', color: C.muted, gap: 4 });
        for (let i = 0; i < imgs.length; i += n) {
          ensure(hh + gap);
          imgs.slice(i, i + n).forEach((im, j) => {
            const x = M + j * (s + gap);
            const r = Math.max(s / im.width, hh / im.height); const sw = s / r, sh = hh / r;
            ctx.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, x, y, s, hh);
            ctx.strokeStyle = C.line; ctx.strokeRect(x, y, s, hh);
            ctx.font = '600 16px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillRect(x, y + hh - 26, 60, 26); ctx.fillStyle = C.ink; ctx.fillText(p.nom.slice(0, 1).toUpperCase() + (i + j + 1), x + 6, y + hh - 22);
          });
          y += hh + gap;
        }
      }
    }

    // ---------- observations & signatures ----------
    section('Observations générales');
    text(edl.observations || 'Néant.', { size: 22, gap: 10 });
    section('Signatures');
    text(`Fait ${edl.lieuSignature ? 'à ' + edl.lieuSignature + ', ' : ''}le ${fmt(edl.date)}, en autant d'exemplaires que de parties. Les signataires déclarent le présent état des lieux sincère et conforme.`, { size: 20, color: C.muted, gap: 14 });
    ensure(280);
    const sw = (W - 2 * M - 40) / 2;
    const sigs = [['Le bailleur / son mandataire', edl.agent, edl.signatures?.agent], ['Le(s) locataire(s)', edl.locataire, edl.signatures?.locataire]];
    for (let i = 0; i < 2; i++) {
      const [t, nom, data] = sigs[i]; const x = M + i * (sw + 40);
      ctx.font = '700 21px sans-serif'; ctx.fillStyle = C.ink; ctx.fillText(t, x, y);
      ctx.font = '400 19px sans-serif'; ctx.fillStyle = C.muted; ctx.fillText((nom || '') + ' — « Lu et approuvé »', x, y + 30, sw);
      ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.strokeRect(x, y + 60, sw, 190);
      if (data) { const im = await loadImg(data); if (im) { const r = Math.min((sw - 20) / im.width, 170 / im.height); ctx.drawImage(im, x + (sw - im.width * r) / 2, y + 70 + (170 - im.height * r) / 2, im.width * r, im.height * r); } }
    }
    y += 270;
    text("Rapport généré avec l'application État des Lieux IA. Les pré-remplissages par intelligence artificielle ont été contrôlés par l'agent.", { size: 16, color: C.muted });

    // numéros de page
    pages.forEach((cv, i) => { const g = cv.getContext('2d'); g.font = '400 18px sans-serif'; g.fillStyle = C.muted; g.textAlign = 'center'; g.fillText(`Page ${i + 1} / ${pages.length}`, W / 2, H - 55); g.textAlign = 'left'; g.font = '400 16px sans-serif'; g.fillText('Paraphes :', M, H - 55); });

    return construirePdf(pages.map(cv => cv.toDataURL('image/jpeg', 0.82)));
  }

  // ---------- écriture du fichier PDF (une image JPEG pleine page par page) ----------
  function construirePdf(jpegDataUrls) {
    const enc = new TextEncoder(); const chunks = []; const offsets = []; let len = 0;
    const push = d => { const b = typeof d === 'string' ? enc.encode(d) : d; chunks.push(b); len += b.length; };
    const bin = s => { const a = atob(s); const u = new Uint8Array(a.length); for (let i = 0; i < a.length; i++) u[i] = a.charCodeAt(i); return u; };
    const n = jpegDataUrls.length; const PW = 595.28, PH = 841.89;
    push('%PDF-1.4\n'); push(new Uint8Array([0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A]));
    const obj = (num, body) => { offsets[num] = len; push(`${num} 0 obj\n`); (Array.isArray(body) ? body : [body]).forEach(push); push('\nendobj\n'); };
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, `<< /Type /Pages /Count ${n} /Kids [${jpegDataUrls.map((_, i) => `${3 + i * 3} 0 R`).join(' ')}] >>`);
    jpegDataUrls.forEach((d, i) => {
      const p = 3 + i * 3, im = p + 1, ct = p + 2;
      const jpg = bin(d.split(',')[1]);
      obj(p, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 ${im} 0 R >> >> /Contents ${ct} 0 R >>`);
      obj(im, [`<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`, jpg, '\nendstream']);
      const content = `q ${PW} 0 0 ${PH} 0 0 cm /Im0 Do Q`;
      obj(ct, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    });
    const total = 3 + n * 3; const xref = len;
    let x = `xref\n0 ${total}\n0000000000 65535 f \n`;
    for (let i = 1; i < total; i++) x += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    push(x); push(`trailer\n<< /Size ${total} /Root 1 0 R /Info << /Producer (Etat des Lieux IA) >> >>\nstartxref\n${xref}\n%%EOF\n`);
    const out = new Uint8Array(len); let o = 0; for (const c of chunks) { out.set(c, o); o += c.length; } return out;
  }

  return { generer };
})();
