"use client";

import {
    AppLayoutToolbar,
    Box,
    HelpPanel,
    SideNavigation,
    SpaceBetween,
} from "@cloudscape-design/components";
import { I18nProvider } from "@cloudscape-design/components/i18n";
import messages from "@cloudscape-design/components/i18n/messages/all.en";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const [navigationOpen, setNavigationOpen] = useState(true);
    const [toolsOpen, setToolsOpen] = useState(false);

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
                        header={{ href: "/dashboard", text: "Merchant Account" }}
                        items={[
                            { type: "link", text: "Overview", href: "/dashboard" },
                            { type: "link", text: "Products", href: "/dashboard/products" },
                            { type: "link", text: "Store Connect", href: "/dashboard/store-connect" },
                            { type: "link", text: "Transactions", href: "/dashboard/transactions" },
                            { type: "link", text: "MCP", href: "/dashboard/mcp" },
                            { type: "link", text: "Settings", href: "/dashboard/settings" },
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
                content={children}
            />
        </I18nProvider>
    );
}
