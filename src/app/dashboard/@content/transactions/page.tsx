"use client";

import { Header, StatusIndicator, Table } from "@cloudscape-design/components";

const transactions = [
    {
        id: "PAY-20261020-001",
        customer: "Alex Morgan",
        amount: "$49.00",
        status: "Completed",
        date: "Oct 20, 2026",
    },
];

export default function TransactionsPage() {
    return (
        <Table
            header={
                <Header variant="h1" description="Recent payments processed through your PayPal merchant account.">
                    Transactions
                </Header>
            }
            items={transactions}
            trackBy="id"
            columnDefinitions={[
                { id: "id", header: "Transaction ID", cell: (item) => item.id },
                { id: "customer", header: "Customer", cell: (item) => item.customer },
                { id: "amount", header: "Amount", cell: (item) => item.amount },
                {
                    id: "status",
                    header: "Status",
                    cell: (item) => <StatusIndicator type="success">{item.status}</StatusIndicator>,
                },
                { id: "date", header: "Date", cell: (item) => item.date },
            ]}
            empty={<p>No transactions found.</p>}
        />
    );
}
