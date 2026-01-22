import * as vscode from "vscode";
import { TrackingState } from "../types/tracking";

const STORAGE_KEY = "timeTracker.state";

export function loadState(
    context: vscode.ExtensionContext
): TrackingState | null {
    return context.globalState.get<TrackingState>(STORAGE_KEY) ?? null;
}

export function saveState(
    context: vscode.ExtensionContext,
    state: TrackingState
) {
    context.globalState.update(STORAGE_KEY, state);
}