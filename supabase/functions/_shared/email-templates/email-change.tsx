/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({ siteName, email, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🐾 Confirm your email change</Heading>
        <Text style={text}>
          You requested to change your email for {siteName} from{' '}
          <Link href={`mailto:${email}`} style={link}>{email}</Link> to{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Text style={text}>Tap the button below to confirm this change:</Text>
        <Button style={button} href={confirmationUrl}>Confirm Email Change</Button>
        <Text style={footer}>
          If you didn't request this change, please secure your account immediately.
        </Text>
        <Text style={brandFooter}>Paws Play Repeat — Keeping the pack safe, together.</Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '24px 20px', maxWidth: '600px' }
const h1 = { fontSize: '26px', fontWeight: 'bold' as const, color: '#e87b35', margin: '0 0 20px', textAlign: 'center' as const }
const text = { fontSize: '15px', color: '#3d2a14', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#e87b35', textDecoration: 'underline' }
const button = { backgroundColor: '#e87b35', color: '#ffffff', fontSize: '16px', fontWeight: 'bold' as const, borderRadius: '12px', padding: '14px 32px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '13px', color: '#8c7a6a', margin: '28px 0 16px', lineHeight: '1.5' }
const brandFooter = { fontSize: '12px', color: '#8c7a6a', textAlign: 'center' as const, borderTop: '1px solid #e8ddd4', paddingTop: '16px', marginTop: '24px' }
