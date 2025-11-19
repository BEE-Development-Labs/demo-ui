import type { NextConfig } from "next";
import { IgnorePlugin } from "webpack";

const nextConfig: NextConfig = {
  // Use webpack instead of Turbopack to have better control over module resolution
  // This can be overridden with --turbopack flag if needed
  webpack: (config, { isServer }) => {
    // Ignore test files and other unnecessary files from thread-stream
    config.plugins = config.plugins || [];
    config.plugins.push(
      new IgnorePlugin({
        resourceRegExp: /^\.\/test/,
        contextRegExp: /thread-stream/,
      })
    );
    
    // Ignore specific problematic files
    config.plugins.push(
      new IgnorePlugin({
        resourceRegExp: /(test|bench|README\.md|LICENSE)$/,
        contextRegExp: /thread-stream/,
      })
    );
    
    return config;
  },
  // Add empty turbopack config to silence the warning, but we'll use webpack
  turbopack: {},
};

export default nextConfig;
