"use client";

import { Amplify } from "aws-amplify";
import { confirmSignUp, resendSignUpCode, signIn, signUp } from "aws-amplify/auth";
import {
    Box,
    Button,
    ButtonDropdown,
    Container,
    Flashbar,
    type FlashbarProps,
    FormField,
    Header,
    Icon,
    Input,
    Select,
    type SelectProps,
    SpaceBetween,
} from "@cloudscape-design/components";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import outputs from "../../../../amplify_outputs.json";

Amplify.configure(outputs);

type Props = {
    email: string;
    paypalMerchantId: string;
};

type SignupStage = "account" | "verification";

const businessTypeOptions = [
    { label: "Individual / Sole Proprietorship", value: "INDIVIDUAL" },
    { label: "Partnership", value: "PARTNERSHIP" },
    { label: "Corporation (Private or Public)", value: "CORPORATION" },
    { label: "Non-Profit Organization", value: "NON_PROFIT" },
    { label: "Government Entity", value: "GOVERNMENT" },
] satisfies SelectProps.Options;

const authErrorMessages: Record<string, string> = {
    CodeMismatchException: "That verification code is incorrect. Check it and try again.",
    ExpiredCodeException: "That verification code has expired. Request a new code.",
    LimitExceededException: "Too many attempts. Wait a while before trying again.",
    NotAuthorizedException: "The verification code was rejected. Request a new code and try again.",
    UsernameExistsException: "An account with this email already exists. Please sign in instead.",
    UserNotFoundException: "No pending signup was found for this email. Start the PayPal signup again.",
    UserNotConfirmedException: "Your account is not verified yet. Complete email verification first.",
};

function getAuthErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return authErrorMessages[error.name] ?? error.message ?? "Authentication failed. Please try again.";
    }
    return "An unexpected authentication error occurred. Please try again.";
}

export default function AuthorizeSignupForm({ email, paypalMerchantId }: Props) {
    const router = useRouter();
    const [stage, setStage] = useState<SignupStage>("account");
    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");
    const [businessType, setBusinessType] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [flashMessage, setFlashMessage] = useState<FlashbarProps.MessageDefinition | null>(null);
    const loadingRef = useRef(false);

    const showMessage = (type: "error" | "info" | "success", content: string) => {
        setFlashMessage({
            type,
            content,
            dismissible: true,
            dismissLabel: "Dismiss message",
            onDismiss: () => setFlashMessage(null),
        });
    };

    const withLoading = async (action: () => Promise<void>) => {
        if (loadingRef.current) return;

        loadingRef.current = true;
        setIsLoading(true);
        try {
            await action();
        } finally {
            loadingRef.current = false;
            setIsLoading(false);
        }
    };

    const signInAndRedirect = async () => {
        const result = await signIn({ username: email, password });
        if (!result.isSignedIn) {
            showMessage("success", "Your account is verified. Please sign in to continue.");
            router.replace("/signin");
            return;
        }

        router.replace("/dashboard");
        router.refresh();
    };

    const createAccount = () => withLoading(async () => {
        const name = fullName.trim();
        if (!name) {
            showMessage("error", "Enter your full name.");
            return;
        }
        if (password.length < 8) {
            showMessage("error", "Your password must contain at least 8 characters.");
            return;
        }
        if (!businessType) {
            showMessage("error", "Select your business type.");
            return;
        }

        setFlashMessage(null);
        try {
            const result = await signUp({
                username: email,
                password,
                options: {
                    userAttributes: {
                        email,
                        name,
                        "custom:businessType": businessType,
                        "custom:custom:paypalMerchId": paypalMerchantId,
                    },
                },
            });

            if (result.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
                setStage("verification");
                showMessage("info", `A verification code was sent to ${email}.`);
                return;
            }

            if (result.isSignUpComplete) {
                await signInAndRedirect();
                return;
            }

            showMessage("error", "Signup could not continue. Please try again.");
        } catch (error) {
            showMessage("error", getAuthErrorMessage(error));
        }
    });

    const confirmEmail = () => withLoading(async () => {
        if (!/^\d{6}$/.test(verificationCode.trim())) {
            showMessage("error", "Enter the 6-digit verification code.");
            return;
        }

        setFlashMessage(null);
        try {
            const result = await confirmSignUp({
                username: email,
                confirmationCode: verificationCode.trim(),
            });
            if (!result.isSignUpComplete) {
                showMessage("error", "Email verification is not complete. Please try again.");
                return;
            }

            await signInAndRedirect();
        } catch (error) {
            showMessage("error", getAuthErrorMessage(error));
        }
    });

    const resendCode = () => withLoading(async () => {
        setFlashMessage(null);
        try {
            await resendSignUpCode({ username: email });
            showMessage("success", `A new verification code was sent to ${email}.`);
        } catch (error) {
            showMessage("error", getAuthErrorMessage(error));
        }
    });

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
                            <Button variant="primary" onClick={() => router.push('/signin')}>
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
                <Box display="inline-block" textAlign="left" className="maxWith-640 minWidth-340">
                    {flashMessage && <Flashbar items={[flashMessage]} />}
                    <Container className="signupFormContainer paddingTop-20" header={<Header variant="h2" className="span-font-size-xxx">Create your account</Header>}>
                        {stage === "account" ? (
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    void createAccount();
                                }}
                            >
                                <SpaceBetween size="m">
                                    <FormField label="Email">
                                        <Input value={email} type="email" disabled />
                                    </FormField>
                                    <FormField label="Full name">
                                        <Input
                                            value={fullName}
                                            autoComplete="name"
                                            onChange={({ detail }) => setFullName(detail.value)}
                                        />
                                    </FormField>
                                    <FormField label="Password" description="Use at least 8 characters.">
                                        <Input
                                            value={password}
                                            type="password"
                                            autoComplete="new-password"
                                            onChange={({ detail }) => setPassword(detail.value)}
                                        />
                                    </FormField>
                                    <FormField label="Business type">
                                        <Select
                                            selectedOption={
                                                businessTypeOptions.find((option) => option.value === businessType) ?? null
                                            }
                                            options={businessTypeOptions}
                                            onChange={({ detail }) => setBusinessType(detail.selectedOption.value ?? "")}
                                            placeholder="Select your business type"
                                        />
                                    </FormField>
                                    <Button variant="primary" fullWidth loading={isLoading}>
                                        Create account
                                    </Button>
                                </SpaceBetween>
                            </form>
                        ) : (
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    void confirmEmail();
                                }}
                            >
                                <SpaceBetween size="m">
                                    <Box>
                                        Enter the verification code sent to <strong>{email}</strong>.
                                    </Box>
                                    <FormField label="Verification code">
                                        <Input
                                            value={verificationCode}
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            onChange={({ detail }) => setVerificationCode(detail.value)}
                                        />
                                    </FormField>
                                    <Button variant="primary" fullWidth loading={isLoading}>
                                        Verify email
                                    </Button>
                                    <Button variant="link" onClick={() => void resendCode()} loading={isLoading}>
                                        Resend code
                                    </Button>
                                </SpaceBetween>
                            </form>
                        )}
                    </Container>
                </Box>
            </Box>
        </Box>
    );
}
