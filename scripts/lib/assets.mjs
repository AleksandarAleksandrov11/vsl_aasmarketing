// Assets con hash en el nombre (caché "immutable" en /assets) e imágenes
// responsive AVIF + WebP generadas con sharp. Las imágenes procesadas se
// guardan en node_modules/.cache para que los builds siguientes sean rápidos
// (Vercel conserva esa carpeta entre despliegues).

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, copyFile, access } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const QUALITY = { avif: { quality: 58, effort: 4 }, webp: { quality: 80, effort: 5 } };

const hashOf = (buf, len = 10) => createHash('sha256').update(buf).digest('hex').slice(0, len);
const exists = (p) => access(p).then(() => true, () => false);

export class Assets {
  constructor({ root, out }) {
    this.root = root;
    this.out = out;
    this.cache = path.join(root, 'node_modules', '.cache', 'aas-img');
    this.files = new Map();
    this.pictures = new Map();
    this.meta = new Map();
  }

  async #write(rel, buf) {
    const dest = path.join(this.out, rel);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, buf);
  }

  /** Copia assets/<rel> a dist/assets/<rel con hash> y devuelve la URL pública. */
  async file(rel) {
    if (!this.files.has(rel)) {
      this.files.set(rel, (async () => {
        const buf = await readFile(path.join(this.root, 'assets', rel));
        const ext = path.extname(rel);
        const name = `assets/${rel.slice(0, -ext.length)}.${hashOf(buf, 8)}${ext}`;
        await this.#write(name, buf);
        return '/' + name;
      })());
    }
    return this.files.get(rel);
  }

  /** Copia sin hash a la raíz de dist (favicon.ico, og.jpg...). */
  async copyToRoot(rel, destName = path.basename(rel)) {
    const buf = await readFile(path.join(this.root, 'assets', rel));
    await this.#write(destName, buf);
    return '/' + destName;
  }

  async size(rel) {
    if (!this.meta.has(rel)) {
      this.meta.set(rel, sharp(path.join(this.root, 'assets', rel)).metadata().then(({ width, height }) => ({ width, height })));
    }
    return this.meta.get(rel);
  }

  async #variant(buf, rel, width, format) {
    const key = hashOf(Buffer.concat([buf, Buffer.from(`${width}|${format}|${JSON.stringify(QUALITY[format])}`)]), 16);
    const cached = path.join(this.cache, `${key}.${format}`);
    if (!(await exists(cached))) {
      await mkdir(this.cache, { recursive: true });
      const out = await sharp(buf).resize({ width, withoutEnlargement: true })[format](QUALITY[format]).toBuffer();
      await writeFile(cached, out);
    }
    const ext = path.extname(rel);
    const name = `assets/${rel.slice(0, -ext.length)}-${width}.${key.slice(0, 8)}.${format}`;
    const dest = path.join(this.out, name);
    await mkdir(path.dirname(dest), { recursive: true });
    await copyFile(cached, dest);
    return '/' + name;
  }

  /** Genera las variantes de una imagen y devuelve { width, height, avif, webp, fallback }. */
  async image(rel, widths) {
    const key = `${rel}|${widths.join(',')}`;
    if (!this.pictures.has(key)) {
      this.pictures.set(key, (async () => {
        const buf = await readFile(path.join(this.root, 'assets', rel));
        const { width: W, height: H } = await this.size(rel);
        const list = [...new Set(widths.map((w) => Math.min(w, W)))].sort((a, b) => a - b);
        const avif = [];
        const webp = [];
        for (const w of list) {
          avif.push(`${await this.#variant(buf, rel, w, 'avif')} ${w}w`);
          webp.push(`${await this.#variant(buf, rel, w, 'webp')} ${w}w`);
        }
        const big = list[list.length - 1];
        return {
          width: big,
          height: Math.round((H * big) / W),
          avif: avif.join(', '),
          webp: webp.join(', '),
          fallback: webp[Math.min(1, webp.length - 1)].split(' ')[0],
        };
      })());
    }
    return this.pictures.get(key);
  }
}
