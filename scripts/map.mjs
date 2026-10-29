// Genera assets/img/mapa-europa.svg: mapa de puntos de Europa en gris con
// España resaltada. Sin marcadores de ciudades. Se ejecuta una sola vez y el
// SVG resultante queda en el repositorio (no forma parte del build).
//
// Uso (las dependencias no se guardan en package.json):
//   npm i --no-save world-atlas@2.0.2 topojson-client@3.1.0 d3-geo@3.1.1
//   node scripts/map.mjs

import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { feature } from 'topojson-client';
import { geoConicConformal, geoContains, geoBounds } from 'd3-geo';

const require = createRequire(import.meta.url);
const OUT = process.argv[2] || path.resolve(path.dirname(new URL(import.meta.url).pathname), '../assets/img/mapa-europa.svg');

const EUROPE = new Set([
  'Spain', 'Portugal', 'France', 'Andorra', 'Monaco', 'Italy', 'San Marino', 'Switzerland', 'Liechtenstein',
  'Austria', 'Germany', 'Belgium', 'Netherlands', 'Luxembourg', 'United Kingdom', 'Ireland', 'Denmark', 'Norway',
  'Sweden', 'Finland', 'Estonia', 'Latvia', 'Lithuania', 'Poland', 'Czechia', 'Slovakia', 'Hungary', 'Slovenia',
  'Croatia', 'Bosnia and Herz.', 'Serbia', 'Montenegro', 'Kosovo', 'Albania', 'Macedonia', 'North Macedonia',
  'Greece', 'Bulgaria', 'Romania', 'Moldova', 'Ukraine', 'Belarus', 'Malta',
]);

const W = 640;
const H = 560;
const STEP = 10; // separación entre puntos (px)
const DOT = 6.2; // diámetro del punto (px)

const topo = JSON.parse(await readFile(require.resolve('world-atlas/countries-50m.json'), 'utf8'));
const countries = feature(topo, topo.objects.countries).features.filter((f) => EUROPE.has(f.properties.name));
const spain = countries.find((f) => f.properties.name === 'Spain');

const projection = geoConicConformal()
  .rotate([-10, 0])
  .parallels([38, 58])
  .fitExtent([[8, 8], [W - 8, H - 8]], {
    type: 'MultiPoint',
    coordinates: [[-10.5, 35.6], [10, 35.6], [30, 35.6], [30, 63.5], [10, 63.5], [-10.5, 63.5]],
  });

const boxes = countries.map((f) => ({ f, b: geoBounds(f) }));
const inBox = ([lon, lat], [[x0, y0], [x1, y1]]) => lon >= x0 && lon <= x1 && lat >= y0 && lat <= y1;

let grey = '';
let dark = '';
let total = 0;
for (let y = STEP / 2; y < H; y += STEP) {
  for (let x = STEP / 2; x < W; x += STEP) {
    const p = projection.invert([x, y]);
    if (!p) continue;
    const hit = boxes.find(({ f, b }) => inBox(p, b) && geoContains(f, p));
    if (!hit) continue;
    const cmd = `M${x} ${y}h0`;
    if (hit.f === spain) dark += cmd;
    else grey += cmd;
    total++;
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" fill="none" stroke-linecap="round" stroke-width="${DOT}">
<path stroke="#c9c9ce" d="${grey}"/>
<path stroke="#0c0c0d" d="${dark}"/>
</svg>
`;
await writeFile(OUT, svg);
console.log(`Mapa generado: ${OUT} (${total} puntos, ${(svg.length / 1024).toFixed(1)} KB)`);
