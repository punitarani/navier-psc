"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { ParameterDefinition, ValidationRule } from "@/lib/types";

interface BaseParameterInputProps {
  definition: ParameterDefinition;
  values: (string | number | boolean)[];
  onChange: (values: (string | number | boolean)[]) => void;
  error?: string;
}

function validateValue(value: string | number, rules?: ValidationRule[]): string | null {
  if (!rules) return null;

  for (const rule of rules) {
    if (rule.type === "value") {
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(numValue)) return "Must be a valid number";
      
      if (rule.min_value !== null && rule.min_value !== undefined && numValue < rule.min_value) {
        return `Must be at least ${rule.min_value}`;
      }
      if (rule.max_value !== null && rule.max_value !== undefined && numValue > rule.max_value) {
        return `Must be at most ${rule.max_value}`;
      }
    } else if (rule.type === "length") {
      const strValue = String(value);
      if (rule.min_value !== null && rule.min_value !== undefined && strValue.length < rule.min_value) {
        return `Must be at least ${rule.min_value} characters`;
      }
      if (rule.max_value !== null && rule.max_value !== undefined && strValue.length > rule.max_value) {
        return `Must be at most ${rule.max_value} characters`;
      }
    }
  }
  
  return null;
}

export function FloatParameterInput({ definition, values, onChange, error }: BaseParameterInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const addValue = () => {
    const value = parseFloat(inputValue);
    if (isNaN(value)) {
      setValidationError("Must be a valid number");
      return;
    }

    const validationError = validateValue(value, definition.validation_rules || undefined);
    if (validationError) {
      setValidationError(validationError);
      return;
    }

    if (values.includes(value)) {
      setValidationError("Value already exists");
      return;
    }

    onChange([...values, value]);
    setInputValue("");
    setValidationError(null);
  };

  const removeValue = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addValue();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-foreground">{definition.description}</p>
        </div>
        <Badge variant="outline">{definition.type}</Badge>
      </div>
      
      <div className="flex space-x-2">
        <Input
          id={definition.key}
          type="number"
          step="any"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setValidationError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Enter float value"
          className={validationError ? "border-destructive" : ""}
        />
        <Button type="button" onClick={addValue} size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {(validationError || error) && (
        <p className="text-sm text-destructive">{validationError || error}</p>
      )}
      
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((value, index) => (
            <Badge key={index} variant="secondary" className="flex items-center space-x-1">
              <span>{value}</span>
              <button
                type="button"
                onClick={() => removeValue(index)}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function EnumParameterInput({ definition, values, onChange, error }: BaseParameterInputProps) {
  const [selectedValue, setSelectedValue] = useState<string>("");

  const addValue = () => {
    if (!selectedValue) return;
    
    if (values.includes(selectedValue)) {
      return; // Value already exists
    }

    onChange([...values, selectedValue]);
    setSelectedValue("");
  };

  const removeValue = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const availableValues = (definition.allowed_values || []).filter(
    value => !values.includes(value)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-foreground">{definition.description}</p>
        </div>
        <Badge variant="outline">{definition.type}</Badge>
      </div>
      
      <div className="flex space-x-2">
        <Select value={selectedValue} onValueChange={setSelectedValue} disabled={availableValues.length === 0}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={availableValues.length === 0 ? "No more values available" : "Select value..."} />
          </SelectTrigger>
          <SelectContent>
            {availableValues.map((value) => (
              <SelectItem key={String(value)} value={String(value)}>
                {String(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          type="button"
          onClick={addValue} 
          size="sm" 
          disabled={!selectedValue || availableValues.length === 0}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {error && <p className="text-sm text-destructive">{error}</p>}
      
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((value, index) => (
            <Badge key={index} variant="secondary" className="flex items-center space-x-1">
              <span>{String(value)}</span>
              <button
                type="button"
                onClick={() => removeValue(index)}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function IntegerParameterInput({ definition, values, onChange, error }: BaseParameterInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const addValue = () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) {
      setValidationError("Must be a valid integer");
      return;
    }

    const validationError = validateValue(value, definition.validation_rules || undefined);
    if (validationError) {
      setValidationError(validationError);
      return;
    }

    if (values.includes(value)) {
      setValidationError("Value already exists");
      return;
    }

    onChange([...values, value]);
    setInputValue("");
    setValidationError(null);
  };

  const removeValue = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addValue();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-foreground">{definition.description}</p>
        </div>
        <Badge variant="outline">{definition.type}</Badge>
      </div>
      
      <div className="flex space-x-2">
        <Input
          id={definition.key}
          type="number"
          step="1"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setValidationError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Enter integer value"
          className={validationError ? "border-destructive" : ""}
        />
        <Button type="button" onClick={addValue} size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {(validationError || error) && (
        <p className="text-sm text-destructive">{validationError || error}</p>
      )}
      
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((value, index) => (
            <Badge key={index} variant="secondary" className="flex items-center space-x-1">
              <span>{value}</span>
              <button
                type="button"
                onClick={() => removeValue(index)}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function BooleanParameterInput({ definition, values, onChange, error }: BaseParameterInputProps) {
  const toggleValue = (value: boolean) => {
    if (values.includes(value)) {
      onChange(values.filter(v => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-foreground">{definition.description}</p>
        </div>
        <Badge variant="outline">{definition.type}</Badge>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`${definition.key}-true`}
            checked={values.includes(true)}
            onCheckedChange={() => toggleValue(true)}
          />
          <Label htmlFor={`${definition.key}-true`}>True</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`${definition.key}-false`}
            checked={values.includes(false)}
            onCheckedChange={() => toggleValue(false)}
          />
          <Label htmlFor={`${definition.key}-false`}>False</Label>
        </div>
      </div>
      
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

interface ParameterInputProps extends BaseParameterInputProps {}

export function ParameterInput(props: ParameterInputProps) {
  const { definition } = props;

  switch (definition.type) {
    case "float":
      return <FloatParameterInput {...props} />;
    case "integer":
      return <IntegerParameterInput {...props} />;
    case "enum":
      return <EnumParameterInput {...props} />;
    case "boolean":
      return <BooleanParameterInput {...props} />;
    default:
      return (
        <div className="text-sm text-muted-foreground">
          Unsupported parameter type: {definition.type}
        </div>
      );
  }
}