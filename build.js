// build.js
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const archiver = require('archiver');
const createConfig = require('./webpack.config.js');

const envFromCli = process.argv.includes('--no-obf') ? { noObf: 1 } : {};

(async () => {
  try {
    const config = createConfig(envFromCli, { mode: 'production' });
    await new Promise((resolve, reject) => {
      webpack(config, (err, statsObj) => {
        if (err) return reject(err);
        if (statsObj.hasErrors()) {
          return reject(new Error(statsObj.toString({ all: false, errors: true, colors: true })));
        }
        console.log(statsObj.toString({ colors: true, chunks: false }));
        resolve();
      });
    });

    const projectName = path.basename(__dirname);
    const distPath = path.resolve(__dirname, 'dist');
    const zipName = `${projectName}.zip`;
    const zipPath = path.join(__dirname, zipName);

    // remove existing zip if present
    try { fs.unlinkSync(zipPath); } catch {}

    const out = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    out.on('close', () => console.log(`✅ Created ${zipName} (${archive.pointer()} bytes)`));
    archive.on('error', err => { throw err; });

    archive.pipe(out);
    archive.glob('**/*', { cwd: distPath, ignore: ['**/*.map'] });
    await archive.finalize();
  } catch (err) {
    console.error(err.stack || err.message || err);
    process.exit(1);
  }
})();
