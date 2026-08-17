import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Static media, cached but always revalidated. These are hand-authored
        // files under /public, so their names stay put while their contents get
        // replaced — which is exactly the case `immutable` is wrong for: it
        // told browsers never to check again, so a swapped video or image kept
        // serving the old bytes for a year, even past a normal reload.
        //
        // `must-revalidate` with `max-age=0` costs one conditional request per
        // asset on a repeat visit, and Next answers those with a 304 off the
        // ETag it already sends — a couple hundred bytes, no body. First visits
        // (all ad traffic) are unaffected either way, since nothing is cached
        // yet on a cold load.
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
