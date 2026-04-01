/** @type {import('next').NextConfig} */
// `next dev` must not use static-export / GitHub basePath — wrong combo breaks dev + chunk loading.
// argv check: survives a stray NODE_ENV=production while running `next dev`.
//
// If you see "missing required error components, refreshing..." or missing ./NNN.js chunks:
// stop all dev servers (only one process on port 3000), run `npm run dev:fresh`, hard-refresh the browser.
// Avoid deleting `.next` while `next dev` is running; disable "Console Ninja"–style extensions if they hook fs.
const isDevServer =
  process.argv.includes('dev') ||
  (process.env.NODE_ENV !== 'production' && !process.argv.includes('build'))

module.exports = {
  reactStrictMode: true,
  /**
   * Dev-only: named chunk/module IDs reduce HMR/webpack-runtime mismatches ("Cannot find module './NNN.js'").
   * Optional: NEXT_DEV_WEBPACK_NO_CACHE=1 disables webpack filesystem cache in dev (slower, most reliable).
   * Do not touch config.output — that has caused flaky chunk IDs.
   */
  webpack: (config, { dev }) => {
    if (dev) {
      config.optimization = {
        ...config.optimization,
        chunkIds: 'named',
        moduleIds: 'named',
      }
      if (process.env.NEXT_DEV_WEBPACK_NO_CACHE === '1') {
        config.cache = false
      }
    }
    return config
  },
  output: isDevServer
    ? undefined
    : process.env.NEXT_OUTPUT === 'standalone'
      ? 'standalone'
      : process.env.NEXT_OUTPUT === 'export'
        ? 'export'
        : undefined,
  ...(function () {
    const ghExport =
      !isDevServer &&
      process.env.NEXT_OUTPUT === 'export' &&
      String(process.env.GITHUB_PAGES) === 'true'
    const base =
      ghExport && process.env.GITHUB_PAGES_BASEPATH
        ? process.env.GITHUB_PAGES_BASEPATH
        : ''
    return ghExport
      ? {
          basePath: base,
          assetPrefix: base,
          trailingSlash: true,
        }
      : { basePath: '', assetPrefix: '' }
  })(),
}
