"use client";

import { useState, useEffect } from "react";
import { Plus, X, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { ParameterDefinition, ParameterModel } from "@/lib/types";
import { ParameterInput } from "@/components/parameter-inputs";
import { toast } from "sonner";

export function ConfigForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createConfig, isCreating } = useStore();
  
  const [parameterDefs, setParameterDefs] = useState<ParameterDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parameters: [] as ParameterModel[]
  });

  // Load parameter definitions
  useEffect(() => {
    const loadParameterDefs = async () => {
      try {
        const defs = await api.getParameterDefinitions();
        setParameterDefs(defs);
      } catch (error) {
        console.error("Failed to load parameter definitions:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        toast.error(`Failed to load parameter definitions: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadParameterDefs();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Configuration name is required";
    }
    
    if (formData.parameters.length === 0) {
      newErrors.parameters = "At least one parameter is required";
    }
    
    formData.parameters.forEach((param, index) => {
      if (!param.key) {
        newErrors[`param-${index}-key`] = "Please select a parameter";
      }
      if (param.values.length === 0) {
        newErrors[`param-${index}-values`] = "At least 1 value is required";
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }
    
    const configId = await createConfig(formData);
    if (configId) {
      // Navigate to the configs tab
      const params = new URLSearchParams(searchParams);
      params.set('tab', 'configs');
      params.delete('view');
      params.delete('config');
      router.push(`/?${params.toString()}`);
    }
  };

  const handleBack = () => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'configs');
    params.delete('view');
    params.delete('config');
    router.push(`/?${params.toString()}`);
  };

  const addParameter = () => {
    setFormData(prev => ({
      ...prev,
      parameters: [...prev.parameters, { key: "", type: "", values: [] }]
    }));
  };

  const removeParameter = (index: number) => {
    setFormData(prev => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index)
    }));
    
    // Clear related errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`param-${index}-key`];
      delete newErrors[`param-${index}-values`];
      return newErrors;
    });
  };

  const updateParameter = (index: number, updates: Partial<ParameterModel>) => {
    setFormData(prev => ({
      ...prev,
      parameters: prev.parameters.map((param, i) => 
        i === index ? { ...param, ...updates } : param
      )
    }));

    // Clear related errors when updating
    if (updates.key) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`param-${index}-key`];
        return newErrors;
      });
    }
    if (updates.values && updates.values.length > 0) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`param-${index}-values`];
        return newErrors;
      });
    }
  };

  const getAvailableParameters = (currentIndex: number) => {
    const usedKeys = formData.parameters
      .map((param, index) => index !== currentIndex ? param.key : null)
      .filter(Boolean);
    
    return parameterDefs.filter(def => !usedKeys.includes(def.key));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
        <h1 className="text-2xl font-bold">Create Configuration</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }));
                  if (errors.name && e.target.value.trim()) {
                    setErrors(prev => ({ ...prev, name: "" }));
                  }
                }}
                placeholder="Enter configuration name"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter configuration description (optional)"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Parameters</span>
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  addParameter();
                }}
                size="sm"
                disabled={parameterDefs.length === formData.parameters.length}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Parameter
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {errors.parameters && (
              <p className="text-sm text-destructive">{errors.parameters}</p>
            )}
            
            {formData.parameters.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No parameters added yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Click "Add Parameter" to get started.
                </p>
              </div>
            ) : (
              formData.parameters.map((param, index) => {
                const availableParams = getAvailableParameters(index);
                const selectedParamDef = parameterDefs.find(def => def.key === param.key);
                
                return (
                  <div key={index} className="space-y-4 p-4 border rounded-lg relative">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Parameter {index + 1}</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeParameter(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Select
                        value={selectedParamDef?.name || ""}
                        onValueChange={(value) => {
                          const paramDef = parameterDefs.find(def => def.name === value);
                          updateParameter(index, {
                            key: paramDef?.key || "",
                            type: paramDef?.type || "",
                            values: []
                          });
                        }}
                      >
                        <SelectTrigger className={errors[`param-${index}-key`] ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select parameter..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableParams.map((def) => (
                            <SelectItem key={def.key} value={def.name}>
                              <div className="flex flex-col">
                                <span className="font-medium">{def.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  {def.type} • {def.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors[`param-${index}-key`] && (
                        <p className="text-sm text-destructive">{errors[`param-${index}-key`]}</p>
                      )}
                    </div>

                    {selectedParamDef && (
                      <>
                        <Separator />
                        <ParameterInput
                          definition={selectedParamDef}
                          values={param.values}
                          onChange={(values) => updateParameter(index, { values })}
                          error={errors[`param-${index}-values`]}
                        />
                      </>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex space-x-4">
          <Button 
            type="submit" 
            disabled={isCreating}
            className="min-w-32"
          >
            {isCreating ? "Creating..." : "Create Configuration"}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleBack}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}