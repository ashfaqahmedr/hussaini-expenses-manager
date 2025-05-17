/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'
const nextConfig = {
  // output: 'export',
  trailingSlash: true,
  basePath: isProd ? '/MobilOilApp' : '',
  assetPrefix: isProd ? '/MobilOilApp' : '',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // PWA config
  // experimental: {
  //   serviceWorker: {
  //     register: false, // We're registering the service worker manually
  //   }
  // }
  //   experimental: {
  //   serverActions: true, // if using server actions
  // },
}


export default nextConfig
