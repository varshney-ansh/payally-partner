import DashboardShell from "./dashboard-shell";

export default function DashboardLayout({
    children,
    content,
}: Readonly<{
    children: React.ReactNode;
    content: React.ReactNode;
}>) {
    return <DashboardShell>{content ?? children}</DashboardShell>;
}
