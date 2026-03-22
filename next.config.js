/** @type {import('next').NextConfig} */
// Never use static export / odd basePath during `next dev` — breaks dev overlay ("missing required error components")
const isDev = process.env.NODE_ENV === 'development'

const nextConfig = {
  reactStrictMode: true,
  output: isDev
    ? undefined
    : process.env.NEXT_OUTPUT === 'standalone'
      ? 'standalone'
      : process.env.NEXT_OUTPUT === 'export'
        ? 'export'
        : undefined,
  // GitHub Pages: project repos are served at USER.github.io/REPO/ — set basePath
  ...(function () {
    const ghExport =
      !isDev &&
      process.env.NEXT_OUTPUT === 'export' &&
      String(process.env.GITHUB_PAGES) === 'true'
    const base =
      ghExport && process.env.GITHUB_PAGES_BASEPATH
        ? process.env.GITHUB_PAGES_BASEPATH
        : ''
    return ghExport
      ? { basePath: base, assetPrefix: base }
      : { basePath: '', assetPrefix: '' }
  })(),
}

module.exports = nextConfig

