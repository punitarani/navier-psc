"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { TabType } from "@/lib/types";

export function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeTab, setActiveTab } = useStore();

  const handleTabChange = (value: string) => {
    const tab = value as TabType;
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    params.delete('view');
    params.delete('config');
    router.push(`/?${params.toString()}`);
  };

  const handleCreateNew = () => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'configs');
    params.set('view', 'create');
    params.delete('config');
    router.push(`/?${params.toString()}`);
  };

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex items-center justify-between px-4 py-4 relative">
        {/* Left: Navigation tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="configs">Configs</TabsTrigger>
            <TabsTrigger value="simulations">Simulations</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Right: Create New button (only show on configs tab) */}
        {activeTab === 'configs' && (
          <Button onClick={handleCreateNew}>
            Create New
          </Button>
        )}
      </div>
    </header>
  );
}