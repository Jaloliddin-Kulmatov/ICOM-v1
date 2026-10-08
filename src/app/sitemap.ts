import { MetadataRoute } from "next";

const BASE = "https://icom.ai.kr";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static high-priority pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                        lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/community`,         lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/chat`,              lastModified: now, changeFrequency: "hourly",  priority: 0.9 },
    { url: `${BASE}/internships`,              lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/universities`,      lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/guide/living`,      lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/guide`,             lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/guide/visa`,      lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/guide/housing`,   lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/guide/banking`,   lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/guide/language`,  lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/guide/transport`, lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/guide/insurance`, lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/guide/faq`,       lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/login`,             lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/register`,          lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/privacy`,           lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/terms`,             lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];

  return staticPages;
}
