import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  webpack: (config, { isServer }) => {
    config.resolve.alias['@react-native-async-storage/async-storage'] = false;
    return config;
  },
  /* config options here */
};

export default nextConfig;
