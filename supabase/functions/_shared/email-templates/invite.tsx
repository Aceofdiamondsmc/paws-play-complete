/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join the Pack 🐾</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🐾 You've been invited!</Heading>
        <Text style={text}>
          You've been invited to join{' '}
          <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link>.
          Tap the button below to accept and create your account.
        </Text>
        <Button style={button} href={confirmationUrl}>Accept Invitation</Button>
        <Text style={footer}>
          If you weren't expecting this invitation, you can safely ignore this email.
        </Text>
        <Text style={brandFooter}>Paws Play Repeat — Keeping the pack safe, together.</Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '24px 20px', maxWidth: '600px' }
const h1 = { fontSize: '26px', fontWeight: 'bold' as const, color: '#e87b35', margin: '0 0 20px', textAlign: 'center' as const }
const text = { fontSize: '15px', color: '#3d2a14', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#e87b35', textDecoration: 'underline' }
const button = { backgroundColor: '#e87b35', color: '#ffffff', fontSize: '16px', fontWeight: 'bold' as const, borderRadius: '12px', padding: '14px 32px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '13px', color: '#8c7a6a', margin: '28px 0 16px', lineHeight: '1.5' }
const brandFooter = { fontSize: '12px', color: '#8c7a6a', textAlign: 'center' as const, borderTop: '1px solid #e8ddd4', paddingTop: '16px', marginTop: '24px' }
