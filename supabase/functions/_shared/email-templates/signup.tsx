/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email to join the Pack 🐾</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🐾 Welcome to the Pack!</Heading>
        <Text style={text}>
          Thanks for signing up for{' '}
          <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link>!
          We're thrilled to have you and your pup join our community.
        </Text>
        <Text style={text}>
          Please confirm your email (
          <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>
          ) by tapping the button below:
        </Text>
        <Button style={button} href={confirmationUrl}>Confirm Email</Button>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
        <Text style={brandFooter}>Paws Play Repeat — Keeping the pack safe, together.</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '24px 20px', maxWidth: '600px' }
const h1 = { fontSize: '26px', fontWeight: 'bold' as const, color: '#e87b35', margin: '0 0 20px', textAlign: 'center' as const }
const text = { fontSize: '15px', color: '#3d2a14', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#e87b35', textDecoration: 'underline' }
const button = { backgroundColor: '#e87b35', color: '#ffffff', fontSize: '16px', fontWeight: 'bold' as const, borderRadius: '12px', padding: '14px 32px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '13px', color: '#8c7a6a', margin: '28px 0 16px', lineHeight: '1.5' }
const brandFooter = { fontSize: '12px', color: '#8c7a6a', textAlign: 'center' as const, borderTop: '1px solid #e8ddd4', paddingTop: '16px', marginTop: '24px' }
