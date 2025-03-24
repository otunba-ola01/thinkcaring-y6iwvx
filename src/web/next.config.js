/**
 * Next.js Configuration File
 * 
 * This file contains configuration settings for the HCBS Revenue Management System
 * web application, including build optimizations, security headers, and environment-specific settings.
 */

const path = require('path');
// @next/bundle-analyzer v13.4.3 - Used to analyze webpack bundle sizes
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
});

// next-transpile-modules v10.0.0 - Used to transpile specific node modules
const withTM = require('next-transpile-modules')([
  // Add any npm modules that need transpilation here
]);

/**
 * Content Security Policy definition
 * Configured for HIPAA compliance and security best practices
 */
const CSP_POLICY = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self';
  connect-src 'self' ${process.env.NEXT_PUBLIC_API_BASE_URL || ''} ${process.env.NEXT_PUBLIC_CSP_CONNECT_SRC || ''};
  frame-src 'self';
  object-src 'none';
  base-uri 'self';
`.replace(/\s+/g, ' ').trim();

/**
 * Next.js configuration object
 */
const nextConfig = {
  // Enable React Strict Mode for development best practices
  reactStrictMode: true,
  
  // Use SWC minifier for faster builds
  swcMinify: true,
  
  // Remove X-Powered-By header for security
  poweredByHeader: false,
  
  // Disable source maps in production for better performance
  productionBrowserSourceMaps: false,
  
  // Enable response compression
  compress: true,
  
  // Optimize font loading
  optimizeFonts: true,
  
  // Image optimization configuration
  images: {
    // Add domains for external images if needed
    domains: [],
    // Prefer WebP format for better performance
    formats: ['image/webp'],
    // Responsive image sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache optimized images
    minimumCacheTTL: 60,
  },
  
  // Internationalization settings
  i18n: {
    locales: ['en-US'],
    defaultLocale: 'en-US',
  },
  
  // Security headers for HIPAA compliance
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Content-Security-Policy',
            value: CSP_POLICY,
          },
        ],
      },
    ];
  },
  
  // Custom webpack configuration
  webpack: (config, { dev, isServer }) => {
    // SVG handling with SVGR
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // Environment-specific webpack configurations
    if (dev) {
      // Development-specific optimizations
      // Enable detailed sourcemaps for better debugging
      config.devtool = 'eval-source-map';
    } else {
      // Production-specific optimizations
      // Additional bundle optimizations
      if (!isServer) {
        // Only run in browser bundles
        config.optimization.splitChunks.cacheGroups = {
          ...config.optimization.splitChunks.cacheGroups,
          commons: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        };
      }
    }

    // Module path aliases for cleaner imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@api': path.resolve(__dirname, './src/api'),
      '@store': path.resolve(__dirname, './src/store'),
      '@types': path.resolve(__dirname, './src/types'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@config': path.resolve(__dirname, './src/config'),
      '@context': path.resolve(__dirname, './src/context'),
    };

    return config;
  },
  
  // Build-time environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: 'HCBS Revenue Management System',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
  
  // Public runtime configuration (available in browser)
  publicRuntimeConfig: {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
    enableMockApi: process.env.NEXT_PUBLIC_ENABLE_MOCK_API === 'true',
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    enableFeatureFlags: process.env.NEXT_PUBLIC_ENABLE_FEATURE_FLAGS === 'true',
  },
  
  // Server-only runtime configuration (not exposed to browser)
  serverRuntimeConfig: {
    apiSecret: process.env.API_SECRET,
    nextAuthSecret: process.env.NEXTAUTH_SECRET,
  },
};

// Apply plugins and export the final configuration
module.exports = withTM(withBundleAnalyzer(nextConfig));