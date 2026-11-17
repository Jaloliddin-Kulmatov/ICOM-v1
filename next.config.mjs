

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
  // The job list moved from /jobs to /internships, then became /opportunities
  // (internships, part-time, scholarships, contests, programs). Old links
  // (alert emails, bookmarks, search engines) still land on the right tab.
  // Single postings keep their /internships/:id address.
  async redirects() {
    return [
      { source: "/jobs", destination: "/opportunities?kind=internship", permanent: true },
      { source: "/jobs/:id", destination: "/internships/:id", permanent: true },
      { source: "/internships", has: [{ type: "query", key: "kind" }], destination: "/opportunities", permanent: true },
      { source: "/internships", destination: "/opportunities?kind=internship", permanent: true },
      // Support and Daily Life were merged into one Guide section.
      { source: "/support", destination: "/guide", permanent: true },
      { source: "/support/:path*", destination: "/guide/:path*", permanent: true },
      { source: "/daily-life", destination: "/guide/living", permanent: true },
    ];
  },
};

export default nextConfig;
