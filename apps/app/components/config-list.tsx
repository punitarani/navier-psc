"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStore } from "@/lib/store";

export function ConfigList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { configs, isLoadingConfigs, deleteConfig, loadConfigs } = useStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const handleView = (configId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'configs');
    params.set('config', configId);
    params.set('view', 'preview');
    router.push(`/?${params.toString()}`);
  };

  const handleDeleteClick = (configId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfigToDelete(configId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (configToDelete) {
      await deleteConfig(configToDelete);
      setDeleteDialogOpen(false);
      setConfigToDelete(null);
    }
  };

  if (isLoadingConfigs) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (configs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuration Library</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No configurations yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Create your first parameter sweep configuration to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const configToDeleteInfo = configs.find(c => c.id === configToDelete);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Configuration Library</h1>
          <Badge variant="secondary">{configs.length} configurations</Badge>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px] pl-6">Name</TableHead>
                <TableHead className="w-[300px]">Description</TableHead>
                <TableHead className="w-[250px]">Parameters</TableHead>
                <TableHead className="w-[100px] text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.map((config) => (
                <TableRow 
                  key={config.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleView(config.id)}
                >
                  <TableCell className="pl-6">
                    <div className="font-medium text-foreground">
                      {config.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-foreground line-clamp-2 text-sm leading-relaxed">
                      {config.description || "No description"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {config.parameters?.map((param, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {param.key}
                        </Badge>
                      )) || (
                        <span className="text-muted-foreground text-sm">No parameters</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteClick(config.id, e)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{configToDeleteInfo?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}