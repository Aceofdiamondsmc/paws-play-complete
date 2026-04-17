/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🐾 Confirm it's you</Heading>
        <Text style={text}>Use the code below to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can safely ignore this email.
        </Text>
        <Text style={brandFooter}>Paws Play Repeat — Keeping the pack safe, together.</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '24px 20px', maxWidth: '600px' }
const h1 = { fontSize: '26px', fontWeight: 'bold' as const, color: '#e87b35', margin: '0 0 20px', textAlign: 'center' as const }
const text = { fontSize: '15px', color: '#3d2a14', lineHeight: '1.6', margin: '0 0 20px' }
const codeStyle = { fontFamily: 'Courier, monospace', fontSize: '28px', fontWeight: 'bold' as const, color: '#e87b35', letterSpacing: '4px', textAlign: 'center' as const, margin: '0 0 30px' }
const footer = { fontSize: '13px', color: '#8c7a6a', margin: '28px 0 16px', lineHeight: '1.5' }
const brandFooter = { fontSize: '12px', color: '#8c7a6a', textAlign: 'center' as const, borderTop: '1px solid #e8ddd4', paddingTop: '16px', marginTop: '24px' }
