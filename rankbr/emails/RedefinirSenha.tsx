import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
  Link,
} from "@react-email/components";

const GREEN = "#00A651";
const BLUE  = "#003087";

interface RedefinirSenhaProps {
  /** URL completo com o token de redefinição gerado pelo Supabase */
  resetUrl: string;
  /** URL base do app, ex: https://rankbr.com.br */
  appUrl?: string;
}

export function RedefinirSenha({
  resetUrl,
  appUrl = "https://rankbr.com.br",
}: RedefinirSenhaProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Redefinir senha do RankBR — clique para criar uma nova senha</Preview>

      <Body style={bodyStyle}>
        <Container style={containerStyle}>

          {/* Header */}
          <Section style={headerStyle}>
            <Heading style={logoStyle}>
              Rank<span style={{ color: GREEN }}>BR</span>
            </Heading>
          </Section>

          {/* Main content */}
          <Section style={contentStyle}>
            <Heading as="h2" style={titleStyle}>
              Redefinição de senha
            </Heading>

            <Text style={textStyle}>
              Recebemos uma solicitação para redefinir a senha da sua conta no{" "}
              <strong>RankBR</strong>. Se você fez essa solicitação, clique no
              botão abaixo para criar uma nova senha.
            </Text>

            {/* CTA */}
            <Section style={{ textAlign: "center" as const, margin: "32px 0" }}>
              <Button href={resetUrl} style={buttonStyle}>
                Redefinir minha senha
              </Button>
            </Section>

            {/* Info box */}
            <Section style={infoBoxStyle}>
              <Text style={infoTextStyle}>
                🔒 <strong>Este link é válido por 1 hora</strong> e só pode ser
                usado uma vez. Após expirar, você precisará solicitar um novo
                link de redefinição.
              </Text>
            </Section>

            <Text style={mutedStyle}>
              Se você não solicitou a redefinição de senha, ignore este e-mail.
              Sua senha atual permanece inalterada e sua conta está segura.
            </Text>

            <Text style={smallLinkStyle}>
              Caso o botão não funcione, copie e cole este link no seu
              navegador:{" "}
              <Link href={resetUrl} style={{ color: GREEN, wordBreak: "break-all" as const }}>
                {resetUrl}
              </Link>
            </Text>
          </Section>

          <Hr style={hrStyle} />

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Você recebeu este e-mail porque solicitou a redefinição de senha
              no{" "}
              <Link href={appUrl} style={{ color: GREEN }}>
                rankbr.com.br
              </Link>
              .
            </Text>
            <Text style={footerTextStyle}>
              © {new Date().getFullYear()} RankBR. Todos os direitos reservados.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

export default RedefinirSenha;

// ─── Styles ──────────────────────────────────────────────────────────────────

const bodyStyle = {
  backgroundColor: "#F3F4F6",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
};

const containerStyle = {
  maxWidth: "600px",
  margin: "40px auto",
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  overflow: "hidden" as const,
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
};

const headerStyle = {
  backgroundColor: BLUE,
  padding: "24px 32px",
};

const logoStyle = {
  margin: 0,
  fontSize: "28px",
  fontWeight: 700,
  color: "#FFFFFF",
  letterSpacing: "-0.5px",
};

const contentStyle = {
  padding: "32px",
};

const titleStyle = {
  fontSize: "22px",
  fontWeight: 700,
  color: "#111827",
  margin: "0 0 16px",
};

const textStyle = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#374151",
  margin: "0 0 16px",
};

const infoBoxStyle = {
  backgroundColor: `${GREEN}12`,
  borderLeft: `4px solid ${GREEN}`,
  borderRadius: "4px",
  padding: "16px 20px",
  margin: "24px 0",
};

const infoTextStyle = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#065F46",
  margin: 0,
};

const buttonStyle = {
  backgroundColor: GREEN,
  color: "#FFFFFF",
  fontSize: "15px",
  fontWeight: 600,
  padding: "14px 32px",
  borderRadius: "8px",
  textDecoration: "none",
  display: "inline-block" as const,
};

const mutedStyle = {
  fontSize: "13px",
  color: "#6B7280",
  margin: "16px 0 8px",
};

const smallLinkStyle = {
  fontSize: "12px",
  color: "#9CA3AF",
  margin: "16px 0 0",
  lineHeight: "1.6" as const,
};

const hrStyle = {
  borderColor: "#E5E7EB",
  margin: "0",
};

const footerStyle = {
  padding: "24px 32px",
  backgroundColor: "#F9FAFB",
};

const footerTextStyle = {
  fontSize: "12px",
  color: "#9CA3AF",
  textAlign: "center" as const,
  margin: "4px 0",
};
