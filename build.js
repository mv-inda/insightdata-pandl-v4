// build.js
const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const archiver = require("archiver");
const createConfig = require("./webpack.config.js");

/**
 * Discover qext + version
 */
function discoverExtensionMeta() {
  const root = __dirname;
  const qextFiles = fs
    .readdirSync(root)
    .filter((f) => f.toLowerCase().endsWith(".qext"));

  if (qextFiles.length !== 1) {
    throw new Error(
      `Expected exactly one .qext file in project root, found: ${qextFiles.join(
        ", "
      )}`
    );
  }

  const qextFile = qextFiles[0];
  const qextPath = path.join(root, qextFile);
  const qextJson = JSON.parse(fs.readFileSync(qextPath, "utf8"));

  if (!qextJson.version) {
    throw new Error(`No "version" found in ${qextFile}`);
  }

  const baseName = path.basename(qextFile, ".qext");
  const version = qextJson.version;

  return { baseName, version };
}

const envFromCli = process.argv.includes("--no-obf") ? { noObf: 1 } : {};

(async () => {
  try {
    const { baseName, version } = discoverExtensionMeta();

    const config = createConfig(envFromCli, { mode: "production" });

    await new Promise((resolve, reject) => {
      webpack(config, (err, stats) => {
        if (err) return reject(err);
        if (stats.hasErrors()) {
          return reject(
            new Error(
              stats.toString({ all: false, errors: true, colors: true })
            )
          );
        }
        console.log(stats.toString({ colors: true, chunks: false }));
        resolve();
      });
    });

    const distPath = path.resolve(__dirname, "dist");
    const zipName = `${baseName}-v${version}.zip`;
    const zipPath = path.join(__dirname, zipName);

    // Remove existing zip if present
    try {
      fs.unlinkSync(zipPath);
    } catch {}

    const out = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    out.on("close", () =>
      console.log(`✅ Created ${zipName} (${archive.pointer()} bytes)`)
    );

    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(out);
    archive.glob("**/*", { cwd: distPath, ignore: ["**/*.map"] });
    await archive.finalize();
  } catch (err) {
    console.error(err.stack || err.message || err);
    process.exit(1);
  }
})();
