"use client";

import {
    AppLayoutToolbar,
    Box,
    HelpPanel,
    SideNavigation,
    SpaceBetween,
    SplitPanel,
} from "@cloudscape-design/components";
import { I18nProvider } from "@cloudscape-design/components/i18n";
import messages from "@cloudscape-design/components/i18n/messages/all.en";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SplitPanelProvider, useSplitPanel } from "./split-panel-context";

function DashboardShellInner({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const [navigationOpen, setNavigationOpen] = useState(true);
    const [toolsOpen, setToolsOpen] = useState(false);
    const { panel, open, setOpen, clearPanel } = useSplitPanel();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <I18nProvider locale="en" messages={[messages]}>
            <AppLayoutToolbar
                breadcrumbs={
                    <Box padding={{ vertical: "s" }}>
                        <SpaceBetween direction="horizontal" size="xxxs">
                            <Box key="payally-brand" variant="h3" padding="n" fontWeight="bold" fontSize="heading-l">
                                Payally
                            </Box>
                            <Box key="partner-brand" variant="h3" padding="n" fontWeight="normal" fontSize="heading-l">
                                Partner
                            </Box>
                        </SpaceBetween>
                    </Box>
                }
                navigationOpen={navigationOpen}
                onNavigationChange={({ detail }) => setNavigationOpen(detail.open)}
                navigation={
                    <SideNavigation
                        activeHref={pathname}
                        header={{ href: "/dashboard", text: "Merchant account" }}
                        items={[
                            { type: "link", text: "Overview", href: "/dashboard" },
                            {
                                type: "section-group",
                                title: "Store",
                                items: [
                                    { type: "link", text: "Products", href: "/dashboard/products" },
                                    { type: "link", text: "Orders", href: "/dashboard/transactions" },
                                    { type: "link", text: "Customers", href: "/dashboard/customers" },
                                ],
                            },
                            {
                                type: "section-group",
                                title: "AI store",
                                items: [
                                    { type: "link", text: "AI store", href: "/dashboard/mcp" },
                                ],
                            },
                            {
                                type: "section-group",
                                title: "Settings",
                                items: [
                                    { type: "link", text: "Store connections", href: "/dashboard/store-connect" },
                                    { type: "link", text: "PayPal account", href: "/dashboard/settings" },
                                    { type: "link", text: "Branding", href: "/dashboard/settings#branding" },
                                ],
                            },
                            { type: "divider" },
                            { type: "link", text: "Sign out", href: "/signout" },
                        ]}
                    />
                }
                toolsOpen={toolsOpen}
                onToolsChange={({ detail }) => setToolsOpen(detail.open)}
                tools={
                    <HelpPanel header={<h2>Payally Partner</h2>}>
                        Review merchant activity and manage the products connected to your PayPal account.
                    </HelpPanel>
                }
                splitPanelOpen={open}
                onSplitPanelToggle={({ detail }) => {
                    setOpen(detail.open);
                    if (!detail.open) clearPanel();
                }}
                splitPanelPreferences={{ position: "bottom" }}
                splitPanel={
                    panel ? (
                        <SplitPanel
                            header={panel.header}
                            i18nStrings={{
                                preferencesTitle: "Split panel preferences",
                                preferencesPositionLabel: "Split panel position",
                                preferencesPositionDescription:
                                    "Choose where the split panel is shown.",
                                preferencesPositionSide: "Side",
                                preferencesPositionBottom: "Bottom",
                                preferencesConfirm: "Confirm",
                                preferencesCancel: "Cancel",
                                closeButtonAriaLabel: "Close panel",
                                openButtonAriaLabel: "Open panel",
                                resizeHandleAriaLabel: "Resize split panel",
                            }}
                        >
                            {panel.content}
                        </SplitPanel>
                    ) : undefined
                }
                content={children}
            />
        </I18nProvider>
    );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
    return (
        <SplitPanelProvider>
            <DashboardShellInner>{children}</DashboardShellInner>
        </SplitPanelProvider>
    );
}
