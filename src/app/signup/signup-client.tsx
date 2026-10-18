/* eslint-disable react/no-unescaped-entities */
"use client"
import { Amplify } from "aws-amplify";
import { confirmSignUp, resendSignUpCode, signUp } from "aws-amplify/auth";
import { Box, Button, ButtonDropdown, Container, Divider, ExpandableSection, Flashbar, FlashbarProps, Form, FormField, Header, Icon, Input, InputProps, Link, Select, SelectProps, SpaceBetween, StatusIndicator } from "@cloudscape-design/components";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, FieldPath, FormProvider, useForm, useFormContext } from "react-hook-form";
import { useRef, useState } from "react";
import { z } from "zod";
import outputs from "../../../amplify_outputs.json";
import PaypalSignupButton from "@/components/custom/paypalSignupButton";

Amplify.configure(outputs);

const signupSchema = z.object({
    email: z.string().trim().email("Enter a valid email address."),
    fullName: z.string().trim().min(1, "Enter your full name."),
    password: z.string().regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
        "Use at least 8 characters with uppercase and lowercase letters, a number, and a symbol.",
    ),
    businessType: z.string().min(1, "Select a business type."),
    emailAuthCode: z.string().regex(/^\d{6}$/, "Enter the 6-digit verification code."),
});

type SignupFormValues = z.infer<typeof signupSchema>;
type TextFieldName = Exclude<FieldPath<SignupFormValues>, "businessType">;
type SignupStep = 0 | 1 | 2 | 3;

const businessTypeOptions = [
    { label: "Individual / Sole Proprietorship", value: "INDIVIDUAL" },
    { label: "Partnership", value: "PARTNERSHIP" },
    { label: "Corporation (Private or Public)", value: "CORPORATION" },
    { label: "Non-Profit Organization", value: "NON_PROFIT" },
    { label: "Government Entity", value: "GOVERNMENT" },
] satisfies SelectProps.Options;

const authErrorMessages: Record<string, string> = {
    CodeMismatchException: "That verification code is incorrect. Check the code and try again.",
    ExpiredCodeException: "That verification code has expired. Request a new code and try again.",
    LimitExceededException: "Too many attempts. Wait a while before trying again.",
    NotAuthorizedException: "This account cannot be confirmed. Try signing in or request a new code.",
    UsernameExistsException: "An account with this email already exists. Try signing in instead.",
    UserNotFoundException: "No pending signup was found for this email. Start signup again.",
    UserNotConfirmedException: "This account has not been confirmed yet. Complete email verification first.",
};

function getAuthErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return authErrorMessages[error.name] ?? (error.message || "Authentication failed. Please try again.");
    }
    return "An unexpected authentication error occurred. Please try again.";
}

function TextField({
    name,
    label,
    type = "text",
    autoComplete,
    hint,
    controlId,
    dataTestId,
}: {
    name: TextFieldName;
    label: string;
    type?: InputProps.Type;
    autoComplete?: string;
    hint?: string;
    controlId?: string;
    dataTestId?: string;
}) {
    const { control, formState: { errors } } = useFormContext<SignupFormValues>();

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <FormField label={label} errorText={errors[name]?.message} constraintText={hint}>
                    <Input
                        id={controlId ?? name}
                        value={field.value}
                        onChange={({ detail }) => field.onChange(detail.value)}
                        onBlur={field.onBlur}
                        type={type}
                        autoComplete={autoComplete}
                        data-testid={dataTestId}
                    />
                </FormField>
            )}
        />
    );
}

