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

interface Tarefa {
  titulo: string;
  categoria: string;
  prioridade: number;
}

interface AnaliseCompletaProps {
  nome: string;
  nomeSite: string;
  urlSite: string;
  scoreGeral: number;
  scorePerformance: number;
  scoreSeo: number;
  scoreBusiness: number;
  top3Tarefas: Tarefa[];
  analiseId: string;
  appUrl?: string;
}

export function AnaliseCompleta({
  nome = "Empreendedor",
  nomeSite = "Seu site",
  urlSite = "",
  scoreGeral = 0,
  scorePerformance = 0,
  scoreSeo = 0,
  scoreBusiness = 0,
  top3Tarefas = [],
  analiseId,
  appUrl = "https://rankbr.com.br",
}: AnaliseCompletaProps) {
  const primeiroNome  = nome.split(" ")[0];
  const relatorioUrl  = `${appUrl}/analises/${analiseId}`;
  const scoreColor    = scoreGeral >= 70 ? GREEN : scoreGeral >= 40 ? "#D97706" : "#DC2626";
  const scoreLabel    = scoreGeral >= 70 ? "Bom" : scoreGeral >= 40 ? "Regular" : "Crítico";

  const categoriaLabel: Record<string, string> = {
    seo:             "SEO",
    performance:     "Performance",
    google_business: "Google Business",
    conteudo:        "Conteúdo",
    outro:           "Outro",
  };

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>
        Análise concluída! {nomeSite} obteve {scoreGeral}/100 — veja o plano de ação
      </Preview>

      <Body style={bodyStyle}>
        <Container style={containerStyle}>

          {/* Header */}
          <Section style={headerStyle}>
            <Heading style={logoStyle}>
              Rank<span style={{ color: GREEN }}>BR</span>
            </Heading>
          </Section>

          {/* Score hero */}
          <Section style={heroStyle}>
            <Text style={heroLabelStyle}>Score geral de {nomeSite}</Text>
            <Text style={{ ...heroScoreStyle, color: scoreColor }}>
              {scoreGeral}
              <span style={heroScoreMaxStyle}>/100</span>
            </Text>
            <Text style={{ ...heroBadgeStyle, backgroundColor: scoreColor }}>
              {scoreLabel}
            </Text>
          </Section>

          {/* Main content */}
          <Section style={contentStyle}>
            <Heading as="h2" style={titleStyle}>
              Olá, {primeiroNome}! Seu relatório está pronto. 🎉
            </Heading>

            <Text style={textStyle}>
              Analisamos <strong>{nomeSite}</strong> em profundidade. Veja o
              desempenho em cada módulo e as ações mais urgentes para escalar
              sua presença digital.
            </Text>

            {/* Module scores */}
            <Section style={modulesContainerStyle}>
              <Row>
                <Column style={moduleColStyle}>
                  <Text style={moduleLabelStyle}>Performance</Text>
                  <Text style={{ ...moduleValueStyle, color: getScoreColor(scorePerformance) }}>
                    {scorePerformance}
                  </Text>
                </Column>
                <Column style={moduleColStyle}>
                  <Text style={moduleLabelStyle}>SEO</Text>
                  <Text style={{ ...moduleValueStyle, color: getScoreColor(scoreSeo) }}>
                    {scoreSeo}
                  </Text>
                </Column>
                <Column style={moduleColStyle}>
                  <Text style={moduleLabelStyle}>Google Business</Text>
                  <Text style={{ ...moduleValueStyle, color: getScoreColor(scoreBusiness) }}>
                    {scoreBusiness}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Top 3 tarefas */}
            {top3Tarefas.length > 0 && (
              <>
                <Heading as="h3" style={sectionTitleStyle}>
                  🚀 Suas 3 tarefas mais urgentes
                </Heading>

                {top3Tarefas.map((tarefa, i) => (
                  <Section key={i} style={tarefaStyle}>
                    <Row>
                      <Column style={{ width: "32px", verticalAlign: "top" }}>
                        <Text style={tarefaNumStyle}>{i + 1}</Text>
                      </Column>
                      <Column style={{ verticalAlign: "top" }}>
                        <Text style={tarefaTituloStyle}>{tarefa.titulo}</Text>
                        <Text style={tarefaCatStyle}>
                          {categoriaLabel[tarefa.categoria] ?? tarefa.categoria}
                        </Text>
                      </Column>
                    </Row>
                  </Section>
                ))}

                <Text style={textStyle}>
                  Acesse o dashboard para ver todas as 10 tarefas priorizadas e
                  marcar cada uma como concluída conforme avançar.
                </Text>
              </>
            )}

            {/* PDF note */}
            <Section style={pdfNoteStyle}>
              <Text style={pdfNoteText}>
                📄 <strong>Seu relatório em PDF está disponível no dashboard.</strong>{" "}
                Acesse o link abaixo e clique em{" "}
                <em>"Exportar PDF"</em> para baixar o arquivo completo.
              </Text>
            </Section>

            {/* CTA */}
            <Section style={{ textAlign: "center" as const, margin: "32px 0" }}>
              <Button href={relatorioUrl} style={buttonStyle}>
                Ver relatório completo
              </Button>
            </Section>
          </Section>

          <Hr style={hrStyle} />

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Relatório gerado para{" "}
              <Link href={urlSite} style={{ color: GREEN }}>
                {urlSite}
              </Link>
              .
            </Text>
            <Text style={footerTextStyle}>
              © {new Date().getFullYear()} RankBR —{" "}
              <Link href={appUrl} style={{ color: GREEN }}>
                rankbr.com.br
              </Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

