
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface ConfirmationEmailProps {
  name: string;
  confirmationLink: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : '';

export const ConfirmationEmail = ({
  name,
  confirmationLink,
}: ConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>
      Confirm your purchase
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src={`${baseUrl}/static/going_logo.png`}
          width="170"
          height="50"
          alt="Going"
          style={logo}
        />
        <Text style={paragraph}>Hi {name},</Text>
        <Text style={paragraph}>
          Thanks for your purchase. Please click the button below to confirm your purchase.
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href={confirmationLink}>
            Confirm purchase
          </Button>
        </Section>
        <Text style={paragraph}>
          Best,
          <br />
          The Going Team
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          Some footer text
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ConfirmationEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
};

const logo = {
  margin: '0 auto',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
};

const btnContainer = {
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#5F51E8',
  borderRadius: '3px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px',
};

const hr = {
  borderColor: '#cccccc',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
};
