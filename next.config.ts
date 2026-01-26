import type { NextConfig } from "next";
import withPWA from '@ducanh2912/next-pwa';

const config: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'prhglcwgdnfunkrfbdar.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

};

const nextConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})(config);

export default nextConfig;
