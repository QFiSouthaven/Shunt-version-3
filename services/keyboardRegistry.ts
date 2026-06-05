
// services/keyboardRegistry.ts

type ShortcutCallback = (e: KeyboardEvent) => void;

interface Shortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    meta?: boolean;
    alt?: boolean;
    description: string;
    callback: ShortcutCallback;
}

class KeyboardRegistry {
    private shortcuts: Map<string, Shortcut[]> = new Map();

    constructor() {
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    public register(scope: string, shortcut: Shortcut) {
        const existing = this.shortcuts.get(scope) || [];
        this.shortcuts.set(scope, [...existing, shortcut]);
        return () => this.unregister(scope, shortcut);
    }

    private unregister(scope: string, shortcut: Shortcut) {
        const existing = this.shortcuts.get(scope) || [];
        this.shortcuts.set(scope, existing.filter(s => s !== shortcut));
    }

    private handleKeyDown(e: KeyboardEvent) {
        // Global scope + active module scope (stored in attribute)
        const activeScope = document.body.getAttribute('data-active-tab') || 'global';
        const scopes = ['global', activeScope];

        for (const scope of scopes) {
            const registered = this.shortcuts.get(scope);
            if (!registered) continue;

            for (const s of registered) {
                const matchKey = e.key.toLowerCase() === s.key.toLowerCase();
                const matchCtrl = !!s.ctrl === (e.ctrlKey || e.metaKey);
                const matchShift = !!s.shift === e.shiftKey;
                const matchAlt = !!s.alt === e.altKey;

                if (matchKey && matchCtrl && matchShift && matchAlt) {
                    e.preventDefault();
                    s.callback(e);
                }
            }
        }
    }

    public getShortcutsForScope(scope: string): Shortcut[] {
        return this.shortcuts.get(scope) || [];
    }
}

export const keyboardRegistry = new KeyboardRegistry();
