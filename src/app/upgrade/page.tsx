"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/providers/app-provider";
import { PricingView } from "@/app/components/pricing-view";

function UpgradeContent() {
  const router = useRouter();
  const { user, subscription, isPro, activeTasksCount, setLoginOpen } = useAppContext();

  return (
    <PricingView
      userId={user?.id ?? null}
      subscription={subscription}
      isPro={isPro}
      activeTaskCount={activeTasksCount}
      onRequireSignIn={() => setLoginOpen(true)}
      onGoTimer={() => {
        router.push("/");
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
    />
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="inner-page" style={{ minHeight: "80vh" }} />}>
      <UpgradeContent />
    </Suspense>
  );
}
