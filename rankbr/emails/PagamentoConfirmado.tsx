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
  Row,
  Column,
} from "@react-email/components";

const GREEN = "#00A651";
const BLUE  = "#003087";

interface PagamentoConfirmadoProps {
  nome: string;
  nomeSite: string;
  urlSite: string;
  valor: number;
  pagamentoId: string;
  dataAprovacao?: string;
  appUrl?: string;
}

export function PagamentoConfirmado({
  nome = "Empreendedor",
  nomeSite = "Seu site",
  urlSite = "",
  valor = 10,
  pagamentoId,
  dataAprovacao,
  appUrl = "https://rankbr.com.br",
}: PagamentoConfirmadoProps) {
  const primeiroNome = nome.split(" ")[0];
  const dashboardUrl = `${appUrl}/dashboard`;

  const dataFormatada = dataAprovacao
    ? new Date(dataAprovacao).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

  const valorFormatado = valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>
        Pagamento confirmado! Sua análise de {nomeSite} começará em instantes.
      </Preview>

      <Body style={bodyStyle}>
        <Container style={containerStyle}>

          {/* Header */}
          <Section style={headerStyle}>
            <Heading style={logoStyle}>
              Rank<span style={{ color: GREEN }}>BR</span>
            </Heading>
          </Section>

          {/* Confirmação hero */}
          <Section style={heroStyle}>
            <Text style={checkStyle}>✓</Text>
            <Heading as="h1" style={heroTitleStyle}>
              Pagamento confirmado!
            </Heading>
            <Text style={heroSubtitleStyle}>
              Obrigado, {primeiroNome}. Tudo certo!
            </Text>
          </Section>

          {/* Main content */}
          <Section style={contentStyle}>

            {/* Detalhes do pagamento */}
            <Section style={receiptStyle}>
              <Heading as="h3" style={receiptTitleStyle}>
                Detalhes da transação
              </Heading>
              <Hr style={{ borderColor: "#E5E7EB", margin: "12px 0" }} />

              <Row style={receiptRowStyle}>
                <Column><Text style={receiptLabelStyle}>Site analisado</Text></Column>
                <Column style={{ textAlign: "right" as const }}>
                  <Text style={receiptValueStyle}>{nomeSite}</Text>
                </Column>
              </Row>

              <Row style={receiptRowStyle}>
                <Column><Text style={receiptLabelStyle}>URL</Text></Column>
                <Column style={{ textAlign: "right" as const }}>
                  <Text style={receiptValueStyle}>
                    <Link href={urlSite} style={{ color: GREEN, fontSize: "13px" }}>
                      {urlSite}
                    </Link>
                  </Text>
                </Column>
              </Row>

              <Row style={receiptRowStyle}>
                <Column><Text style={receiptLabelStyle}>Data</Text></Column>
                <Column style={{ textAlign: "right" as const }}>
                  <Text style={receiptValueStyle}>{dataFormatada}</Text>
                </Column>
              </Row>

              <Row style={receiptRowStyle}>
                <Column><Text style={receiptLabelStyle}>Nº do pedido</Text></Column>
                <Column style={{ textAlign: "right" as const }}>
                  <Text style={{ ...receiptValueStyle, fontFamily: "monospace", fontSize: "11px" }}>
                    {pagamentoId}
                  </Text>
                </Column>
              </Row>

              <Hr style={{ borderColor: "#E5E7EB", margin: "12px 0" }} />

              <Row>
                <Column><Text style={totalLabelStyle}>Total pago</Text></Column>
                <Column style={{ textAlign: "right" as const }}>
                  <Text style={totalValueStyle}>{valorFormatado}</Text>
                </Column>
              </Row>
            </Section>

            {/* O que acontece agora */}
            <Heading as="h3" style={sectionTitleStyle}>
              O que acontece agora?
            </Heading>

            {[
              {
                num: "1",
                title: "Análise em andamento",
                desc: "Nossa plataforma já começou a analisar seu site. O processo leva cerca de 2 minutos.",
              },
              {
                num: "2",
                title: "Relatório gerado",
                desc: "Você receberá um email quando o diagnóstico estiver completo, com seu score e plano de ação.",
              },
              {
                num: "3",
                title: "Implemente e cresça",
                desc: "Siga as tarefas priorizadas e veja sua presença digital melhorar semana a semana.",
              },
            ].map(({ num, title, desc }) => (
              <Section key={num} style={stepStyle}>
                <Row>
                  <Column style={{ width: "40px", verticalAlign: "top" }}>
                    <Text style={stepNumStyle}>{num}</Text>
                  </Column>
                  <Column>
                    <Text style={stepTitleStyle}>{title}</Text>
                    <Text style={stepDescStyle}>{desc}</Text>
                  </Column>
                </Row>
              </Section>
            ))}

            {/* CTA */}
            <Section style={{ textAlign: "center" as const, margin: "32px 0" }}>
              <Button href={dashboardUrl} style={buttonStyle}>
                Acompanhar análise
              </Button>
            </Section>

            <Text style={mutedStyle}>
              Dúvidas? Responda este email que nossa equipe te ajuda.
            </Text>
          </Section>

          <Hr style={hrStyle} />

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Este é um email de confirmação de pagamento enviado pelo{" "}
              <Link href={appUrl} style={{ color: GREEN }}>
                RankBR
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

export default PagamentoConfirmado;

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
};

const heroStyle = {
  backgroundColor: GREEN,
  padding: "32px",
  textAlign: "center" as const,
};

const checkStyle = {
  fontSize: "48px",
  color: "#FFFFFF",
  margin: "0 0 12px",
  fontWeight: 700,
};

const heroTitleStyle = {
  fontSize: "26px",
  fontWeight: 800,
  color: "#FFFFFF",
  margin: "0 0 8px",
};

const heroSubtitleStyle = {
  fontSize: "16px",
  color: "rgba(255,255,255,0.85)",
  margin: 0,
};

const contentStyle = {
  padding: "32px",
};

const receiptStyle = {
  backgroundColor: "#F9FAFB",
  borderRadius: "8px",
  padding: "20px 24px",
  margin: "0 0 28px",
  border: "1px solid #E5E7EB",
};

const receiptTitleStyle = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#374151",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 4px",
};

const receiptRowStyle = {
  margin: "8px 0",
};

const receiptLabelStyle = {
  fontSize: "13px",
  color: "#6B7280",
  margin: 0,
};

const receiptValueStyle = {
  fontSize: "13px",
  color: "#111827",
  fontWeight: 500,
  margin: 0,
};

const totalLabelStyle = {
  fontSize: "15px",
  fontWeight: 700,
  color: "#111827",
  margin: 0,
};

const totalValueStyle = {
  fontSize: "18px",
  fontWeight: 800,
  color: GREEN,
  margin: 0,
  textAlign: "right" as const,
};

const sectionTitleStyle = {
  fontSize: "17px",
  fontWeight: 700,
  color: "#111827",
  margin: "0 0 16px",
};

const stepStyle = {
  marginBottom: "16px",
};

const stepNumStyle = {
  width: "28px",
  height: "28px",
  backgroundColor: BLUE,
  color: "#FFFFFF",
  borderRadius: "50%",
  fontSize: "13px",
  fontWeight: 700,
  textAlign: "center" as const,
  lineHeight: "28px",
  margin: "0 12px 0 0",
};

const stepTitleStyle = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#111827",
  margin: "0 0 4px",
};

const stepDescStyle = {
  fontSize: "13px",
  lineHeight: "1.5",
  color: "#6B7280",
  margin: 0,
};

const buttonStyle = {
  backgroundColor: BLUE,
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
  margin: 0,
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
