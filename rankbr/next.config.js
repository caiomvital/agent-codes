/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow react-email's internal packages to be bundled for the server.
  // Without this, @react-email/components may fail to resolve in Route Handlers.
  transpilePackages: ["@react-email/components", "resend"],

  // Prevent webpack from bundling @react-pdf/renderer — it uses Buffer/Stream
  // and other Node.js APIs that must run in the Node.js runtime, not in the
  // webpack-bundled server bundle.
  serverExternalPackages: ["@react-pdf/renderer"],

  // Suppress known harmless warnings from Supabase realtime / ws.
  webpack(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

module.exports = nextConfig;
