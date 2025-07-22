export interface ValidationRule {
	type: "value" | "length";
	min_value?: number | null;
	max_value?: number | null;
}

export interface ParameterDefinition {
	name: string;
	description: string;
	key: string;
	type: string;
	allowed_values?: (string | number)[] | null;
	validation_rules?: ValidationRule[] | null;
}

export interface ParameterModel {
	key: string;
	type: string;
	values: (number | string | boolean)[];
}

export interface ParameterSweepConfigurationRequest {
	name: string;
	description: string;
	parameters: ParameterModel[];
}

export interface ParameterSweepConfigurationModel
	extends ParameterSweepConfigurationRequest {
	id: string;
}

export interface SimulationStatusModel {
	id: string;
	config_id: string;
	progress: number;
	state: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
	created_at: string;
}

// Base Response
export interface BaseResponse {
	status: string;
	message: string;
}

export interface HealthResponse extends BaseResponse {
	status: "healthy";
	message: "Server is running";
}

// Tab management
export type TabType = "configs" | "simulations";

// URL state management
export interface URLState {
	tab?: TabType;
	config?: string;
	view?: "create" | "preview" | "list";
}

// WebSocket connection states
export type WebSocketState =
	| "connecting"
	| "connected"
	| "disconnected"
	| "error";

// Application state for store
export interface AppState {
	// Current tab
	activeTab: TabType;

	// Configs state
	configs: ParameterSweepConfigurationModel[];
	selectedConfig: ParameterSweepConfigurationModel | null;
	isLoadingConfigs: boolean;

	// Simulations state
	simulations: Record<string, SimulationStatusModel[]>;
	isLoadingSimulations: boolean;

	// WebSocket state
	wsConnections: Record<string, WebSocket>;
	wsStates: Record<string, WebSocketState>;

	// UI state
	isCreating: boolean;
	error: string | null;
}
