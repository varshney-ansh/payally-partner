"use client";

import { useRef, useState } from "react";
import { Amplify } from "aws-amplify";
import { confirmSignIn, signIn } from "aws-amplify/auth";
import {
    Alert,
    Box,
    Button,
    ButtonDropdown,
    Container,
    Divider,
    ExpandableSection,
    Form,
    FormField,
    Header,
    Icon,
    Input,
    SpaceBetween,
} from "@cloudscape-design/components";
import Link from "next/link";
import { useRouter } from "next/navigation";
import outputs from "../../../amplify_outputs.json";

Amplify.configure(outputs, { ssr: true });

type SigninStage = "email" | "code";
type Notice = { type: "error" | "success" | "info"; message: string };

const authErrorMessages: Record<string, string> = {
    CodeMismatchException: "That code doesn't match. Check the email and try again.",
    ExpiredCodeException: "That code has expired. Request a new one to continue.",
    LimitExceededException: "Too many attempts. Wait a little while before trying again.",
    NotAuthorizedException: "The email, password, or verification code is incorrect. Check your details and try again.",
    UserNotConfirmedException: "This email hasn't been verified yet. Finish verifying your account before signing in.",
    UserNotFoundException: "We couldn't find an account with that email. Create a Payally Partner account first.",
    InvalidParameterException: "Email verification codes aren't enabled for this environment yet. Please contact support.",
};

function getAuthErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return authErrorMessages[error.name] ?? error.message ?? "Sign-in failed. Please try again.";
    }
    return "An unexpected sign-in error occurred. Please try again.";
}

