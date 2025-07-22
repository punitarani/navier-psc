"use client";

import { useEffect } from "react";
import { ArrowLeft, Play, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { useState } from "react";
import { ParameterSweepConfigurationModel } from "@/lib/types";

interface ConfigPreviewProps {
  configId: string;
}

export function ConfigPreview({ configId }: ConfigPreviewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startSimulation } = useStore();
  const [config, setConfig] = useState<ParameterSweepConfigurationModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStartingSimulation, setIsStartingSimulation] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const data = await api.getConfig(configId);
        setConfig(data);
      } catch (error) {
        console.error("Failed to load configuration:", error);
      } finally {
        setLoading(false);
      }
    };

    if (configId) {
      loadConfig();
    }
  }, [configId]);

  const handleBack = () => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'configs');
    params.delete('view');
    params.delete('config');
    router.push(`/?${params.toString()}`);
  };

  const handleStartSimulation = async () => {
    if (!config) return;
    
    setIsStartingSimulation(true);
    try {
      await startSimulation(config.id);
      
      // Navigate to simulations tab to watch progress
      const params = new URLSearchParams(searchParams);
      params.set('tab', 'simulations');
      params.set('config', config.id); // Pre-select this config
      params.delete('view');
      router.push(`/?${params.toString()}`);
    } finally {
      setIsStartingSimulation(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Configuration not found.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Configs</span>
          </Button>
          <h1 className="text-2xl font-bold">{config.name}</h1>
        </div>
        
        <Button 
          onClick={handleStartSimulation}
          disabled={isStartingSimulation}
          className="flex items-center space-x-2"
        >
          {isStartingSimulation ? (
            <Activity className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          <span>
            {isStartingSimulation ? "Starting..." : "Start Simulation"}
          </span>
        </Button>
      </div>

      {/* Configuration Details */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Name</h3>
            <p className="text-lg">{config.name}</p>
          </div>
          
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Description</h3>
            <p className="text-sm">{config.description || "No description provided"}</p>
          </div>
          
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Configuration ID</h3>
            <p className="text-sm font-mono text-muted-foreground">{config.id}</p>
          </div>
        </CardContent>
      </Card>

      {/* Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Parameters</span>
            <Badge variant="secondary">
              {config.parameters.length} parameters
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {config.parameters.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No parameters defined.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {config.parameters.map((param, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{param.key}</h3>
                    <Badge variant="outline">{param.type}</Badge>
                  </div>
                  
                  <div>
                    <h4 className="text-sm text-muted-foreground mb-2">Values</h4>
                    <div className="flex flex-wrap gap-2">
                      {param.values.map((value, valueIndex) => (
                        <Badge key={valueIndex} variant="secondary">
                          {String(value)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {index < config.parameters.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simulation Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Simulation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Run a parameter sweep simulation with this configuration. 
              The simulation will test all parameter combinations and track progress in real-time.
            </p>
            
            <div className="flex space-x-4">
              <Button 
                onClick={handleStartSimulation}
                disabled={isStartingSimulation}
                className="flex items-center space-x-2"
              >
                {isStartingSimulation ? (
                  <Activity className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span>
                  {isStartingSimulation ? "Starting Simulation..." : "Start Simulation"}
                </span>
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set('tab', 'simulations');
                  params.set('config', config.id); // Pre-select this config
                  params.delete('view');
                  router.push(`/?${params.toString()}`);
                }}
              >
                View Simulations
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}