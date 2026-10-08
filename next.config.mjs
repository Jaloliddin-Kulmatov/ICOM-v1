

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
  // The internships page moved from /jobs to /internships. Redirect old links
  // (already-sent alert emails, bookmarks, search engines) to the new URL.
  async redirects() {
    return [
      { source: "/jobs", destination: "/internships", permanent: true },
      { source: "/jobs/:id", destination: "/internships/:id", permanent: true },
      // Support and Daily Life were merged into one Guide section.
      { source: "/support", destination: "/guide", permanent: true },
      { source: "/support/:path*", destination: "/guide/:path*", permanent: true },
      { source: "/daily-life", destination: "/guide/living", permanent: true },
    ];
  },
};

export default nextConfig;
