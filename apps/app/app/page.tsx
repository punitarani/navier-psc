"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { ConfigList } from "@/components/config-list";
import { ConfigForm } from "@/components/config-form";
import { ConfigPreview } from "@/components/config-preview";
import { SimulationList } from "@/components/simulation-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useStore } from "@/lib/store";
import { TabType } from "@/lib/types";

function MainContent() {
  const searchParams = useSearchParams();
  const { activeTab, setActiveTab, disconnectAllWebSockets } = useStore();
  
  const tab = (searchParams.get("tab") as TabType) || "configs";
  const view = searchParams.get("view") || "list";
  const configId = searchParams.get("config");

  // Sync URL with store
  useEffect(() => {
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [tab, activeTab, setActiveTab]);

  // Clean up WebSocket connections on unmount
  useEffect(() => {
    return () => {
      disconnectAllWebSockets();
    };
  }, [disconnectAllWebSockets]);

  if (tab === "simulations") {
    return <SimulationList />;
  }

  // Configs tab
  if (view === "create") {
    return <ConfigForm />;
  }

  if (view === "preview" && configId) {
    return <ConfigPreview configId={configId} />;
  }

  // Default to configs list view
  return <ConfigList />;
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<Skeleton className="h-16 w-full" />}>
        <Header />
      </Suspense>
      <main className="container mx-auto py-6 px-4">
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <MainContent />
        </Suspense>
      </main>
      <Toaster />
    </div>
  );
}