export default AnaliseCompleta;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 70) return GREEN;
  if (score >= 40) return "#D97706";
  return "#DC2626";
}

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
  backgroundColor: BLUE,
  padding: "0 32px 32px",
  textAlign: "center" as const,
};

const heroLabelStyle = {
  fontSize: "14px",
  color: "rgba(255,255,255,0.7)",
  margin: "0 0 8px",
};

const heroScoreStyle = {
  fontSize: "72px",
  fontWeight: 800,
  lineHeight: 1,
  margin: "0 0 12px",
};

const heroScoreMaxStyle = {
  fontSize: "28px",
  fontWeight: 400,
  color: "rgba(255,255,255,0.5)",
};

const heroBadgeStyle = {
  display: "inline-block" as const,
  fontSize: "13px",
  fontWeight: 600,
  color: "#FFFFFF",
  padding: "4px 14px",
  borderRadius: "20px",
  margin: 0,
};

const contentStyle = {
  padding: "32px",
};

const titleStyle = {
  fontSize: "20px",
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

const modulesContainerStyle = {
  backgroundColor: "#F9FAFB",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
};

const moduleColStyle = {
  textAlign: "center" as const,
  padding: "0 12px",
};

const moduleLabelStyle = {
  fontSize: "12px",
  color: "#6B7280",
  margin: "0 0 4px",
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const moduleValueStyle = {
  fontSize: "32px",
  fontWeight: 800,
  margin: 0,
  lineHeight: 1.2,
};

const sectionTitleStyle = {
  fontSize: "17px",
  fontWeight: 700,
  color: "#111827",
  margin: "24px 0 16px",
};

const tarefaStyle = {
  borderLeft: `3px solid ${GREEN}`,
  paddingLeft: "16px",
  marginBottom: "16px",
  backgroundColor: "#F9FAFB",
  borderRadius: "0 6px 6px 0",
  padding: "12px 16px",
};

const tarefaNumStyle = {
  width: "24px",
  height: "24px",
  backgroundColor: GREEN,
  color: "#FFFFFF",
  borderRadius: "50%",
  fontSize: "12px",
  fontWeight: 700,
  textAlign: "center" as const,
  lineHeight: "24px",
  margin: "2px 8px 0 0",
};

const tarefaTituloStyle = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#111827",
  margin: "0 0 4px",
};

const tarefaCatStyle = {
  fontSize: "12px",
  color: "#6B7280",
  margin: 0,
};

const pdfNoteStyle = {
  backgroundColor: `${BLUE}0F`,
  borderLeft: `4px solid ${BLUE}`,
  borderRadius: "4px",
  padding: "12px 16px",
  margin: "16px 0",
};

const pdfNoteText = {
  fontSize: "13px",
  lineHeight: "1.6",
  color: "#374151",
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
