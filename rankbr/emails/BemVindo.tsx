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

interface BemVindoProps {
  nome: string;
  /** URL base do app, ex: https://rankbr.com.br */
  appUrl?: string;
}

export function BemVindo({
  nome = "Empreendedor",
  appUrl = "https://rankbr.com.br",
}: BemVindoProps) {
  const primeiroNome = nome.split(" ")[0];
  const analiseUrl  = `${appUrl}/nova-analise`;

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Bem-vindo ao RankBR — seu diagnóstico de marketing está a um clique</Preview>

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
              Olá, {primeiroNome}! 👋
            </Heading>

            <Text style={textStyle}>
              Que bom ter você no <strong>RankBR</strong>! Somos a plataforma
              de diagnóstico de marketing digital criada para pequenas e médias
              empresas brasileiras que querem crescer online.
            </Text>

            <Text style={textStyle}>
              Com apenas <strong>R$ 10</strong>, você recebe um relatório
              completo com:
            </Text>

            {/* Feature list */}
            <Section style={featureListStyle}>
              {[
                "✅ Score de performance do seu site (velocidade, UX)",
                "✅ Análise de SEO — o que está bloqueando o Google",
                "✅ Diagnóstico do Google Business Profile",
                "✅ Pesquisa de palavras-chave do seu segmento",
                "✅ Plano de ação com 10 tarefas priorizadas",
              ].map((item) => (
                <Text key={item} style={featureItemStyle}>
                  {item}
                </Text>
              ))}
            </Section>

            {/* Dica rápida */}
            <Section style={tipBoxStyle}>
              <Text style={tipTitleStyle}>💡 Dica rápida de SEO</Text>
              <Text style={tipTextStyle}>
                Sabia que <strong>53% dos usuários</strong> abandonam um site
                que demora mais de 3 segundos para carregar? A velocidade de
                carregamento é um fator direto de ranqueamento no Google —
                e é exatamente o que analisamos para você.
              </Text>
            </Section>

            {/* CTA */}
            <Section style={{ textAlign: "center" as const, margin: "32px 0" }}>
              <Button href={analiseUrl} style={buttonStyle}>
                Iniciar minha primeira análise
              </Button>
            </Section>

            <Text style={mutedStyle}>
              O diagnóstico leva cerca de 2 minutos. Você receberá um email
              assim que o relatório estiver pronto.
            </Text>
          </Section>

          <Hr style={hrStyle} />

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Você recebeu este email porque criou uma conta no{" "}
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

export default BemVindo;

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

const featureListStyle = {
  backgroundColor: "#F9FAFB",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "16px 0",
};

const featureItemStyle = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#374151",
  margin: "4px 0",
};

const tipBoxStyle = {
  backgroundColor: `${GREEN}12`,
  borderLeft: `4px solid ${GREEN}`,
  borderRadius: "4px",
  padding: "16px 20px",
  margin: "24px 0",
};

const tipTitleStyle = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#065F46",
  margin: "0 0 8px",
};

const tipTextStyle = {
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
  color: "#9CA3AF",
  textAlign: "center" as const,
  margin: "0 0 8px",
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
