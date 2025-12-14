// webpack.config.js
const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const WebpackObfuscator = require("webpack-obfuscator");

function discoverExtension() {
  const root = __dirname;

  const qextFiles = fs
    .readdirSync(root)
    .filter((f) => f.toLowerCase().endsWith(".qext"));

  if (qextFiles.length === 0) {
    throw new Error(
      "No .qext found in project root. Put exactly one *.qext file in the root (next to webpack.config.js)."
    );
  }
  if (qextFiles.length > 1) {
    throw new Error(
      `Multiple .qext files found in project root: ${qextFiles.join(
        ", "
      )}. Keep exactly one.`
    );
  }

  const qextFile = qextFiles[0];
  const baseName = path.basename(qextFile, ".qext");

  const mainEntry = path.resolve(root, "src", `${baseName}.js`);
  if (!fs.existsSync(mainEntry)) {
    throw new Error(
      `Main entry not found: ${mainEntry}\nExpected src/${baseName}.js to match ${qextFile}`
    );
  }

  const propertiesEntry = path.resolve(root, "src", "properties.js");
  const hasProperties = fs.existsSync(propertiesEntry);

  return { qextFile, baseName, mainEntry, propertiesEntry, hasProperties };
}

module.exports = (env = {}, argv = {}) => {
  const isProd = argv.mode === "production";
  const noObf = !!env.noObf || process.env.NO_OBF === "1";

  const { qextFile, baseName, mainEntry, propertiesEntry, hasProperties } =
    discoverExtension();

  // helpful build-time echo
  console.log("Build mode:", isProd ? "production" : "development");
  console.log("Extension:", baseName);
  console.log("QEXT:", qextFile);
  console.log("Obfuscation enabled:", isProd && !noObf);
  console.log("Minify (terser) enabled:", isProd && !noObf);

  // entries: always main; add properties only if it exists
  const entries = {
    [baseName]: mainEntry,
    ...(hasProperties ? { properties: propertiesEntry } : {}),
  };

  return {
    entry: entries,

    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js",
      libraryTarget: "amd",
      clean: true,
    },

    externals: {
      qlik: "qlik",
      jquery: "jquery",
      axios: "axios",
    },

    module: {
      rules: [
        {
          test: /\.js$/i,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [["@babel/preset-env", { targets: { chrome: "100" } }]],
            },
          },
        },
        {
          test: /\.css$/i,
          use: [{ loader: "style-loader" }, { loader: "css-loader" }],
        },
      ],
    },

    // If noObf: completely disable minification (no Terser)
    optimization:
      isProd && noObf
        ? { minimize: false, splitChunks: false, runtimeChunk: false }
        : {
            minimize: isProd,
            splitChunks: false,
            runtimeChunk: false,
            minimizer: [
              new TerserPlugin({
                extractComments: false,
                terserOptions: {
                  format: { comments: false },
                  compress: { passes: 2 },
                },
              }),
            ],
          },

    plugins: [
      new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify(
          isProd ? "production" : "development"
        ),
        __BUILD_ENV__: JSON.stringify(isProd ? "production" : "development"),
        __EXTENSION_ID__: JSON.stringify(baseName),
      }),

      new CopyPlugin({
        patterns: [
          // Copy the discovered qext (to dist root)
          { from: qextFile, to: "." },

          // Copy optional assets folder if present
          { from: "assets", to: "assets", noErrorOnMissing: true },
        ],
      }),

      // Only obfuscate in prod when not noObf
      ...(isProd && !noObf
        ? [
            new WebpackObfuscator({
              rotateStringArray: true,
              stringArray: true,
              stringArrayThreshold: 0.7,
              compact: true,
              controlFlowFlattening: false,
            }),
          ]
        : []),
    ],

    resolve: {
      extensions: [".js", ".css"],
      fallback: { ws: false, bufferutil: false, "utf-8-validate": false },
    },

    ignoreWarnings: [
      (w) =>
        typeof w.message === "string" &&
        w.message.includes(
          "Critical dependency: the request of a dependency is an expression"
        ),
    ],

    // keep maps in dev only
    devtool: isProd && noObf ? "source-map" : isProd ? false : "source-map",
    stats: "errors-warnings",
  };
};
