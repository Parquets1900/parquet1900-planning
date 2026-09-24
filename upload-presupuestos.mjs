import { readdir, readFile } from 'fs/promises';
import { join, extname, basename } from 'path';

const FOLDER = '/Users/viktor/Library/CloudStorage/OneDrive-Personal/Presupuestos/Presupuestos 2026';
const API = 'https://planning.parquets1900.es/api/presupuesto';

function extraerNum(filename) {
    const m = filename.match(/([A-Z]{2,}[_\/]\d{4}[_\/]\d+(?:[._]\d+)?)/i);
    if (m) return m[1].replace(/_/g, '/').toUpperCase();
    return null;
}

// Clave completa: número normalizado + resto del nombre
// PRSTO_2026_000261 AJUNTAMENT DE GIRONA-PALAU1.pdf → PRSTO/2026/000261 AJUNTAMENT DE GIRONA-PALAU1
function filenameToKey(filename) {
    const base = filename.replace(/\.pdf$/i, '').trim();
    return base.replace(/^([A-Za-z]{2,})_(\d{4})_(\d+(?:[._]\d+)?)/,
        (_, a, b, c) => `${a.toUpperCase()}/${b}/${c.replace(/[_.]/g, '/')}`
    );
}

const files = (await readdir(FOLDER)).filter(f => extname(f).toLowerCase() === '.pdf');
console.log(`📂 ${files.length} PDFs encontrados\n`);

let ok = 0, skip = 0, err = 0;

for (const file of files) {
    const num = extraerNum(file);
    if (!num) {
        console.log(`⏭  Sin número detectado: ${file}`);
        skip++;
        continue;
    }
    const key = filenameToKey(file);
    try {
        const buf = await readFile(join(FOLDER, file));
        const data = buf.toString('base64');
        const res = await fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ num: key, data })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        console.log(`✓  ${key}`);
        ok++;
    } catch (e) {
        console.log(`✗  ${key}  — ${e.message}`);
        err++;
    }
}

console.log(`\n✅ Subidos: ${ok}  |  ⏭  Sin número: ${skip}  |  ❌ Errores: ${err}`);
