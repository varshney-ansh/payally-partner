/* eslint-disable react/no-unescaped-entities */
"use client"
import { Amplify } from "aws-amplify";
import { Box, Button, ButtonDropdown, Container, Divider, ExpandableSection, Form, Header, Icon, Link, SpaceBetween } from "@cloudscape-design/components";
import { useRouter } from "next/navigation";
import outputs from "../../../amplify_outputs.json";
import PaypalSignupButton from "@/components/custom/paypalSignupButton";

Amplify.configure(outputs);

export default function SignupClient({
    paypalSignup,
}: {
    paypalSignup: { referralUrl: string; sellerNonce: string } | null;
}) {
    const router = useRouter();

    return (
        <Box>
            <Header
                variant="awsui-h1-sticky"
                actions={
                    <Box padding={{ horizontal: "l", vertical: "s" }}>
                        <SpaceBetween direction="horizontal" size="xs" alignItems="center">
                            <ButtonDropdown
                                items={[
                                    { id: "en", text: "English" },
                                    { id: "es", text: "Español" },
                                    { id: "fr", text: "Français" },
                                    { id: "de", text: "Deutsch" },
                                ]}
                            >
                                <Icon name="globe" /> English
                            </ButtonDropdown>
                            <Button variant="primary" onClick={() => router.push("/signin")}>
                                Sign in
                            </Button>
                        </SpaceBetween>
                    </Box>
                }
            >
                <Box padding={{ horizontal: "l", vertical: "s" }}>
                    <SpaceBetween direction="horizontal" size="xxxs">
                        <Box variant="h3" padding="n" fontWeight="bold" fontSize="heading-l">
                            Payally
                        </Box>
                        <Box variant="h3" padding="n" fontWeight="normal" fontSize="heading-l">
                            Partner
                        </Box>
                    </SpaceBetween>
                </Box>
            </Header>
            <Box textAlign="center" padding={{ vertical: "l" }}>
                <Box display="inline-block" textAlign="left" className="maxWith-640">
                    <Container className="signupFormContainer">
                        <Form
                            header={
                                <span className="signupTitle">
                                    Sign up for Payally
                                </span>
                            }
                            actions={null}
                        >
                            <SpaceBetween size="l">
                                <Box padding={'xxs'}>
                                    {/* PaypalBUtton  */}
                                    {paypalSignup ? (
                                        <PaypalSignupButton
                                            sellerNonce={paypalSignup.sellerNonce}
                                            referralLink={paypalSignup.referralUrl}
                                        />
                                    ) : (
                                        <Box color="text-status-inactive">
                                            PayPal signup is temporarily unavailable. You can still sign up with your email.
                                        </Box>
                                    )}
                                </Box>

                                {/* Legal / Terms Text */}
                                <Box fontSize="body-m" color="text-body-secondary">
                                    By continuing and signing up to Payally Partner, you agree to the{" "}
                                    <Link external href="#">Payally Customer Agreement</Link>.
                                </Box>

                                <Divider />

                                {/* Help Panel / Info Collapsible */}
                                <ExpandableSection headerText="Start accepting payments in AI Clients" defaultExpanded>
                                    Payally makes it easy to accept payments right inside your customer's AI Clients like Claude Desktop.
                                    AI Clients helps a customer buy something, it talks directly to Payally to handle the money safely.
                                    There's No need to write code for accept payments, we'll do it in a better way.
                                </ExpandableSection>

                                <Divider />

                                <ExpandableSection
                                    headerText="What do I need before connecting PayPal?"
                                    defaultExpanded
                                >
                                    <SpaceBetween size="s">
                                        <Box>
                                            <strong>Existing PayPal Merchants:</strong> You can authorize your account after PayPal OAuth is configured.
                                        </Box>
                                        <Box>
                                            <strong>New to PayPal?</strong> You can create a PayPal Business Account separately, then connect it after the integration is available.
                                        </Box>
                                        <Link external href="https://paypal.com">
                                            You can also signup on paypal and get verified
                                        </Link>
                                    </SpaceBetween>
                                </ExpandableSection>
                            </SpaceBetween>
                        </Form>
                    </Container>
                </Box>
            </Box>
        </Box>
    );
}