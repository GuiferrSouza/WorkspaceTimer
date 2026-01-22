export interface WorkspaceTracking {
    workspaceName: string;
    workspacePath: string;
    startTime: number;
    accumulatedMs: number;
}

export interface TrackingState {
    workspaces: Record<string, WorkspaceTracking>;
    activeWorkspacePath: string | null;
}