export default function SignupClient({
    paypalSignup,
}: {
    paypalSignup: { referralUrl: string; sellerNonce: string } | null;
}) {
    const router = useRouter();
    const [stepperIndex, setStepperIndex] = useState<SignupStep>(0);
    const [isLoading, setIsLoading] = useState(false);
    const [flashMessage, setFlashMessage] = useState<FlashbarProps.MessageDefinition | null>(null);
    const loadingRef = useRef(false);
    const methods = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        mode: "onTouched",
        defaultValues: {
            email: "",
            fullName: "",
            password: "",
            businessType: "",
            emailAuthCode: "",
        },
    });
    const { control, setError, trigger, watch, formState: { errors } } = methods;
    const email = watch("email");

    const withLoading = async (action: () => void | Promise<void>) => {
        if (loadingRef.current) {
            return;
        }

        loadingRef.current = true;
        setIsLoading(true);
        try {
            await action();
        } finally {
            loadingRef.current = false;
            setIsLoading(false);
        }
    };

    const showFlashMessage = (type: "error" | "info" | "success", content: string) => {
        setFlashMessage({
            type,
            content,
            dismissible: true,
            dismissLabel: "Dismiss message",
            onDismiss: () => setFlashMessage(null),
        });
    };

    const continueToStep = (fields: (keyof SignupFormValues)[], nextStep: SignupStep) => withLoading(async () => {
        if (!(await trigger(fields))) {
            showFlashMessage("error", "Please fix the highlighted fields before continuing.");
            return;
        }

        setFlashMessage(null);
        setStepperIndex(nextStep);
    });

    const createAccount = () => withLoading(async () => {
        if (!(await trigger(["fullName", "password", "businessType"]))) {
            showFlashMessage("error", "Please fix the highlighted fields before continuing.");
            return;
        }

        const values = methods.getValues();
        setFlashMessage(null);

        try {
            const result = await signUp({
                username: values.email.trim(),
                password: values.password,
                options: {
                    userAttributes: {
                        email: values.email.trim(),
                        name: values.fullName.trim(),
                        "custom:businessType": values.businessType,
                    },
                },
            });

            if (result.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
                setStepperIndex(2);
                setFlashMessage(null);
                return;
            }

            if (result.isSignUpComplete) {
                setStepperIndex(3);
                showFlashMessage("success", "Your account has been created.");
                return;
            }

            showFlashMessage("error", "Signup could not continue. Please try again.");
        } catch (error) {
            showFlashMessage("error", getAuthErrorMessage(error));
        }
    });

    const confirmEmail = () => withLoading(async () => {
        if (!(await trigger("emailAuthCode"))) {
            showFlashMessage("error", "Enter the 6-digit verification code.");
            return;
        }

        const username = methods.getValues("email").trim();
        const confirmationCode = methods.getValues("emailAuthCode").trim();
        setFlashMessage(null);

        try {
            const result = await confirmSignUp({ username, confirmationCode });
            if (!result.isSignUpComplete) {
                showFlashMessage("error", "Email confirmation is not complete. Please follow the next signup step.");
                return;
            }

            setStepperIndex(3);
            showFlashMessage("success", "Your email is verified. Your account is ready.");
        } catch (error) {
            const message = getAuthErrorMessage(error);
            if (error instanceof Error && ["CodeMismatchException", "ExpiredCodeException"].includes(error.name)) {
                setError("emailAuthCode", { type: "server", message });
            }
            showFlashMessage("error", message);
        }
    });

    const resendCode = () => withLoading(async () => {
        setFlashMessage(null);
        try {
            await resendSignUpCode({ username: methods.getValues("email").trim() });
            showFlashMessage("success", "A new verification code has been sent.");
        } catch (error) {
            showFlashMessage("error", getAuthErrorMessage(error));
        }
    });

    const handleChangeEmail = () => {
        setFlashMessage(null);
        setStepperIndex(0);
    };

    const handleSignin = () => {
        router.push("/signin");
    };

    return (
        <FormProvider {...methods}>
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
                                <Button variant="primary" onClick={handleSignin}>
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
                <Box textAlign="center" padding={{ top: "s" }}>
                    <Box display="inline-block" textAlign="left">
                        {flashMessage && (
                            <Flashbar items={[flashMessage]} />
                        )}
                    </Box>
                </Box>
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

                                    {stepperIndex === 0 && (
                                        <Box>
                                            {/* Email Input Section */}
                                            <SpaceBetween size="s">
                                                <TextField
                                                    name="email"
                                                    label="Email"
                                                    type="email"
                                                    autoComplete="email"
                                                    hint="Enter the email address you want to use for signup."
                                                    controlId="email-address"
                                                />

                                                <Button
                                                    variant="primary"
                                                    fullWidth
                                                    data-testid="continue-email-button"
                                                    formAction="none"
                                                    loading={isLoading}
                                                    onClick={() => void continueToStep(["email"], 1)}
                                                >
                                                    Continue
                                                </Button>
                                            </SpaceBetween>

                                            <Divider>OR</Divider>

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
                                    )}

                                    {stepperIndex === 1 && (
                                        <SpaceBetween size="s">
                                            <FormField label="Email" constraintText="">
                                                <Input
                                                    id="email-address"
                                                    value={email}
                                                    placeholder=""
                                                    autoComplete="on"
                                                    type="email"
                                                    disabled
                                                />
                                            </FormField>
                                            <TextField
                                                name="fullName"
                                                label="Name"
                                                autoComplete="name"
                                                controlId="full-name"
                                            />
                                            <TextField
                                                name="password"
                                                label="Password"
                                                type="password"
                                                autoComplete="new-password"
                                                hint="At least 8 characters, including uppercase and lowercase letters, a number, and a symbol."
                                                controlId="password"
                                            />
                                            <FormField label="Business Type" errorText={errors.businessType?.message}>
                                                <Controller
                                                    control={control}
                                                    name="businessType"
                                                    render={({ field }) => (
                                                        <Select
                                                            selectedOption={businessTypeOptions.find(option => option.value === field.value) ?? null}
                                                            onChange={({ detail }) => field.onChange(detail.selectedOption.value ?? "")}
                                                            options={businessTypeOptions}
                                                        />
                                                    )}
                                                />
                                            </FormField>

                                            <Button
                                                variant="primary"
                                                fullWidth
                                                data-testid="continue-email-button"
                                                formAction="none"
                                                loading={isLoading}
                                                onClick={() => void createAccount()}
                                            >
                                                Continue
                                            </Button>
                                        </SpaceBetween>
                                    )}

                                    {stepperIndex === 2 && (
                                        <Box>
                                            {/* Header and Description */}
                                            <Header
                                                variant="h1"
                                                description="We just sent a verification code to your email. It may take up to 5 minutes for the code to arrive. Code expires in 30 minutes."
                                            >
                                                Verify your email
                                            </Header>

                                            {/* Email Display Field */}
                                            <FormField label="Email">
                                                <SpaceBetween direction="horizontal" size="s" alignItems="center">
                                                    <Box variant="span" data-testid="email-display">
                                                        {email}
                                                    </Box>
                                                    <Link
                                                        variant="primary"
                                                        href="#/signup/enter-email"
                                                        data-testid="email-verification-not-you-link"
                                                        onFollow={handleChangeEmail}
                                                    >
                                                        Change
                                                    </Link>
                                                </SpaceBetween>
                                            </FormField>
                                            <SpaceBetween size="l">
                                                {/* Email Input Section */}
                                                <SpaceBetween size="s">
                                                    <FormField
                                                        label="Email Verification Code"
                                                        constraintText="Enter the 6-digit code sent to your email."
                                                        errorText={errors.emailAuthCode?.message}
                                                    >
                                                        <SpaceBetween size="xxs">
                                                            {/* Input and Resend Button side-by-side */}
                                                            <div
                                                                style={{
                                                                    display: "flex",
                                                                    flexDirection: "row",
                                                                    gap: "8px",
                                                                    alignItems: "flex-start",
                                                                }}
                                                            >
                                                                <div style={{ flexGrow: 1 }}>
                                                                    <Controller
                                                                        control={control}
                                                                        name="emailAuthCode"
                                                                        render={({ field }) => (
                                                                            <Input
                                                                                id="email-verification-code"
                                                                                placeholder="6-digit"
                                                                                autoComplete="one-time-code"
                                                                                value={field.value}
                                                                                onChange={({ detail }) => field.onChange(detail.value)}
                                                                                onBlur={field.onBlur}
                                                                                data-testid="email-verification-form-code-input"
                                                                            />
                                                                        )}
                                                                    />
                                                                </div>
                                                                <div style={{ minWidth: "156px" }}>
                                                                    <Button
                                                                        fullWidth
                                                                        disabled={isLoading}
                                                                        loading={isLoading}
                                                                        data-testid="email-verification-resend-code-button"
                                                                        onClick={() => void resendCode()}
                                                                    >
                                                                        Resend code
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </SpaceBetween>

                                                    </FormField>

                                                    <Button
                                                        variant="primary"
                                                        fullWidth
                                                        data-testid="continue-email-button"
                                                        formAction="none"
                                                        loading={isLoading}
                                                        onClick={() => void confirmEmail()}
                                                    >
                                                        Continue
                                                    </Button>
                                                </SpaceBetween>
                                            </SpaceBetween>
                                        </Box>
                                    )}
                                    {stepperIndex === 3 && (
                                        <Box>
                                            <Header
                                                variant="h1"
                                                description="Your email address has been confirmed and your account is ready."
                                            >
                                                Signup complete
                                            </Header>
                                            <SpaceBetween size="m">
                                                <StatusIndicator type="success">Email verified</StatusIndicator>
                                                <Box variant="p">
                                                    Sign in to continue. You can connect your PayPal account after the OAuth integration is configured.
                                                </Box>
                                                <Button
                                                    variant="primary"
                                                    fullWidth
                                                    onClick={handleSignin}
                                                >
                                                    Sign in
                                                </Button>
                                            </SpaceBetween>
                                        </Box>
                                    )}

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
        </FormProvider>
    );
}