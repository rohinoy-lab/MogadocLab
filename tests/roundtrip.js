/*
 * Format-writer round-trip test.
 *
 * Run from the repo root:
 *     node tests/roundtrip.js
 *
 * Loads elements.js, parsers.js and the format* writers extracted from
 * editor.js into one shared eval scope (so the const declarations see each
 * other), parses caffeine, runs it through every writer/parser pair, and
 * reports max coordinate drift.
 *
 * Caffeine is a good fixture: 24 atoms across 4 elements (C, H, N, O),
 * mix of single / aromatic / carbonyl bonds, 0–order trajectories, and
 * the single-uppercase atom-symbol regex bug that hid in parseQE for
 * organic molecules surfaces immediately.
 */
'use strict';

const fs = require('fs');
const path = require('path');

global.document = { getElementById: () => null, addEventListener: () => {} };
global.window = { addEventListener: () => {} };
global.localStorage = { getItem: () => null, setItem: () => {} };

const root = path.resolve(__dirname, '..');
const elementsSrc = fs.readFileSync(path.join(root, 'js/elements.js'), 'utf8');
const parsersSrc  = fs.readFileSync(path.join(root, 'js/parsers.js'),  'utf8');
const editorSrc   = fs.readFileSync(path.join(root, 'js/editor.js'),   'utf8');

const fnNames = [
  'formatXYZFromMol','formatJSONFromMol','formatMOLFromMol',
  'formatPDBFromMol','formatGaussianFromMol','formatOrcaFromMol',
  'formatVASPFromMol','formatQEFromMol','formatCIFFromMol','formatMolTo'
];
let formatsSrc = '';
for (const name of fnNames) {
  const re = new RegExp('function\\s+' + name + '\\s*\\([\\s\\S]*?\\n\\}', 'm');
  const m = editorSrc.match(re);
  if (!m) { console.error('Cannot extract', name); process.exit(2); }
  formatsSrc += m[0] + '\n';
}

const caffeineXYZ = `24
Caffeine C8H10N4O2
C   3.2460   0.7010   0.0000
C   1.9540   1.4240   0.0000
C   0.6920   0.6420   0.0000
N   0.7820  -0.7480   0.0000
C   2.0780  -1.0930   0.0000
N   3.1220  -0.1310   0.0000
N   1.8200   2.7620   0.0000
C   0.4620   3.0420   0.0000
N  -0.3170   1.9320   0.0000
O   4.3410   1.2240   0.0000
O   2.4140  -2.2280   0.0000
C   2.8980   3.7460   0.0000
C  -0.1730  -1.7180   0.0000
C   4.4810  -0.5250   0.0000
H   0.0760   4.0270   0.0000
H  -1.3530   1.8730   0.0000
H   2.5400   4.7510   0.0000
H   3.5240   3.6600   0.9000
H   3.5240   3.6600  -0.9000
H  -1.1850  -1.3480   0.0000
H   0.0130  -2.5250   0.8890
H   0.0130  -2.5250  -0.8890
H   5.0780   0.3620   0.0000
H   4.8390  -1.3260   0.0000`;

const driver = `
const original = parseXYZ(caffeineXYZ, {});
original.name = 'caffeine';

function maxCoordError(a, b) {
  if (a.atoms.length !== b.atoms.length) return Infinity;
  const ra = [...a.atoms].sort((x,y) => x.symbol.localeCompare(y.symbol) || x.x-y.x);
  const rb = [...b.atoms].sort((x,y) => x.symbol.localeCompare(y.symbol) || x.x-y.x);
  let m = 0;
  for (let i = 0; i < ra.length; i++) {
    if (ra[i].symbol !== rb[i].symbol) return 'SYMBOL_MISMATCH';
    m = Math.max(m,
      Math.abs(ra[i].x - rb[i].x),
      Math.abs(ra[i].y - rb[i].y),
      Math.abs(ra[i].z - rb[i].z));
  }
  return m;
}

const formats = [
  ['xyz', parseXYZ],
  ['mol', parseMOL],
  ['pdb', parsePDB],
  ['gaussian', parseGaussian],
  ['orca', parseOrca],
  ['vasp', parseVASP],
  ['qe', parseQE],
  ['cif', parseCIF],
];

let fail = 0;
console.log('Reference: ' + original.atoms.length + ' atoms, ' + original.bonds.length + ' bonds');
for (const [fmt, parser] of formats) {
  try {
    const text = formatMolTo(fmt, original);
    const reparsed = parser(text, {});
    const err = maxCoordError(original, reparsed);
    const ok = typeof err === 'number' && err < 0.001;
    console.log('  ' + fmt.padEnd(10) + ' -> ' +
      String(reparsed.atoms.length).padStart(2) + ' atoms, max coord err ' +
      (typeof err === 'number' ? err.toFixed(4) + ' A' : err).padEnd(12) +
      ' [' + (ok ? 'PASS' : 'FAIL') + ']');
    if (!ok) fail++;
  } catch (e) {
    console.log('  ' + fmt.padEnd(10) + ' -> ERROR: ' + e.message);
    fail++;
  }
}
process.exit(fail === 0 ? 0 : 1);
`;

eval(elementsSrc + '\n' + parsersSrc + '\n' + formatsSrc + '\nconst caffeineXYZ = ' + JSON.stringify(caffeineXYZ) + ';\n' + driver);
