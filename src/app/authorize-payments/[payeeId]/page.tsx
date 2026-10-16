type Props = {
  params: Promise<{ payeeId: string }>;
};

export default async function AuthorizePaymentsPage({ params }: Props) {
  const { payeeId } = await params;
    return (
        <div>
            <h1>Authorize Payments for Payee ID: {payeeId}</h1>
            <p>Please authorize payments for the payee by clicking the button below.</p>
        </div>
    );
}
