import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Button,
  Hr,
} from "@react-email/components";

interface PasswordResetTemplateProps {
  resetUrl: string;
  email: string;
}

export function PasswordResetTemplate({
  resetUrl,
  email,
}: PasswordResetTemplateProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={section}>
            <Text style={heading}>Reset your password</Text>
            <Text style={text}>
              Hi there! We received a request to reset the password for your
              account associated with <strong>{email}</strong>.
            </Text>
            <Text style={text}>
              To reset your password, click the button below. This link will
              expire in 30 minutes for security reasons.
            </Text>
            <Button style={button} href={resetUrl}>
              Reset Password
            </Button>
            <Text style={text}>
              Or copy and paste this URL into your browser:
            </Text>
            <Link href={resetUrl} style={link}>
              {resetUrl}
            </Link>
            <Hr style={hr} />
            <Text style={footer}>
              If you didn't request a password reset, you can safely ignore this
              email. Your password will remain unchanged.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default PasswordResetTemplate;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const section = {
  padding: "0 48px",
};

const heading = {
  fontSize: "32px",
  lineHeight: "1.3",
  fontWeight: "700",
  color: "#484848",
  margin: "40px 0 20px",
};

const text = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#484848",
  margin: "16px 0",
};

const button = {
  backgroundColor: "#0ea5e9",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "100%",
  padding: "12px 20px",
  margin: "24px 0",
};

const link = {
  color: "#0ea5e9",
  fontSize: "14px",
  textDecoration: "underline",
  wordBreak: "break-all" as const,
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "32px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "16px 0",
};
