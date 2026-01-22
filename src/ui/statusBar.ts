import * as vscode from "vscode";
import { tracker } from "../core/tracker";

let statusBarItem: vscode.StatusBarItem;
let updateInterval: NodeJS.Timeout;

export function initStatusBar(context: vscode.ExtensionContext) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.tooltip = "Time Tracker (auto)";
    statusBarItem.show();

    context.subscriptions.push(statusBarItem);

    updateStatusBar();

    updateInterval = setInterval(updateStatusBar, 1000);

    context.subscriptions.push({
        dispose: () => {
            if (updateInterval) {
                clearInterval(updateInterval);
            }
        }
    });
}

function updateStatusBar() {
    const session = tracker.getActiveSession();

    if (!session) {
        statusBarItem.text = "⏱️ No workspace";
        statusBarItem.tooltip = "Time Tracker (auto) - No active workspace";
        return;
    }

    const ms = tracker.getElapsedMs();
    const formattedTime = format(ms);

    statusBarItem.text = `⏱️ ${session.workspaceName} • ${formattedTime}`;
    statusBarItem.tooltip = `Time Tracker (auto)\nWorkspace: ${session.workspaceName}\nTotal time: ${formattedTime}`;
}

function format(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (days > 0) {
        return `${days}d ${pad(h)}:${pad(m)}:${pad(s)}`;
    }

    return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function pad(n: number): string {
    return n.toString().padStart(2, "0");
}