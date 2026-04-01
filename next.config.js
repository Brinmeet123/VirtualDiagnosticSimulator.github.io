/** @type {import('next').NextConfig} */
// `next dev` must not use static-export / GitHub basePath — wrong combo breaks dev + chunk loading.
// argv check: survives a stray NODE_ENV=production while running `next dev`.
const isDevServer =
  process.argv.includes('dev') ||
  (process.env.NODE_ENV !== 'production' && !process.argv.includes('build'))

module.exports = {
  reactStrictMode: true,
  // Intentionally no custom webpack() — mutating config.output has been associated with
  // flaky chunk IDs and "Cannot find module './NNN.js'" when .next is partially stale.
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
