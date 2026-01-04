import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
} from "@react-email/components";

interface PasswordChangeConfirmationTemplateProps {
  email: string;
}

export function PasswordChangeConfirmationTemplate({
  email,
}: PasswordChangeConfirmationTemplateProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={section}>
            <Text style={heading}>Password Changed Successfully</Text>
            <Text style={text}>
              Hi there! This email confirms that the password for your account{" "}
              <strong>{email}</strong> has been changed successfully.
            </Text>
            <Text style={text}>
              Your account is now secured with your new password. You can use it
              to sign in to your account.
            </Text>
            <Hr style={hr} />
            <Text style={footer}>
              If you didn't make this change, please contact our support team
              immediately. Someone may have unauthorized access to your account.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default PasswordChangeConfirmationTemplate;

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
