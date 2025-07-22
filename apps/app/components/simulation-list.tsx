"use client";

import { useEffect, useState } from "react";
import { Play, Activity, Loader2, Eye, FileText, Pause } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { SimulationStatusModel } from "@/lib/types";

function SimulationLogDialog({ simulations, configName }: { 
  simulations: SimulationStatusModel[], 
  configName: string 
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          View Log
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Simulation Log - {configName}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-96">
          <div className="space-y-2">
            {simulations.map((sim) => (
              <div key={sim.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div className="flex items-center space-x-2">
                  <Badge variant={sim.state === 'COMPLETED' ? 'default' : 'secondary'}>
                    {sim.state}
                  </Badge>
                  <span className="text-sm">{sim.progress}%</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(sim.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function SimulationList() {
  const searchParams = useSearchParams();
  const { 
    configs, 
    simulations, 
    isLoadingConfigs, 
    isLoadingSimulations, 
    loadSimulations, 
    startSimulation,
    connectWebSocket,
    disconnectWebSocket,
    wsStates
  } = useStore();
  
  const [selectedConfigId, setSelectedConfigId] = useState<string>("");

  // Set selected config from URL on mount
  useEffect(() => {
    const configFromUrl = searchParams.get('config');
    if (configFromUrl && configs.some(c => c.id === configFromUrl)) {
      setSelectedConfigId(configFromUrl);
    }
  }, [searchParams, configs]);

  useEffect(() => {
    // Load simulations when config is selected
    if (selectedConfigId) {
      loadSimulations(selectedConfigId);
    }
  }, [selectedConfigId, loadSimulations]);

  const handleStartSimulation = async () => {
    if (!selectedConfigId) return;
    await startSimulation(selectedConfigId);
  };

  const handleToggleWebSocket = () => {
    if (!selectedConfigId) return;
    
    const wsState = wsStates[selectedConfigId];
    if (wsState === 'connected') {
      disconnectWebSocket(selectedConfigId);
    } else {
      connectWebSocket(selectedConfigId);
    }
  };

  // Clean up WebSocket connections when switching configurations
  useEffect(() => {
    return () => {
      // Don't disconnect on unmount, let the main component handle cleanup
    };
  }, [selectedConfigId]);

  const selectedConfig = configs.find(c => c.id === selectedConfigId);
  const configSimulations = selectedConfigId ? simulations[selectedConfigId] || [] : [];
  const hasRunningSimulation = configSimulations.some(s => s.state === 'RUNNING');
  const wsState = selectedConfigId ? wsStates[selectedConfigId] : undefined;
  
  // Show connect/disconnect based on actual running state and ws connection
  const shouldShowStreamControls = hasRunningSimulation || wsState === 'connected' || wsState === 'disconnected';

  if (isLoadingConfigs) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">No configurations available.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Create a configuration first in the Configs tab.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Simulations</h1>
      </div>

      {/* Configuration Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Configuration</CardTitle>
          <CardDescription>
            Choose a configuration to view and run simulations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedConfigId} onValueChange={setSelectedConfigId}>
            <SelectTrigger className="min-w-[300px]">
              <SelectValue placeholder="Select a configuration..." />
            </SelectTrigger>
            <SelectContent>
              {configs.map((config) => (
                <SelectItem key={config.id} value={config.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{config.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {config.parameters.length} parameters
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedConfig && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <h3 className="font-medium">{selectedConfig.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedConfig.description}</p>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleStartSimulation}
                  disabled={hasRunningSimulation}
                  className="flex items-center space-x-2"
                >
                  {hasRunningSimulation && wsState === 'connected' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : hasRunningSimulation && wsState === 'disconnected' ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  <span>
                    {hasRunningSimulation && wsState === 'disconnected' 
                      ? "Disconnected" 
                      : hasRunningSimulation 
                        ? "Running..." 
                        : "Start Simulation"
                    }
                  </span>
                </Button>

                {shouldShowStreamControls && (
                  <Button 
                    variant={wsState === 'connected' ? 'destructive' : 'default'}
                    onClick={handleToggleWebSocket}
                    className="flex items-center space-x-2"
                  >
                    <Activity className="h-4 w-4" />
                    <span>
                      {wsState === 'connected' ? 'Disconnect Stream' : 'Connect Stream'}
                    </span>
                  </Button>
                )}
              </div>

              {wsState && (
                <div className="flex items-center space-x-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    wsState === 'connected' ? 'bg-green-500' : 
                    wsState === 'connecting' ? 'bg-yellow-500' : 
                    wsState === 'error' ? 'bg-red-500' : 
                    wsState === 'disconnected' ? 'bg-gray-500' : 'bg-gray-500'
                  }`} />
                  <span className="capitalize">{wsState === 'disconnected' ? 'disconnected' : wsState}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simulation Status */}
      {selectedConfigId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Simulation Status</span>
              {configSimulations.length > 0 && (
                <SimulationLogDialog 
                  simulations={configSimulations} 
                  configName={selectedConfig?.name || ""} 
                />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSimulations ? (
              <Skeleton className="h-24 w-full" />
            ) : (() => {
              const runningSimulation = configSimulations.find(s => s.state === 'RUNNING');
              const latestSimulation = configSimulations[0];
              
              if (runningSimulation) {
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-5 w-5 animate-pulse text-blue-500" />
                        <span className="font-medium">Simulation Running</span>
                        <Badge>RUNNING</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(runningSimulation.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{runningSimulation.progress}%</span>
                      </div>
                      <Progress value={runningSimulation.progress} className="h-3" />
                    </div>
                  </div>
                );
              } else if (latestSimulation) {
                return (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span>Last run completed</span>
                      <Badge>{latestSimulation.state}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(latestSimulation.created_at).toLocaleString()}
                    </span>
                  </div>
                );
              } else {
                return (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No simulation runs yet.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Start a simulation to see progress here.
                    </p>
                  </div>
                );
              }
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}