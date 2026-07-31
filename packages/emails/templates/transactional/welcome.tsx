import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "react-email";

export interface WelcomeEmailProps {
  actionUrl: string;
  name: string;
}

export default function WelcomeEmail({ actionUrl, name }: WelcomeEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Welcome to Dia Zero, {name}.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Welcome to Dia Zero</Heading>
          <Text style={paragraph}>Hi {name},</Text>
          <Text style={paragraph}>Your account is ready. Use the button below to continue.</Text>
          <Section style={buttonSection}>
            <Button href={actionUrl} style={button}>
              Continue
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

WelcomeEmail.PreviewProps = {
  actionUrl: "https://example.com",
  name: "Jane",
} satisfies WelcomeEmailProps;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: "Arial, sans-serif",
  padding: "40px 0",
};

const container = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "40px",
};

const heading = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 0 24px",
};

const paragraph = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const buttonSection = {
  marginTop: "32px",
};

const button = {
  backgroundColor: "#111827",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  padding: "12px 20px",
  textDecoration: "none",
};
