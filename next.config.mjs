/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  skipMiddlewareUrlNormalize: true,
  distDir: "dist",
  modularizeImports: {
    "@mui/icons-material": {
      transform: "@mui/icons-material/{{member}}",
    },
  },
  output: "export",
  assetPrefix: "./"
};

export default nextConfig;
