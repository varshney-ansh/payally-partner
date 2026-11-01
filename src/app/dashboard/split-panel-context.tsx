"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

export interface SplitPanelState {
    /** Header text shown on the split panel. */
    header: string;
    /** Panel body content. */
    content: ReactNode;
}

interface SplitPanelContextValue {
    panel: SplitPanelState | null;
    open: boolean;
    /** Show the panel with the given content and open it. */
    showPanel: (panel: SplitPanelState) => void;
    /** Clear and close the panel. */
    clearPanel: () => void;
    /** Controlled open/close (used by the AppLayout preference toggle). */
    setOpen: (open: boolean) => void;
}

const SplitPanelContext = createContext<SplitPanelContextValue | null>(null);

export function SplitPanelProvider({ children }: { children: ReactNode }) {
    const [panel, setPanel] = useState<SplitPanelState | null>(null);
    const [open, setOpen] = useState(false);

    const value = useMemo<SplitPanelContextValue>(
        () => ({
            panel,
            open,
            showPanel: (next) => {
                setPanel(next);
                setOpen(true);
            },
            clearPanel: () => {
                setPanel(null);
                setOpen(false);
            },
            setOpen,
        }),
        [panel, open],
    );

    return <SplitPanelContext.Provider value={value}>{children}</SplitPanelContext.Provider>;
}

export function useSplitPanel(): SplitPanelContextValue {
    const ctx = useContext(SplitPanelContext);
    if (!ctx) {
        throw new Error("useSplitPanel must be used within a SplitPanelProvider");
    }
    return ctx;
}
