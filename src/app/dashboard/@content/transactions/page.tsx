"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    ColumnLayout,
    Container,
    Header,
    KeyValuePairs,
    Pagination,
    SpaceBetween,
    StatusIndicator,
    Table,
    TextFilter,
} from "@cloudscape-design/components";
import type { StatusIndicatorProps } from "@cloudscape-design/components";
import { useSplitPanel } from "../../split-panel-context";
import {
    formatCurrency,
    formatDate,
    loadMerchantOrders,
} from "@/lib/merchant-orders";
import type { MerchantOrder } from "@/lib/merchant-orders";

const PAGE_SIZE = 15;

function statusType(status: string): StatusIndicatorProps.Type {
    const s = status.toUpperCase();
    if (s === "COMPLETED") return "success";
    if (s.includes("FAIL") || s === "DECLINED" || s === "VOIDED") return "error";
    if (s === "PENDING" || s === "CREATED" || s === "SAVED" || s === "APPROVED") return "in-progress";
    return "info";
}

function sumValues(orders: MerchantOrder[], key: "grandTotal" | "platformFee"): number {
    return orders.reduce((acc, o) => acc + Number(o[key] || 0), 0);
}

export default function TransactionsPage() {
    const { showPanel, clearPanel } = useSplitPanel();

    const [orders, setOrders] = useState<MerchantOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [filteringText, setFilteringText] = useState("");
    const [currentPageIndex, setCurrentPageIndex] = useState(1);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        loadMerchantOrders()
            .then((data) => {
                if (active) setOrders(data);
            })
            .catch((err: unknown) => {
                if (active) setLoadError(err instanceof Error ? err.message : "Unable to load orders.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
            // Close the detail panel when leaving the page.
            clearPanel();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const currency = orders[0]?.currencyCode ?? "USD";

    const filteredOrders = useMemo(() => {
        const query = filteringText.trim().toLocaleLowerCase();
        if (!query) return orders;
        return orders.filter((o) =>
            [o.id, o.payerName, o.payerEmail, o.userEmail, o.status, o.captureId].some((v) =>
                v.toLocaleLowerCase().includes(query),
            ),
        );
    }, [filteringText, orders]);

    const pageCount = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
    const pageOrders = filteredOrders.slice(
        (currentPageIndex - 1) * PAGE_SIZE,
        currentPageIndex * PAGE_SIZE,
    );

    const openDetail = (order: MerchantOrder) => {
        setSelectedId(order.id);
        showPanel({
            header: `Order ${order.id}`,
            content: <OrderDetail order={order} />,
        });
    };

    const totalRevenue = sumValues(orders, "grandTotal");
    const totalFees = sumValues(orders, "platformFee");

    return (
        <SpaceBetween size="l">
            {loadError && (
                <Alert type="error" header="Unable to load transactions">
                    {loadError}
                </Alert>
            )}

            {/* ── Summary metrics ─────────────────────────────────────────── */}
            <Container
                header={
                    <Header variant="h2" description="A snapshot of orders placed through your AI store.">
                        Overview
                    </Header>
                }
            >
                <ColumnLayout columns={3} variant="text-grid">
                    <MetricCard label="Total orders" value={loading ? "—" : String(orders.length)} />
                    <MetricCard
                        label="Total revenue"
                        value={loading ? "—" : formatCurrency(String(totalRevenue), currency)}
                    />
                    <MetricCard
                        label="Platform fees collected"
                        value={loading ? "—" : formatCurrency(String(totalFees), currency)}
                    />
                </ColumnLayout>
            </Container>

            {/* ── Orders table ────────────────────────────────────────────── */}
            <Table<MerchantOrder>
                variant="container"
                selectionType="single"
                trackBy="id"
                loading={loading}
                loadingText="Loading orders"
                items={pageOrders}
                selectedItems={pageOrders.filter((o) => o.id === selectedId)}
                onSelectionChange={({ detail }) => {
                    const order = detail.selectedItems[0];
                    if (order) openDetail(order);
                }}
                onRowClick={({ detail }) => openDetail(detail.item)}
                columnDefinitions={[
                    {
                        id: "id",
                        header: "Order ID",
                        cell: (o) => o.id,
                        isRowHeader: true,
                    },
                    {
                        id: "customer",
                        header: "Customer",
                        cell: (o) => o.payerName || o.payerEmail || o.userEmail || "—",
                    },
                    {
                        id: "items",
                        header: "Items",
                        cell: (o) =>
                            o.items.length === 0
                                ? "—"
                                : o.items.length === 1
                                  ? o.items[0].name
                                  : `${o.items[0].name} +${o.items.length - 1} more`,
                    },
                    {
                        id: "amount",
                        header: "Amount",
                        cell: (o) => formatCurrency(o.grandTotal, o.currencyCode),
                    },
                    {
                        id: "fee",
                        header: "Platform fee",
                        cell: (o) => formatCurrency(o.platformFee, o.currencyCode),
                    },
                    {
                        id: "status",
                        header: "Status",
                        cell: (o) => (
                            <StatusIndicator type={statusType(o.status)}>
                                {o.status || "—"}
                            </StatusIndicator>
                        ),
                    },
                    {
                        id: "date",
                        header: "Date",
                        cell: (o) => formatDate(o.createdAt),
                    },
                ]}
                empty={
                    <Box margin={{ vertical: "xs" }} textAlign="center" color="inherit">
                        <SpaceBetween size="m">
                            <b>{filteringText ? "No matching orders" : "No orders yet"}</b>
                            <Box variant="p" color="inherit">
                                {filteringText
                                    ? "Try a different search."
                                    : "When a shopper checks out through your AI store, the order shows up here."}
                            </Box>
                        </SpaceBetween>
                    </Box>
                }
                filter={
                    <TextFilter
                        filteringPlaceholder="Find orders by ID, customer, or status"
                        filteringText={filteringText}
                        onChange={({ detail }) => {
                            setFilteringText(detail.filteringText);
                            setCurrentPageIndex(1);
                        }}
                        countText={`${filteredOrders.length} ${filteredOrders.length === 1 ? "match" : "matches"}`}
                    />
                }
                header={
                    <Header
                        variant="h1"
                        counter={loading ? undefined : `(${orders.length})`}
                        description="Every order your AI store has processed through PayPal, with fees and payout details."
                    >
                        Orders
                    </Header>
                }
                pagination={
                    <Pagination
                        currentPageIndex={currentPageIndex}
                        pagesCount={pageCount}
                        onChange={({ detail }) => setCurrentPageIndex(detail.currentPageIndex)}
                    />
                }
            />
        </SpaceBetween>
    );
}

function MetricCard({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <Box variant="awsui-key-label">{label}</Box>
            <Box variant="h2" padding="n">
                {value}
            </Box>
        </div>
    );
}

// ── Bottom split-panel detail ─────────────────────────────────────────────
function OrderDetail({ order }: { order: MerchantOrder }) {
    return (
        <SpaceBetween size="l">
            <ColumnLayout columns={3} variant="text-grid">
                <KeyValuePairs
                    columns={1}
                    items={[
                        { label: "Order ID", value: order.id },
                        {
                            label: "Status",
                            value: (
                                <StatusIndicator type={statusType(order.status)}>
                                    {order.status || "—"}
                                </StatusIndicator>
                            ),
                        },
                        { label: "Date", value: formatDate(order.createdAt) },
                    ]}
                />
                <KeyValuePairs
                    columns={1}
                    items={[
                        { label: "Customer", value: order.payerName || "—" },
                        { label: "Payer email", value: order.payerEmail || order.userEmail || "—" },
                        { label: "Capture ID", value: order.captureId || "—" },
                    ]}
                />
                <KeyValuePairs
                    columns={1}
                    items={[
                        { label: "Item total", value: formatCurrency(order.itemTotal, order.currencyCode) },
                        { label: "Platform fee", value: formatCurrency(order.platformFee, order.currencyCode) },
                        { label: "Grand total", value: formatCurrency(order.grandTotal, order.currencyCode) },
                    ]}
                />
            </ColumnLayout>

            <Table<MerchantOrder["items"][number]>
                variant="embedded"
                header={<Header variant="h3">Items</Header>}
                items={order.items}
                trackBy="name"
                columnDefinitions={[
                    { id: "name", header: "Product", cell: (it) => it.name || "—", isRowHeader: true },
                    { id: "sku", header: "SKU", cell: (it) => it.sku || "—" },
                    { id: "category", header: "Category", cell: (it) => it.category || "—" },
                    { id: "qty", header: "Qty", cell: (it) => it.quantity || "—" },
                    {
                        id: "unit",
                        header: "Unit price",
                        cell: (it) => formatCurrency(it.unitAmount, order.currencyCode),
                    },
                ]}
                empty="No items recorded for this order."
            />
        </SpaceBetween>
    );
}
