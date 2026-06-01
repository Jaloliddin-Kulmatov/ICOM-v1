import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/admin/", "/onboarding/", "/api/"],
      },
    ],
    sitemap: "https://icom.ai.kr/sitemap.xml",
    host: "https://icom.ai.kr",
  };
}
