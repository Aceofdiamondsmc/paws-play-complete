/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body, Button, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your password for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🐾 Reset your password</Heading>
        <Text style={text}>
          We received a request to reset your password for {siteName}. Tap the button below to choose a new one.
        </Text>
        <Button style={button} href={confirmationUrl}>Reset Password</Button>
        <Text style={footer}>
          If you didn't request a password reset, you can safely ignore this email — your password will stay the same.
        </Text>
        <Text style={brandFooter}>Paws Play Repeat — Keeping the pack safe, together.</Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '24px 20px', maxWidth: '600px' }
const h1 = { fontSize: '26px', fontWeight: 'bold' as const, color: '#e87b35', margin: '0 0 20px', textAlign: 'center' as const }
const text = { fontSize: '15px', color: '#3d2a14', lineHeight: '1.6', margin: '0 0 20px' }
const button = { backgroundColor: '#e87b35', color: '#ffffff', fontSize: '16px', fontWeight: 'bold' as const, borderRadius: '12px', padding: '14px 32px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '13px', color: '#8c7a6a', margin: '28px 0 16px', lineHeight: '1.5' }
const brandFooter = { fontSize: '12px', color: '#8c7a6a', textAlign: 'center' as const, borderTop: '1px solid #e8ddd4', paddingTop: '16px', marginTop: '24px' }
