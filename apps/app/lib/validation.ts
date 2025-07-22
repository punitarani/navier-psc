// Zod validation schemas for forms
import { z } from "zod";

export const parameterSchema = z.object({
	key: z.string().min(1, "Please select a parameter"),
	values: z
		.array(z.union([z.string(), z.number()]))
		.min(1, "Parameter must have at least 1 value")
		.refine((values) => {
			const nonEmptyValues = values.filter(
				(v) => v !== "" && v !== null && v !== undefined,
			);
			return nonEmptyValues.length >= 1;
		}, "Parameter must have at least 1 non-empty value"),
});

export const configSchema = z.object({
	name: z
		.string()
		.min(1, "Configuration name is required")
		.max(100, "Configuration name must be less than 100 characters"),
	description: z.string().default(""),
	parameters: z
		.array(parameterSchema)
		.min(1, "Configuration must have at least one parameter")
		.refine((parameters) => {
			// Check for duplicate keys
			const keys = parameters.map((p) => p.key);
			return new Set(keys).size === keys.length;
		}, "Parameter names must be unique"),
});

export type ConfigFormData = z.infer<typeof configSchema>;
export type ParameterFormData = z.infer<typeof parameterSchema>;
