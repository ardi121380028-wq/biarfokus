import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BiarFokus — Pomodoro & Task Focus",
    short_name: "BiarFokus",
    description:
      "BiarFokus membantu kamu fokus dan menyelesaikan setiap pekerjaan dengan Pomodoro timer.",
    start_url: "/",
    display: "standalone",
    background_color: "#e8e8e8",
    theme_color: "#f77fa5",
    lang: "id",
    icons: [
      {
        src: "/biarfokus-icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/biarfokus-logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
