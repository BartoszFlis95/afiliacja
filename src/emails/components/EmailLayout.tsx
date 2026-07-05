import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";

const colors = {
  bg: "#f4f4f5",
  card: "#ffffff",
  heading: "#18181b",
  text: "#3f3f46",
  muted: "#71717a",
  border: "#e4e4e7",
};

export function EmailLayout({
  preview,
  children,
}: {
  preview: string;
  children: React.ReactNode;
}) {
  return (
    <Html lang="pl">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: colors.bg,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
          margin: 0,
          padding: "32px 16px",
        }}
      >
        <Container
          style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: "32px",
            maxWidth: 560,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: colors.heading,
              letterSpacing: "-0.02em",
              margin: "0 0 24px",
            }}
          >
            Deneeu
          </Text>

          {children}

          <Hr style={{ borderColor: colors.border, margin: "32px 0 16px" }} />
          <Text style={{ fontSize: 12, color: colors.muted, margin: 0 }}>
            Deneeu | deneeu.pl | Nie odpowiadaj na tego maila
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailHeading({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 20,
        fontWeight: 700,
        color: colors.heading,
        margin: "0 0 16px",
      }}
    >
      {children}
    </Text>
  );
}

export function EmailText({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontSize: 15, color: colors.text, lineHeight: 1.6, margin: "0 0 16px" }}>
      {children}
    </Text>
  );
}

export function EmailListItem({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontSize: 15, color: colors.text, lineHeight: 1.6, margin: "0 0 8px" }}>
      {children}
    </Text>
  );
}

export function EmailInfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: colors.bg,
        borderRadius: 8,
        padding: "16px 20px",
        margin: "0 0 24px",
      }}
    >
      {children}
    </div>
  );
}

export function EmailInfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Text style={{ fontSize: 14, color: colors.text, margin: "0 0 6px" }}>
      <span style={{ color: colors.muted }}>{label}:</span>{" "}
      <strong style={{ color: colors.heading }}>{value}</strong>
    </Text>
  );
}

export function EmailButtonLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      style={{
        display: "inline-block",
        backgroundColor: colors.heading,
        color: "#ffffff",
        fontSize: 14,
        fontWeight: 600,
        textDecoration: "none",
        padding: "12px 24px",
        borderRadius: 8,
        margin: "8px 0 8px",
      }}
    >
      {children}
    </a>
  );
}
