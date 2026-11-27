
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../configs/api";

// Fetch all workspaces
export const fetchWorkspaces = createAsyncThunk(
    "workspace/fetchWorkspace",
    async ({ getToken }, { rejectWithValue }) => {
        try {
            if (typeof getToken !== "function") {
                return rejectWithValue("Clerk getToken function is missing");
            }

            const token = await getToken();

            if (!token) {
                return rejectWithValue("Authentication token missing");
            }

            const { data } = await api.get("/api/workspaces", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            return data.workspaces || [];

        } catch (error) {
            console.error(
                "Fetch Workspaces Error:",
                error.response?.status,
                error.response?.data || error.message
            );

            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to fetch workspaces"
            );
        }
    }
);

const initialState = {
    workspaces: [],
    currentWorkspace: null,
    loading: false,
    error: null,
};

const workspaceSlice = createSlice({
    name: "workspace",
    initialState,

    reducers: {

        // Set workspaces
        setWorkspaces: (state, action) => {
            state.workspaces = action.payload || [];
        },

        // Set current workspace
        setCurrentWorkspace: (state, action) => {
            const workspace = state.workspaces.find(
                (w) => w.id === action.payload
            );

            if (workspace) {
                localStorage.setItem("currentWorkspaceId", workspace.id);
                state.currentWorkspace = workspace;
            }
        },

        // Add workspace
        addWorkspace: (state, action) => {
            state.workspaces.push(action.payload);
            state.currentWorkspace = action.payload;

            localStorage.setItem(
                "currentWorkspaceId",
                action.payload.id
            );
        },

        // Update workspace
        updateWorkspace: (state, action) => {
            state.workspaces = state.workspaces.map((workspace) =>
                workspace.id === action.payload.id
                    ? action.payload
                    : workspace
            );

            if (state.currentWorkspace?.id === action.payload.id) {
                state.currentWorkspace = action.payload;
            }
        },

        // Delete workspace
        deleteWorkspace: (state, action) => {
            state.workspaces = state.workspaces.filter(
                (workspace) => workspace.id !== action.payload
            );

            if (state.currentWorkspace?.id === action.payload) {
                state.currentWorkspace = state.workspaces[0] || null;

                if (state.currentWorkspace) {
                    localStorage.setItem(
                        "currentWorkspaceId",
                        state.currentWorkspace.id
                    );
                } else {
                    localStorage.removeItem("currentWorkspaceId");
                }
            }
        },

        // Add project
        addProject: (state, action) => {
            if (!state.currentWorkspace) return;

            state.currentWorkspace.projects.push(action.payload);

            const workspace = state.workspaces.find(
                (w) => w.id === state.currentWorkspace.id
            );

            if (workspace) {
                workspace.projects.push(action.payload);
            }
        },

        // Add task
        addTask: (state, action) => {
            if (!state.currentWorkspace) return;

            const project = state.currentWorkspace.projects.find(
                (p) => p.id === action.payload.projectId
            );

            if (project) {
                project.tasks.push(action.payload);
            }

            const workspace = state.workspaces.find(
                (w) => w.id === state.currentWorkspace.id
            );

            if (workspace) {
                const targetProject = workspace.projects.find(
                    (p) => p.id === action.payload.projectId
                );

                if (targetProject) {
                    targetProject.tasks.push(action.payload);
                }
            }
        },

        // Update task
        updateTask: (state, action) => {
            if (!state.currentWorkspace) return;

            const { id, projectId } = action.payload;

            const updateInWorkspace = (workspace) => {
                const project = workspace?.projects?.find(
                    (p) => p.id === projectId
                );

                if (project) {
                    project.tasks = project.tasks.map((task) =>
                        task.id === id ? action.payload : task
                    );
                }
            };

            updateInWorkspace(state.currentWorkspace);

            const workspace = state.workspaces.find(
                (w) => w.id === state.currentWorkspace.id
            );

            updateInWorkspace(workspace);
        },

        // Delete tasks
        deleteTask: (state, action) => {
            if (!state.currentWorkspace) return;

            const taskIds = Array.isArray(action.payload)
                ? action.payload
                : [action.payload];

            const deleteFromWorkspace = (workspace) => {
                workspace?.projects?.forEach((project) => {
                    project.tasks = project.tasks.filter(
                        (task) => !taskIds.includes(task.id)
                    );
                });
            };

            deleteFromWorkspace(state.currentWorkspace);

            const workspace = state.workspaces.find(
                (w) => w.id === state.currentWorkspace.id
            );

            deleteFromWorkspace(workspace);
        },
    },

    extraReducers: (builder) => {

        // Pending
        builder.addCase(fetchWorkspaces.pending, (state) => {
            state.loading = true;
            state.error = null;
        });

        // Success
        builder.addCase(fetchWorkspaces.fulfilled, (state, action) => {
            state.loading = false;
            state.error = null;
            state.workspaces = action.payload;

            if (action.payload.length > 0) {
                const savedId = localStorage.getItem(
                    "currentWorkspaceId"
                );

                const selectedWorkspace = action.payload.find(
                    (w) => w.id === savedId
                );

                state.currentWorkspace =
                    selectedWorkspace || action.payload[0];

                localStorage.setItem(
                    "currentWorkspaceId",
                    state.currentWorkspace.id
                );
            } else {
                state.currentWorkspace = null;
                localStorage.removeItem("currentWorkspaceId");
            }
        });

        // Failed
        builder.addCase(fetchWorkspaces.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || action.error.message;
        });
    },
});

export const {
    setWorkspaces,
    setCurrentWorkspace,
    addWorkspace,
    updateWorkspace,
    deleteWorkspace,
    addProject,
    addTask,
    updateTask,
    deleteTask,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;
