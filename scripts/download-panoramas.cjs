#!/usr/bin/env node
/**
 * Télécharge des panoramas équirectangulaires réels (CC0, Poly Haven)
 * pour alimenter les visites virtuelles 360° d'AfriBayit.
 *
 * 1. API https://api.polyhaven.com/files/<name> → URL du JPG tonemapped
 * 2. Téléchargement puis compression Python (PIL) → 2048×1024 q82
 *    (les JPG sources font ~5 Mo ; le poids final vise < 400 Ko)
 *
 * Sortie : public/panoramas/<slug>.jpg
 * Ensuite : scripts/seed-vr-tours.ts associe ces fichiers aux biens (hasVR).
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const OUT_DIR = path.join(__dirname, '..', 'public', 'panoramas');

// Sélection d'environnements parlants pour l'immobilier ouest-africain
const PANORAMAS = [
  'lythwood_lounge',          // salon chaleureux — villas/séjours
  'wooden_lounge',            // salon boisé — maisons
  'aft_lounge',               // lounge moderne — appartements hauts
  'modern_bathroom',          // salle de bain moderne
  'small_empty_room_1',       // pièce neuve à personnaliser
  'comfy_cafe',               // café cosy — commerces
  'entrance_hall',            // hall d'entrée — immeubles
  'industrial_wooden_attic',  // combes aménageables
  'sundowner_deck',           // terrasse coucher de soleil — extérieurs
  'art_studio',               // studio lumineux — location meublée
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let ok = 0, fail = 0;

  for (const name of PANORAMAS) {
    const outFile = path.join(OUT_DIR, `${name}.jpg`);
    if (fs.existsSync(outFile) && fs.statSync(outFile).size > 50_000) {
      console.log(`= déjà présent : ${name}`);
      ok++;
      continue;
    }

    // 1. URL du JPG tonemapped via l'API
    let url;
    try {
      const res = await fetch(`https://api.polyhaven.com/files/${name}`);
      if (!res.ok) throw new Error(`files API HTTP ${res.status}`);
      const data = await res.json();
      url = data?.tonemapped?.url;
      if (!url) throw new Error('pas de JPG tonemapped');
    } catch (e) {
      console.log(`x ${name} — API: ${e.message}`);
      fail++;
      continue;
    }

    // 2. Téléchargement vers un fichier temporaire
    const rawFile = `/tmp/${name}_raw.jpg`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(rawFile, buf);
    } catch (e) {
      console.log(`x ${name} — téléchargement: ${e.message}`);
      fail++;
      continue;
    }

    // 3. Compression → 2048 de large, qualité 82 (equirectangulaire 2:1)
    try {
      execFileSync('python3', [
        path.join(__dirname, 'compress-panorama.py'),
        rawFile,
        outFile,
      ]);
      const kb = Math.round(fs.statSync(outFile).size / 1024);
      console.log(`+ ${name} (${kb} Ko)`);
      ok++;
    } catch (e) {
      console.log(`x ${name} — compression: ${e.message.split('\n')[0]}`);
      fail++;
    } finally {
      try { fs.unlinkSync(rawFile); } catch {}
    }
  }

  console.log(`\nTerminé : ${ok} OK, ${fail} échecs → ${OUT_DIR}`);
  if (fail > 0) process.exit(1);
}

main();
