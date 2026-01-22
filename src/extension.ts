import * as vscode from "vscode";
import { tracker } from "./core/tracker";
import { initStatusBar } from "./ui/statusBar";

export function activate(context: vscode.ExtensionContext) {
    tracker.init(context);
    
    tracker.switchToCurrentWorkspace();
    initStatusBar(context);

    context.subscriptions.push(
        vscode.workspace.onDidChangeWorkspaceFolders(() => {
            tracker.switchToCurrentWorkspace();
        })
    );

    context.subscriptions.push(
        vscode.window.onDidChangeWindowState((state) => {
            if (state.focused) {
                tracker.resume();
            } else {
                tracker.pause();
            }
        })
    );
}

export function deactivate() {
    tracker.dispose();
}