import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BiarFokus",
    short_name: "BiarFokus",
    description:
      "BiarFokus membantu kamu fokus dan menyelesaikan setiap pekerjaan dengan Pomodoro timer.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ec4899",
    lang: "id",
    icons: [
      {
        src: "/biarfokus-icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/biarfokus-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/biarfokus-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Catatan & Checklist",
        short_name: "Catatan",
        description: "Buka atau buat catatan cepat di BiarFokus",
        url: "/catatan",
        icons: [{ src: "/biarfokus-icon.png", sizes: "192x192" }],
      },
      {
        name: "Kalender Fokus",
        short_name: "Kalender",
        description: "Lihat jadwal sesi fokus dan agenda tugas",
        url: "/kalender",
        icons: [{ src: "/biarfokus-icon.png", sizes: "192x192" }],
      },
      {
        name: "Papan Kanban",
        short_name: "Kanban",
        description: "Kelola alur tugas dan proyek di papan Kanban",
        url: "/kanban",
        icons: [{ src: "/biarfokus-icon.png", sizes: "192x192" }],
      },
      {
        name: "Timer Pomodoro",
        short_name: "Timer",
        description: "Mulai sesi fokus belajar atau kerja sekarang",
        url: "/",
        icons: [{ src: "/biarfokus-icon.png", sizes: "192x192" }],
      },
    ],
  };
}
