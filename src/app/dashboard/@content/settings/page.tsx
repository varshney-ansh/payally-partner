"use client";

import { Box, Header, Link, SpaceBetween } from "@cloudscape-design/components";

export default function SettingsPage() {
    return (
        <SpaceBetween size="l">
            <Header variant="h1">Settings</Header>
            <Box variant="p" color="text-body-secondary">
                Store connection settings have moved to{" "}
                <Link href="/dashboard/store-connect">Store Connect</Link>.
            </Box>
        </SpaceBetween>
    );
}
