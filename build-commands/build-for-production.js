
import { build } from 'tsup';
import crypto from 'crypto';
import * as fs from "node:fs";

const hash = crypto
  .randomBytes(6)
  .toString('hex')

// Captura argumentos passados: ex: node build.js --name=custom
const args = Object.fromEntries(
  process.argv.slice(2).map(arg => {
    const [key, value] = arg
      .replace(/^--/, '')
      .split('=')

    return [key, value ?? true]
  })
);

const entry = args.name

if (typeof entry !== 'string') {
  throw new Error(`You must specify a name`);
}

const filename = `${entry}.${hash}.js`

await fs.readdir('dist', async (err, files) => {
  if (err) throw err;

  const filteredFiles = files.filter((file) => file.startsWith(entry));

  if (filteredFiles.length > 0) {
    for (const file of filteredFiles) {
      await fs.unlink(`dist/${file}`, (err) => {
        if (!err) {
          return console.log(file, 'removed');
        }

        console.log(`Unable to remove ${file}`, err)
      })
    }

    return
  }

  console.log('No file found.');
})

await build({
  entry: [`src/${entry}.ts`],
  format: ['iife'],
  minify: true,
  outDir: 'dist',
  outExtension: () => ({
    js: `.${hash}.js`
  })
});

console.log(`Generated file: dist/${filename}`);

