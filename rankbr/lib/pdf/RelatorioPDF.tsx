/**
 * RelatorioPDF
 *
 * React-PDF document component for the RankBR analysis report.
 * Rendered server-side via renderToBuffer() in the PDF API route.
 *
 * Constraints:
 *  - Only react-pdf primitives (Document, Page, View, Text, Link)
 *  - No SVG, no className, no browser APIs
 *  - Styles via StyleSheet.create() + inline overrides for dynamic values
 *  - Standard PDF fonts: Helvetica / Helvetica-Bold
 *  - A4 paper, 2 cm margins
 */

import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Link,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ResultadoAnalise, CategoriaTarefa } from "@/types";

// ─── Brand ───────────────────────────────────────────────────────────────────

const GREEN   = "#00A651";
const BLUE    = "#003087";
const AMBER   = "#F59E0B";
const RED     = "#EF4444";
const WHITE   = "#FFFFFF";
const GRAY_50  = "#F9FAFB";
const GRAY_100 = "#F3F4F6";
const GRAY_200 = "#E5E7EB";
const GRAY_500 = "#6B7280";
const GRAY_700 = "#374151";
const GRAY_900 = "#111827";

// Cover-specific muted colours (no rgba in react-pdf)
const COVER_DIM    = "#90B8E0"; // ~70% white on blue
const COVER_DIMMER = "#6090B0"; // ~50% white on blue

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 70) return GREEN;
  if (score >= 40) return AMBER;
  return RED;
}