export default function SigninClientComponent() {
    const router = useRouter();
    const [stage, setStage] = useState<SigninStage>("email");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [notice, setNotice] = useState<Notice | null>(null);
    const loadingRef = useRef(false);

    const withLoading = async (action: () => Promise<void>) => {
        if (loadingRef.current) return;

        loadingRef.current = true;
        setIsLoading(true);
        setNotice(null);
        try {
            await action();
        } catch (error) {
            setNotice({ type: "error", message: getAuthErrorMessage(error) });
        } finally {
            loadingRef.current = false;
            setIsLoading(false);
        }
    };

    const redirectToDashboard = () => {
        setPassword("");
        router.replace("/dashboard");
        router.refresh();
    };

    const requestEmailCode = async (address: string) => {
        const result = await signIn({
            username: address,
            password,
        });

        if (result.isSignedIn) {
            redirectToDashboard();
            return;
        }

        if (result.nextStep.signInStep !== "CONFIRM_SIGN_IN_WITH_EMAIL_CODE") {
            if (result.nextStep.signInStep === "CONFIRM_SIGN_UP") {
                throw new Error("Verify your email address from the signup flow before signing in.");
            }
            throw new Error("This account needs another sign-in step. Please contact support.");
        }

        setStage("code");
        setCode("");
    };

    const handleSendCode = () => withLoading(async () => {
        const normalizedEmail = email.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            setNotice({ type: "error", message: "Enter a valid email address." });
            return;
        }
        if (!password) {
            setNotice({ type: "error", message: "Enter your password." });
            return;
        }

        setEmail(normalizedEmail);
        await requestEmailCode(normalizedEmail);
        setNotice({ type: "info", message: `A sign-in code was sent to ${normalizedEmail}.` });
    });

    const handleVerifyCode = () => withLoading(async () => {
        const normalizedCode = code.trim();
        if (!/^\d{6}$/.test(normalizedCode)) {
            setNotice({ type: "error", message: "Enter the 6-digit code from your email." });
            return;
        }

        const result = await confirmSignIn({ challengeResponse: normalizedCode });
        if (result.isSignedIn) {
            redirectToDashboard();
            return;
        }

        if (result.nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_EMAIL_CODE") {
            setNotice({ type: "info", message: "Enter the code sent to your email to continue." });
            return;
        }

        throw new Error("We couldn't complete sign-in. Please request a new code and try again.");
    });

    const handleResendCode = () => withLoading(async () => {
        await requestEmailCode(email);
        setNotice({ type: "success", message: `A new sign-in code was sent to ${email}.` });
    });

    const handleKeyDown = (
        event: CustomEvent<{ key: string }>,
        action: () => void,
    ) => {
        if (event.detail.key === "Enter") action();
    };

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
                            <Button variant="primary" onClick={() => router.push("/signup")}>
                                Sign up
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
                    {notice && (
                        <Alert
                            type={notice.type}
                            dismissible
                            onDismiss={() => setNotice(null)}
                        >
                            {notice.message}
                        </Alert>
                    )}
                    <Container className="signupFormContainer">
                        <Form
                            header={
                                <span className="signupTitle">
                                    {stage === "email" ? "Signin for Payally" : "Check your email"}
                                </span>
                            }
                            actions={null}
                        >
                            <SpaceBetween size="l">

                                {stage === "email" ? (
                                    <SpaceBetween size="s">
                                        <FormField label="Email">
                                            <Input
                                                id="email-address"
                                                value={email}
                                                onChange={({ detail }) => setEmail(detail.value)}
                                                onKeyDown={(event) => handleKeyDown(event, handleSendCode)}
                                                placeholder="you@example.com"
                                                autoComplete="email"
                                                type="email"
                                                disabled={isLoading}
                                            />
                                        </FormField>
                                        <FormField label="Password">
                                            <Input
                                                id="password"
                                                value={password}
                                                onChange={({ detail }) => setPassword(detail.value)}
                                                onKeyDown={(event) => handleKeyDown(event, handleSendCode)}
                                                placeholder="Enter your password"
                                                autoComplete="current-password"
                                                type="password"
                                                disabled={isLoading}
                                            />
                                        </FormField>
                                        <Button
                                            variant="primary"
                                            fullWidth
                                            data-testid="continue-email-button"
                                            loading={isLoading}
                                            onClick={handleSendCode}
                                        >
                                            Continue
                                        </Button>
                                    </SpaceBetween>
                                ) : (
                                    <SpaceBetween size="s">
                                        <Box color="text-body-secondary">
                                            Enter the 6-digit code sent to <strong>{email}</strong>.
                                        </Box>
                                        <FormField label="Email verification code">
                                            <Input
                                                id="email-otp-code"
                                                value={code}
                                                onChange={({ detail }) => setCode(detail.value.replace(/\D/g, "").slice(0, 6))}
                                                onKeyDown={(event) => handleKeyDown(event, handleVerifyCode)}
                                                placeholder="000000"
                                                autoComplete="one-time-code"
                                                inputMode="numeric"
                                                type="text"
                                                disabled={isLoading}
                                            />
                                        </FormField>
                                        <Button
                                            variant="primary"
                                            fullWidth
                                            data-testid="verify-email-code-button"
                                            loading={isLoading}
                                            onClick={handleVerifyCode}
                                        >
                                            Verify and sign in
                                        </Button>
                                        <SpaceBetween direction="horizontal" size="xs">
                                            <Button variant="link" disabled={isLoading} onClick={handleResendCode}>
                                                Resend code
                                            </Button>
                                            <Button
                                                variant="link"
                                                disabled={isLoading}
                                                onClick={() => {
                                                    setStage("email");
                                                    setCode("");
                                                    setPassword("");
                                                    setNotice(null);
                                                }}
                                            >
                                                Change email
                                            </Button>
                                        </SpaceBetween>
                                    </SpaceBetween>
                                )}

                                <Box fontSize="body-m" color="text-body-secondary">
                                    By continuing and signing to Payally Partner, you agree to the{" "}
                                    <Link href="#">Payally Customer Agreement</Link>.
                                </Box>

                                <Divider />

                                <ExpandableSection headerText="Start accepting payments in AI Clients" defaultExpanded>
                                    Payally makes it easy to accept payments right inside your customer&apos;s AI Clients like Claude Desktop.
                                    AI Clients helps a customer buy something, it talks directly to Payally to handle the money safely.
                                    There&apos;s no need to write code for accept payments, we&apos;ll do it in a better way.
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
                                        <Link href="https://paypal.com">
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
