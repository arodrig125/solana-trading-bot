const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable the outputFileTracing to fix the routes-manifest.json error
  output: 'standalone',
  distDir: '.next',
};

module.exports = withSentryConfig(
  nextConfig,
  {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options
    org: "solarbot",
    project: "solana-telegram-bot",
    silent: !process.env.CI,
    widenClientFileUpload: true,
    tunnelRoute: "/monitoring",
    disableLogger: true,
    automaticVercelMonitors: true,
  }
);
