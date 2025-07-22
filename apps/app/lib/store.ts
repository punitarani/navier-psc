import { toast } from "sonner";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { api, createWebSocketConnection } from "./api";
import {
	AppState,
	ParameterSweepConfigurationModel,
	SimulationStatusModel,
	TabType,
} from "./types";

interface AppStore extends AppState {
	// Actions for configs
	setActiveTab: (tab: TabType) => void;
	loadConfigs: () => Promise<void>;
	createConfig: (config: any) => Promise<string | null>;
	selectConfig: (config: ParameterSweepConfigurationModel | null) => void;
	deleteConfig: (id: string) => Promise<void>;

	// Actions for simulations
	loadSimulations: (configId: string) => Promise<void>;
	startSimulation: (configId: string) => Promise<void>;

	// WebSocket actions
	connectWebSocket: (configId: string) => void;
	disconnectWebSocket: (configId: string) => void;
	disconnectAllWebSockets: () => void;

	// UI actions
	setError: (error: string | null) => void;
	clearError: () => void;
}

export const useStore = create<AppStore>()(
	subscribeWithSelector((set, get) => ({
		// Initial state
		activeTab: "configs",
		configs: [],
		selectedConfig: null,
		isLoadingConfigs: false,
		simulations: {},
		isLoadingSimulations: false,
		wsConnections: {},
		wsStates: {},
		isCreating: false,
		error: null,

		// Tab management
		setActiveTab: (tab: TabType) => {
			set({ activeTab: tab });
			if (tab === "configs") {
				get().loadConfigs();
			}
		},

		// Config actions
		loadConfigs: async () => {
			set({ isLoadingConfigs: true, error: null });
			try {
				const configs = await api.getAllConfigs();
				set({ configs, isLoadingConfigs: false });
			} catch (error) {
				let message = "Unable to load configurations";
				if (error instanceof Error) {
					if (
						error.message.includes("network") ||
						error.message.includes("fetch")
					) {
						message = "Network error - please check your connection";
					} else {
						message = error.message.replace(
							"Failed to fetch",
							"Unable to connect to server",
						);
					}
				}
				set({ error: message, isLoadingConfigs: false });
				toast.error(message);
			}
		},

		createConfig: async (config: any) => {
			set({ isCreating: true, error: null });
			try {
				const newConfig = await api.createConfig(config);
				const { configs } = get();
				set({
					configs: [newConfig, ...configs],
					isCreating: false,
				});
				toast.success("Configuration created successfully");
				return newConfig.id;
			} catch (error) {
				let message = "Unable to create configuration";
				if (error instanceof Error) {
					if (error.message.includes("422")) {
						message = "Invalid configuration data";
					} else if (
						error.message.includes("network") ||
						error.message.includes("fetch")
					) {
						message = "Network error - please check your connection";
					} else {
						message = error.message.replace(
							"Failed to fetch",
							"Unable to connect to server",
						);
					}
				}
				set({ error: message, isCreating: false });
				toast.error(message);
				return null;
			}
		},

		selectConfig: (config: ParameterSweepConfigurationModel | null) => {
			set({ selectedConfig: config });
		},

		deleteConfig: async (id: string) => {
			try {
				await api.deleteConfig(id);
				const { configs } = get();
				set({ configs: configs.filter((c) => c.id !== id) });
				toast.success("Configuration deleted successfully");
			} catch (error) {
				let message = "Unable to delete configuration";
				if (error instanceof Error) {
					if (error.message.includes("404")) {
						message = "Configuration not found";
					} else if (
						error.message.includes("network") ||
						error.message.includes("fetch")
					) {
						message = "Network error - please check your connection";
					} else {
						message = error.message.replace(
							"Failed to fetch",
							"Unable to connect to server",
						);
					}
				}
				set({ error: message });
				toast.error(message);
			}
		},

		// Simulation actions
		loadSimulations: async (configId: string) => {
			set({ isLoadingSimulations: true, error: null });
			try {
				const simulations = await api.getSimulationRuns(configId);
				// Normalize completed simulations to show 100% progress
				const normalizedSimulations = simulations.map(sim => ({
					...sim,
					progress: sim.state === 'COMPLETED' ? 100 : sim.progress
				}));
				
				set((state) => ({
					simulations: {
						...state.simulations,
						[configId]: normalizedSimulations,
					},
					isLoadingSimulations: false,
				}));
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Failed to load simulations";
				set({ error: message, isLoadingSimulations: false });
				toast.error(message);
			}
		},

		startSimulation: async (configId: string) => {
			try {
				const response = await api.startSimulation(configId);
				if (response.status === "already_running") {
					toast.info(response.message);
				} else {
					toast.success("Simulation started successfully");
					// Connect to WebSocket for real-time updates
					get().connectWebSocket(configId);
				}
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Failed to start simulation";
				set({ error: message });
				toast.error(message);
			}
		},

		// WebSocket management
		connectWebSocket: (configId: string) => {
			const { wsConnections, wsStates } = get();

			// Don't create duplicate connections
			if (wsConnections[configId]) {
				return;
			}

			// Disconnect any other active connections to avoid confusion
			Object.keys(wsConnections).forEach((otherConfigId) => {
				if (otherConfigId !== configId) {
					get().disconnectWebSocket(otherConfigId);
				}
			});

			set((state) => ({
				wsStates: { ...state.wsStates, [configId]: "connecting" },
			}));

			try {
				const ws = createWebSocketConnection(configId);

				ws.onopen = () => {
					set((state) => ({
						wsStates: { ...state.wsStates, [configId]: "connected" },
					}));
				};

				ws.onmessage = (event) => {
					try {
						const data: SimulationStatusModel = JSON.parse(event.data);
						// Ensure progress is properly handled - backend might send exact values
						const normalizedData = {
							...data,
							progress: data.state === 'COMPLETED' ? 100 : Math.max(0, Math.min(100, data.progress)), // Force 100% for completed simulations
						};

						// Update simulations state with new data
						set((state) => ({
							simulations: {
								...state.simulations,
								[configId]: [
									normalizedData,
									...(state.simulations[configId] || []).filter(
										(s) => s.id !== normalizedData.id,
									),
								].sort(
									(a, b) =>
										new Date(b.created_at).getTime() -
										new Date(a.created_at).getTime(),
								),
							},
						}));
					} catch (error) {
						console.error("Failed to parse WebSocket message:", error);
					}
				};

				ws.onerror = () => {
					set((state) => ({
						wsStates: { ...state.wsStates, [configId]: "error" },
					}));
				};

				ws.onclose = () => {
					set((state) => {
						const { [configId]: removed, ...remainingConnections } =
							state.wsConnections;
						return {
							wsConnections: remainingConnections,
							wsStates: { ...state.wsStates, [configId]: "disconnected" },
						};
					});
				};

				set((state) => ({
					wsConnections: { ...state.wsConnections, [configId]: ws },
				}));
			} catch (error) {
				set((state) => ({
					wsStates: { ...state.wsStates, [configId]: "error" },
				}));
			}
		},

		disconnectWebSocket: (configId: string) => {
			const { wsConnections } = get();
			const ws = wsConnections[configId];
			if (ws) {
				ws.close();
			}
		},

		disconnectAllWebSockets: () => {
			const { wsConnections } = get();
			Object.values(wsConnections).forEach((ws) => ws.close());
			set({ wsConnections: {}, wsStates: {} });
		},

		// Error management
		setError: (error: string | null) => {
			set({ error });
		},

		clearError: () => {
			set({ error: null });
		},
	})),
);

// Load initial data
useStore.getState().loadConfigs();
