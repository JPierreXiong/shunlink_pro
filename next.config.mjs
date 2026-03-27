import bundleAnalyzer from '@next/bundle-analyzer';
import { createMDX } from 'fumadocs-mdx/next';
import createNextIntlPlugin from 'next-intl/plugin';

const withMDX = createMDX();

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const withNextIntl = createNextIntlPlugin('./src/core/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // OpenNext (Cloudflare) requires standalone output
  output: process.env.VERCEL ? undefined : 'standalone',
  // Disable file tracing to avoid Windows ENOENT errors on .nft.json files
  outputFileTracing: false,
  reactStrictMode: false,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
      },
    ],
  },
  async redirects() {
    return [];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
          },
        ]
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(self)'
          },
          {
            key: 'X-Robots-Tag',
            value: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
          }
        ]
      }
    ];
  },
  // 类型检查配置（用于快速通过 Vercel 部署）
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 注意：Next.js 16+ 中 eslint 配置已移除，通过环境变量控制
  turbopack: {
    // 明确指定项目根目录，避免 Next.js 错误推断工作区根目录
    root: process.cwd(),
    resolveAlias: {
      // fs: {
      //   browser: './empty.ts', // We recommend to fix code imports before using this method
      // },
    },
  },
  experimental: {
    // Disable mdxRs for Vercel deployment compatibility with fumadocs-mdx
    ...(process.env.VERCEL ? {} : { mdxRs: true }),
  },
  // Webpack 配置：忽略可选依赖 jsqr（如果未安装）
  webpack: (config, { isServer }) => {
    // ⬇️ 关键修复：解决 D 盘根目录监听导致的编译挂起和 EINVAL 错误
    config.watchOptions = {
      ignored: ['**/node_modules', 'D:/*.sys', 'D:/*.log', 'D:/*.tmp', 'D:/pagefile.sys', 'D:/hiberfil.sys', 'D:/swapfile.sys'],
    };

    if (!isServer) {
      // 客户端构建：忽略 jsqr 模块解析错误
      config.resolve.fallback = {
        ...config.resolve.fallback,
      };
      // 添加外部化配置，允许 jsqr 不存在
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push({
          'jsqr': 'commonjs jsqr',
        });
      }
    }
    return config;
  },
};

export default withBundleAnalyzer(withNextIntl(withMDX(nextConfig)));

