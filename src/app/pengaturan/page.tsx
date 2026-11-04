import type { Metadata } from "next";
import { SettingsView } from "@/app/components/settings/settings-view";

export const metadata: Metadata = {
  title: "Pengaturan - BiarFokus",
  description: "Sesuaikan tema, timer, audio, catatan, kalender, dan preferensi kerja kamu di BiarFokus.",
};

export default function PengaturanPage() {
  return <SettingsView />;
}

