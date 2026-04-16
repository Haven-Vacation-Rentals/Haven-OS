import type { MetadataRoute } from "next";

/**
 * Haven OS is an internal operations tool. Even production should not
 * be indexed — anyone on Google shouldn't be able to find our login
 * page. Vercel preview deployments are blocked even harder.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
