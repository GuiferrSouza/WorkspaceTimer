import * as vscode from "vscode";
import { TrackingState, WorkspaceTracking } from "../types/tracking";
import { loadState, saveState } from "./storage";

class Tracker {
    private context!: vscode.ExtensionContext;
    private state!: TrackingState;
    private isTracking: boolean = false;
    private saveInterval?: NodeJS.Timeout;

    init(context: vscode.ExtensionContext) {
        this.context = context;

        const saved = loadState(context);

        this.state = {
            workspaces: saved?.workspaces ?? {},
            activeWorkspacePath: saved?.activeWorkspacePath ?? null,
        };

        if (typeof this.state.workspaces !== "object") {
            this.state.workspaces = {};
        }

        this.saveInterval = setInterval(() => {
            if (this.isTracking) {
                this.saveCurrentState();
            }
        }, 5000);
    }

    dispose() {
        this.stopTracking();
        this.saveCurrentState();

        if (this.saveInterval) {
            clearInterval(this.saveInterval);
        }
    }

    private stopTracking() {
        if (!this.isTracking || !this.state.activeWorkspacePath) return;

        const session = this.state.workspaces[this.state.activeWorkspacePath];
        if (session && session.startTime > 0) {
            const now = Date.now();
            session.accumulatedMs += now - session.startTime;
            session.startTime = 0;
        }

        this.isTracking = false;
    }

    private startTracking() {
        if (!this.state.activeWorkspacePath) return;

        const session = this.state.workspaces[this.state.activeWorkspacePath];
        if (session) {
            session.startTime = Date.now();
            this.isTracking = true;
        }
    }

    private saveCurrentState() {
        if (this.isTracking && this.state.activeWorkspacePath) {
            const session = this.state.workspaces[this.state.activeWorkspacePath];
            if (session && session.startTime > 0) {
                const now = Date.now();
                const currentAccumulated = session.accumulatedMs + (now - session.startTime);

                const stateToSave: TrackingState = {
                    ...this.state,
                    workspaces: {
                        ...this.state.workspaces,
                        [this.state.activeWorkspacePath]: {
                            ...session,
                            accumulatedMs: currentAccumulated,
                            startTime: now,
                        }
                    }
                };

                session.accumulatedMs = currentAccumulated;
                session.startTime = now;

                saveState(this.context, stateToSave);
            }
        } else {
            saveState(this.context, this.state);
        }
    }

    pause() {
        this.stopTracking();
        this.saveCurrentState();
    }

    resume() {
        this.startTracking();
    }

    switchToCurrentWorkspace() {
        this.stopTracking();

        const folder = vscode.workspace.workspaceFolders?.[0];

        if (!folder) {
            this.state.activeWorkspacePath = null;
            this.saveCurrentState();
            return;
        }

        const workspacePath = folder.uri.fsPath;
        const workspaceName = folder.name;

        if (!this.state.workspaces[workspacePath]) {
            this.state.workspaces[workspacePath] = {
                workspaceName,
                workspacePath,
                startTime: 0,
                accumulatedMs: 0,
            };
        }

        this.state.activeWorkspacePath = workspacePath;

        this.startTracking();
        this.saveCurrentState();
    }

    getActiveSession(): WorkspaceTracking | null {
        if (!this.state.activeWorkspacePath) return null;
        return this.state.workspaces[this.state.activeWorkspacePath] ?? null;
    }

    getElapsedMs(): number {
        const session = this.getActiveSession();
        if (!session) return 0;

        if (this.isTracking && session.startTime > 0) {
            return session.accumulatedMs + (Date.now() - session.startTime);
        }

        return session.accumulatedMs;
    }
}

export const tracker = new Tracker();