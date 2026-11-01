"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Container,
    Header,
    KeyValuePairs,
    Pagination,
    SpaceBetween,
    Table,
    TextFilter,
} from "@cloudscape-design/components";
import { useSplitPanel } from "../../split-panel-context";
import {
    formatCustomerDate,
    formatShipping,
    loadMerchantCustomers,
} from "@/lib/merchant-customers";
import type { MerchantCustomer } from "@/lib/merchant-customers";

const PAGE_SIZE = 15;

export default function CustomersPage() {
    const { showPanel, clearPanel } = useSplitPanel();

    const [customers, setCustomers] = useState<MerchantCustomer[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [filteringText, setFilteringText] = useState("");
    const [currentPageIndex, setCurrentPageIndex] = useState(1);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        loadMerchantCustomers()
            .then((data) => {
                if (active) setCustomers(data);
            })
            .catch((err: unknown) => {
                if (active)
                    setLoadError(err instanceof Error ? err.message : "Unable to load customers.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
            clearPanel();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredCustomers = useMemo(() => {
        const query = filteringText.trim().toLocaleLowerCase();
        if (!query) return customers;
        return customers.filter((c) =>
            [c.name, c.email, c.payerId, c.consumerType].some((v) =>
                v.toLocaleLowerCase().includes(query),
            ),
        );
    }, [filteringText, customers]);

    const pageCount = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
    const pageCustomers = filteredCustomers.slice(
        (currentPageIndex - 1) * PAGE_SIZE,
        currentPageIndex * PAGE_SIZE,
    );

    const openDetail = (customer: MerchantCustomer) => {
        setSelectedId(customer.id);
        showPanel({
            header: customer.name || customer.email || "Customer",
            content: <CustomerDetail customer={customer} />,
        });
    };

    const withShipping = customers.filter((c) => c.shipping).length;

    return (
        <SpaceBetween size="l">
            {loadError && (
                <Alert type="error" header="Unable to load customers">
                    {loadError}
                </Alert>
            )}

            {/* ── Summary metrics ─────────────────────────────────────────── */}
            <Container
                header={
                    <Header
                        variant="h2"
                        description="Shoppers who authorized PayPal at your AI store."
                    >
                        Overview
                    </Header>
                }
            >
                <SpaceBetween direction="horizontal" size="xxl">
                    <MetricCard
                        label="Saved payment methods"
                        value={loading ? "—" : String(customers.length)}
                    />
                    <MetricCard
                        label="Shipping address on file"
                        value={loading ? "—" : String(withShipping)}
                    />
                </SpaceBetween>
            </Container>

            {/* ── Customers table ─────────────────────────────────────────── */}
            <Table<MerchantCustomer>
                variant="container"
                selectionType="single"
                trackBy="id"
                loading={loading}
                loadingText="Loading customers"
                items={pageCustomers}
                selectedItems={pageCustomers.filter((c) => c.id === selectedId)}
                onSelectionChange={({ detail }) => {
                    const customer = detail.selectedItems[0];
                    if (customer) openDetail(customer);
                }}
                onRowClick={({ detail }) => openDetail(detail.item)}
                columnDefinitions={[
                    {
                        id: "name",
                        header: "Customer",
                        cell: (c) => c.name || "—",
                        isRowHeader: true,
                    },
                    {
                        id: "email",
                        header: "Email",
                        cell: (c) => c.email || "—",
                    },
                    {
                        id: "type",
                        header: "Type",
                        cell: (c) => c.consumerType || "—",
                    },
                    {
                        id: "shipping",
                        header: "Shipping",
                        cell: (c) => formatShipping(c.shipping),
                    },
                    {
                        id: "date",
                        header: "Added",
                        cell: (c) => formatCustomerDate(c.createdAt),
                    },
                ]}
                empty={
                    <Box margin={{ vertical: "xs" }} textAlign="center" color="inherit">
                        <SpaceBetween size="m">
                            <b>{filteringText ? "No matching customers" : "No customers yet"}</b>
                            <Box variant="p" color="inherit">
                                {filteringText
                                    ? "Try a different search."
                                    : "Once a shopper authorizes PayPal at checkout, their details appear here."}
                            </Box>
                        </SpaceBetween>
                    </Box>
                }
                filter={
                    <TextFilter
                        filteringPlaceholder="Find customers by name, email, or type"
                        filteringText={filteringText}
                        onChange={({ detail }) => {
                            setFilteringText(detail.filteringText);
                            setCurrentPageIndex(1);
                        }}
                        countText={`${filteredCustomers.length} ${filteredCustomers.length === 1 ? "match" : "matches"}`}
                    />
                }
                header={
                    <Header
                        variant="h1"
                        counter={loading ? undefined : `(${customers.length})`}
                        description="Shoppers who saved a PayPal payment method with your store."
                    >
                        Customers
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
function CustomerDetail({ customer }: { customer: MerchantCustomer }) {
    const s = customer.shipping;
    return (
        <SpaceBetween size="l">
            <KeyValuePairs
                columns={3}
                items={[
                    { label: "Name", value: customer.name || "—" },
                    { label: "Email", value: customer.email || "—" },
                    { label: "Customer type", value: customer.consumerType || "—" },
                    { label: "PayPal customer ID", value: customer.paypalCustomerId || "—" },
                    { label: "Payer ID", value: customer.payerId || "—" },
                    { label: "Added", value: formatCustomerDate(customer.createdAt) },
                ]}
            />

            <Container header={<Header variant="h3">Shipping address</Header>}>
                {s ? (
                    <KeyValuePairs
                        columns={2}
                        items={[
                            { label: "Recipient", value: s.name || "—" },
                            { label: "Address", value: s.addressLineOne || "—" },
                            { label: "City", value: s.city || "—" },
                            { label: "State", value: s.state || "—" },
                            { label: "Postal code", value: s.zip || "—" },
                            { label: "Country", value: s.country || "—" },
                        ]}
                    />
                ) : (
                    <Box color="text-body-secondary">No shipping address on file.</Box>
                )}
            </Container>
        </SpaceBetween>
    );
}
