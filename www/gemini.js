// Analyse des photos avec l'API Gemini (Google AI Studio)
const Gemini = (() => {
  const ETATS = ['Neuf', 'Bon état', "État d'usage", 'Mauvais état'];

  async function call(parts) {
    const cfg = await Backend.getConfig().catch(() => ({}));
    const key = cfg.geminiKey || '';
    const model = cfg.model || 'gemini-2.5-flash';
    if (!key) throw new Error("L'IA n'est pas encore configurée : l'administrateur doit ajouter la clé Gemini dans Mon compte.");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
      })
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const msg = data.error && data.error.message ? data.error.message : ('Erreur HTTP ' + resp.status);
      throw new Error('Gemini : ' + msg);
    }
    const txt = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
    if (!txt) throw new Error("Gemini n'a pas renvoyé de réponse (photo refusée ou vide).");
    try { return JSON.parse(txt.replace(/^```json\s*|```\s*$/g, '')); }
    catch (e) { throw new Error('Réponse IA illisible, réessaie.'); }
  }

  function imgPart(dataUrl) {
    const [head, b64] = dataUrl.split(',');
    const mime = (head.match(/data:(.*?);/) || [])[1] || 'image/jpeg';
    return { inline_data: { mime_type: mime, data: b64 } };
  }

  // Analyse d'une pièce : pré-remplit l'état de chaque élément + liste des défauts
  async function analyserPiece(nomPiece, elements, photosDataUrls) {
    const prompt = `Tu es un expert en états des lieux immobiliers en France (location, décret 2016).
Pièce : « ${nomPiece} ».
Éléments à évaluer : ${elements.map(e => '« ' + e + ' »').join(', ')}.
Analyse attentivement les ${photosDataUrls.length} photo(s) jointes. Repère : dégâts, défauts, fissures, trous, taches, traces d'humidité, fuites, moisissures, peinture écaillée, joints noircis, éléments cassés ou manquants, usure.
Pour chaque élément, choisis un état parmi exactement : ${ETATS.map(e => '"' + e + '"').join(', ')}.
Si un élément n'est pas visible sur les photos, mets "etat": null et "commentaire": "Non visible sur les photos".
Commentaires courts, factuels, en français, comme dans un état des lieux professionnel (localisation précise du défaut si possible).
Réponds UNIQUEMENT en JSON avec ce format :
{"elements":[{"nom":"<nom exact de l'élément>","etat":"<état ou null>","commentaire":"<texte>"}],
 "defauts":[{"element":"<élément>","description":"<texte>","gravite":"faible|moyenne|élevée"}],
 "resume":"<1 à 2 phrases sur l'état général de la pièce>"}`;
    const parts = [{ text: prompt }, ...photosDataUrls.map(imgPart)];
    const r = await call(parts);
    r.elements = (r.elements || []).map(e => ({ ...e, etat: ETATS.includes(e.etat) ? e.etat : null }));
    r.defauts = r.defauts || [];
    return r;
  }

  // Comparaison entrée / sortie d'une pièce
  async function comparerPiece(nomPiece, photosEntree, photosSortie, etatsEntree) {
    const prompt = `Tu es un expert en états des lieux immobiliers en France.
Compare l'état de la pièce « ${nomPiece} » entre l'état des lieux d'ENTRÉE et celui de SORTIE.
Les ${photosEntree.length} premières images sont celles de l'ENTRÉE, les ${photosSortie.length} suivantes celles de la SORTIE.
État noté à l'entrée : ${etatsEntree.map(e => e.nom + ' = ' + (e.etat || 'non renseigné') + (e.commentaire ? ' (' + e.commentaire + ')' : '')).join(' ; ')}.
Liste uniquement les NOUVEAUX dégâts ou dégradations apparus depuis l'entrée. Distingue :
- "locataire" : dégradation probablement imputable au locataire (trou, tache, casse, brûlure…)
- "vetuste" : usure normale liée au temps (vétusté)
- "incertain" : impossible à trancher sur photo
Réponds UNIQUEMENT en JSON :
{"nouveaux_degats":[{"element":"<élément>","description":"<texte>","imputation":"locataire|vetuste|incertain"}],
 "resume":"<1 à 2 phrases>"}`;
    const parts = [{ text: prompt },
      { text: '--- PHOTOS ENTRÉE ---' }, ...photosEntree.map(imgPart),
      { text: '--- PHOTOS SORTIE ---' }, ...photosSortie.map(imgPart)];
    const r = await call(parts);
    r.nouveaux_degats = r.nouveaux_degats || [];
    return r;
  }

  async function tester() {
    const r = await call([{ text: 'Réponds en JSON : {"ok":true}' }]);
    return !!r;
  }

  return { ETATS, analyserPiece, comparerPiece, tester };
})();