const CATEGORIA_LABEL: Record<CategoriaTarefa, string> = {
  seo:              "SEO",
  performance:      "Performance",
  google_business:  "Google Business",
  conteudo:         "Conteúdo",
  outro:            "Outro",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface TarefaRow {
  id: string;
  titulo: string;
  descricao: string;
  categoria: CategoriaTarefa;
  prioridade: number;
  tempo_estimado: string;
  concluida: boolean;
}

export interface RelatorioPDFProps {
  nomeSite: string;
  urlSite: string;
  resultado: ResultadoAnalise;
  tarefas: TarefaRow[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricBar({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  const color = scoreColor(score);
  return (
    <View style={styles.metricRow}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={[styles.metricValue, { color }]}>{score}/100</Text>
      </View>
      {/* Track */}
      <View style={styles.progressTrack}>
        {/* Fill — percentage width inside a flex container */}
        <View
          style={[
            styles.progressFill,
            { width: `${score}%` as unknown as number, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
    </View>
  );
}

function PageFooter({ nomeSite }: { nomeSite: string }) {
  return (
    <View fixed style={styles.footer}>
      <Text style={styles.footerLeft}>
        Gerado por RankBR — rankbr.com.br · {nomeSite}
      </Text>
      <Text
        style={styles.footerRight}
        render={({ pageNumber, totalPages }) =>
          `${pageNumber} / ${totalPages}`
        }
      />
    </View>
  );
}

// ─── Main document ────────────────────────────────────────────────────────────

export function RelatorioPDF({
  nomeSite,
  urlSite,
  resultado,
  tarefas,
}: RelatorioPDFProps) {
  const {
    score_geral,
    score_performance,
    score_seo,
    score_business,
    relatorio,
    gerado_em,
  } = resultado;

  const sColor = scoreColor(score_geral);
  const dataFormatada = new Date(gerado_em).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const scoreLabel =
    score_geral >= 70 ? "Bom" : score_geral >= 40 ? "Regular" : "Crítico";

  return (
    <Document
      title={`Relatório RankBR — ${nomeSite}`}
      author="RankBR"
      subject="Diagnóstico de marketing digital"
      creator="RankBR"
    >
      {/* ══════════════════════════════════════════════════════════
          CAPA
          ══════════════════════════════════════════════════════════ */}
      <Page size="A4" style={[styles.page, styles.coverPage]}>
        {/* Logo */}
        <View style={styles.coverHeader}>
          <Text style={styles.coverLogo}>
            Rank<Text style={{ color: GREEN }}>BR</Text>
          </Text>
          <Text style={styles.coverSubtitle}>
            Diagnóstico de marketing digital
          </Text>
        </View>

        {/* Score circle (simulated with nested Views) */}
        <View style={styles.coverCenter}>
          <View style={[styles.scoreCircle, { borderColor: sColor }]}>
            <Text style={[styles.scoreNumber, { color: sColor }]}>
              {score_geral}
            </Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          <View style={[styles.scoreBadge, { backgroundColor: sColor }]}>
            <Text style={styles.scoreBadgeText}>{scoreLabel}</Text>
          </View>
          <Text style={styles.coverScoreLabel}>Score geral</Text>
        </View>

        {/* Business info */}
        <View style={styles.coverInfo}>
          <Text style={styles.coverBusinessName}>{nomeSite}</Text>
          <Text style={styles.coverUrl}>{urlSite}</Text>
          <Text style={styles.coverDate}>{dataFormatada}</Text>
        </View>

        {/* Cover footer */}
        <View style={styles.coverFooter}>
          <Text style={styles.coverFooterText}>
            Gerado por RankBR — rankbr.com.br
          </Text>
        </View>
      </Page>

      {/* ══════════════════════════════════════════════════════════
          CONTEÚDO
          ══════════════════════════════════════════════════════════ */}
      <Page size="A4" style={styles.page}>
        {/* Page header (repeated via fixed) */}
        <View fixed style={styles.pageHeader}>
          <Text style={styles.pageHeaderLogo}>
            Rank<Text style={{ color: GREEN }}>BR</Text>
          </Text>
          <Text style={styles.pageHeaderSite}>{nomeSite}</Text>
        </View>

        {/* ── Resumo executivo ───────────────────────────────────── */}
        <SectionTitle>Resumo executivo</SectionTitle>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>{relatorio.resumo_executivo}</Text>
        </View>

        {/* ── Métricas de desempenho ─────────────────────────────── */}
        <SectionTitle>Métricas de desempenho</SectionTitle>
        <View style={styles.metricsBlock}>
          <MetricBar label="Performance" score={score_performance} />
          <MetricBar label="SEO" score={score_seo} />
          <MetricBar label="Presença Local (Google Business)" score={score_business} />
        </View>

        {/* ── Pontos fortes + Problemas ──────────────────────────── */}
        <View style={styles.twoCol}>
          {/* Pontos fortes */}
          <View style={styles.colLeft}>
            <View style={[styles.colHeader, styles.colHeaderGreen]}>
              <Text style={[styles.colHeaderText, { color: GREEN }]}>
                ✓  Pontos fortes
              </Text>
            </View>
            {relatorio.pontos_fortes.map((ponto, i) => (
              <View key={i} style={styles.listItem}>
                <View style={[styles.bullet, { backgroundColor: GREEN }]}>
                  <Text style={styles.bulletText}>{i + 1}</Text>
                </View>
                <Text style={styles.listText}>{ponto}</Text>
              </View>
            ))}
          </View>

          {/* Problemas críticos */}
          <View style={styles.colRight}>
            <View style={[styles.colHeader, styles.colHeaderRed]}>
              <Text style={[styles.colHeaderText, { color: RED }]}>
                !  Problemas críticos
              </Text>
            </View>
            {relatorio.problemas_criticos.map((prob, i) => (
              <View key={i} style={styles.listItem}>
                <View style={[styles.bullet, { backgroundColor: RED }]}>
                  <Text style={styles.bulletText}>{i + 1}</Text>
                </View>
                <Text style={styles.listText}>{prob}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Plano de ação ──────────────────────────────────────── */}
        <SectionTitle>Plano de ação</SectionTitle>

        {/* Table header */}
        <View style={styles.tableHead}>
          <Text style={[styles.thCell, { width: "5%" }]}>#</Text>
          <Text style={[styles.thCell, { width: "52%" }]}>Tarefa</Text>
          <Text style={[styles.thCell, { width: "28%" }]}>Categoria</Text>
          <Text style={[styles.thCell, { width: "15%" }]}>Tempo</Text>
        </View>

        {/* Table rows */}
        {tarefas.map((t, i) => (
          <View
            key={t.id}
            wrap={false}
            style={[
              styles.tableRow,
              i % 2 === 1 ? { backgroundColor: GRAY_50 } : {},
            ]}
          >
            <View style={[styles.tdCell, { width: "5%" }]}>
              <Text style={styles.tdPri}>{t.prioridade}</Text>
            </View>
            <View style={[styles.tdCell, { width: "52%" }]}>
              <Text style={styles.tdTitle}>{t.titulo}</Text>
            </View>
            <View style={[styles.tdCell, { width: "28%" }]}>
              <Text style={styles.tdCat}>
                {CATEGORIA_LABEL[t.categoria]}
              </Text>
            </View>
            <View style={[styles.tdCell, { width: "15%" }]}>
              <Text style={styles.tdTime}>{t.tempo_estimado}</Text>
            </View>
          </View>
        ))}

        {/* Footer (repeats on every page) */}
        <PageFooter nomeSite={nomeSite} />
      </Page>
    </Document>
  );
}

export default RelatorioPDF;

// ─── Styles ───────────────────────────────────────────────────────────────────

const MARGIN = 45; // ~1.6 cm in points — gives ~2 cm with padding

const styles = StyleSheet.create({
  // ── Base page ──────────────────────────────────────────────────────────────
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: GRAY_700,
    paddingTop: MARGIN + 24, // extra room for fixed header
    paddingBottom: MARGIN + 20, // extra room for fixed footer
    paddingHorizontal: MARGIN,
  },

  // ── Cover page ─────────────────────────────────────────────────────────────
  coverPage: {
    backgroundColor: BLUE,
    paddingTop: MARGIN,
    paddingBottom: MARGIN,
    justifyContent: "space-between",
  },
  coverHeader: {
    marginBottom: 0,
  },
  coverLogo: {
    fontSize: 36,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    letterSpacing: 0.5,
  },
  coverSubtitle: {
    fontSize: 12,
    color: COVER_DIM,
    marginTop: 4,
  },
  coverCenter: {
    alignItems: "center",
  },
  scoreCircle: {
    width: 144,
    height: 144,
    borderRadius: 72,
    borderWidth: 6,
    borderStyle: "solid",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  scoreNumber: {
    fontSize: 54,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1,
  },
  scoreMax: {
    fontSize: 18,
    color: COVER_DIM,
  },
  scoreBadge: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 8,
  },
  scoreBadgeText: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
  },
  coverScoreLabel: {
    fontSize: 13,
    color: COVER_DIM,
  },
  coverInfo: {
    alignItems: "center",
  },
  coverBusinessName: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    textAlign: "center",
    marginBottom: 6,
  },
  coverUrl: {
    fontSize: 11,
    color: COVER_DIM,
    marginBottom: 6,
  },
  coverDate: {
    fontSize: 10,
    color: COVER_DIMMER,
  },
  coverFooter: {
    alignItems: "center",
  },
  coverFooterText: {
    fontSize: 9,
    color: COVER_DIMMER,
  },

  // ── Page header (fixed — repeats on every content page) ────────────────────
  pageHeader: {
    position: "absolute",
    top: 14,
    left: MARGIN,
    right: MARGIN,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: GRAY_200,
  },
  pageHeaderLogo: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: BLUE,
  },
  pageHeaderSite: {
    fontSize: 9,
    color: GRAY_500,
  },

  // ── Section titles ─────────────────────────────────────────────────────────
  sectionTitleRow: {
    marginTop: 18,
    marginBottom: 8,
    paddingLeft: 8,
    borderLeftWidth: 3,
    borderLeftStyle: "solid",
    borderLeftColor: BLUE,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: GRAY_900,
  },

  // ── Executive summary ──────────────────────────────────────────────────────
  summaryBox: {
    backgroundColor: GRAY_50,
    borderRadius: 6,
    padding: 12,
  },
  summaryText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: GRAY_700,
  },

  // ── Metrics ────────────────────────────────────────────────────────────────
  metricsBlock: {
    marginBottom: 2,
  },
  metricRow: {
    marginBottom: 10,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 10,
    color: GRAY_700,
  },
  metricValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  progressTrack: {
    height: 8,
    backgroundColor: GRAY_200,
    borderRadius: 4,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },

  // ── Two columns ────────────────────────────────────────────────────────────
  twoCol: {
    flexDirection: "row",
    marginTop: 2,
  },
  colLeft: {
    flex: 1,
    marginRight: 10,
  },
  colRight: {
    flex: 1,
  },
  colHeader: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftStyle: "solid",
  },
  colHeaderGreen: {
    backgroundColor: "#ECFDF5",
    borderLeftColor: GREEN,
  },
  colHeaderRed: {
    backgroundColor: "#FEF2F2",
    borderLeftColor: RED,
  },
  colHeaderText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bullet: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
    flexShrink: 0,
  },
  bulletText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
  },
  listText: {
    fontSize: 9,
    color: GRAY_700,
    lineHeight: 1.5,
    flex: 1,
  },

  // ── Action plan table ──────────────────────────────────────────────────────
  tableHead: {
    flexDirection: "row",
    backgroundColor: BLUE,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 1,
  },
  thCell: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    paddingRight: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: GRAY_100,
  },
  tdCell: {
    paddingRight: 4,
    justifyContent: "center",
  },
  tdPri: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: GRAY_500,
    textAlign: "center",
  },
  tdTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: GRAY_900,
  },
  tdCat: {
    fontSize: 8,
    color: GRAY_700,
    backgroundColor: GRAY_100,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    alignSelf: "flex-start",
  },
  tdTime: {
    fontSize: 8,
    color: GRAY_500,
  },

  // ── Page footer (fixed — repeats on every content page) ───────────────────
  footer: {
    position: "absolute",
    bottom: 14,
    left: MARGIN,
    right: MARGIN,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: GRAY_200,
  },
  footerLeft: {
    fontSize: 8,
    color: GRAY_500,
  },
  footerRight: {
    fontSize: 8,
    color: GRAY_500,
  },
});
