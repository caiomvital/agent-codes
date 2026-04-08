// ─── auth ──────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "user";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
}

// ─── business ──────────────────────────────────────────────────────────────

export type Segmento =
  | "restaurante" | "salao_beleza" | "barbearia" | "clinica" | "academia"
  | "escola" | "hotel" | "loja_fisica" | "ecommerce" | "servicos"
  | "escritorio" | "imobiliaria" | "farmacia" | "supermercado" | "outro";

export const SEGMENTOS: Record<Segmento, string> = {
  restaurante: "Restaurante / Lanchonete",
  salao_beleza: "Salão de Beleza",
  barbearia: "Barbearia",
  clinica: "Clínica / Consultório",
  academia: "Academia / Fitness",
  escola: "Escola / Curso",
  hotel: "Hotel / Pousada",
  loja_fisica: "Loja Física",
  ecommerce: "E-commerce",
  servicos: "Prestador de Serviços",
  escritorio: "Escritório / Consultoria",
  imobiliaria: "Imobiliária",
  farmacia: "Farmácia / Drogaria",
  supermercado: "Supermercado / Mercado",
  outro: "Outro",
};

export const ESTADOS_BR: { uf: string; nome: string }[] = [
  { uf: "AC", nome: "Acre" }, { uf: "AL", nome: "Alagoas" },
  { uf: "AM", nome: "Amazonas" }, { uf: "AP", nome: "Amapá" },
  { uf: "BA", nome: "Bahia" }, { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" }, { uf: "ES", nome: "Espírito Santo" },
  { uf: "GO", nome: "Goiás" }, { uf: "MA", nome: "Maranhão" },
  { uf: "MG", nome: "Minas Gerais" }, { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MT", nome: "Mato Grosso" }, { uf: "PA", nome: "Pará" },
  { uf: "PB", nome: "Paraíba" }, { uf: "PE", nome: "Pernambuco" },
  { uf: "PI", nome: "Piauí" }, { uf: "PR", nome: "Paraná" },
  { uf: "RJ", nome: "Rio de Janeiro" }, { uf: "RN", nome: "Rio Grande do Norte" },
  { uf: "RO", nome: "Rondônia" }, { uf: "RR", nome: "Roraima" },
  { uf: "RS", nome: "Rio Grande do Sul" }, { uf: "SC", nome: "Santa Catarina" },
  { uf: "SE", nome: "Sergipe" }, { uf: "SP", nome: "São Paulo" },
  { uf: "TO", nome: "Tocantins" },
];

// ─── database rows ─────────────────────────────────────────────────────────

export interface Site {
  id: string;
  user_id: string;
  url: string;
  nome: string;
  segmento: Segmento;
  cidade?: string;
  estado?: string;
  created_at: string;
}

export type StatusPagamento =
  | "pendente" | "aprovado" | "recusado" | "cancelado" | "expirado";

export interface Pagamento {
  id: string;
  site_id: string;
  user_id: string;
  mp_preference_id?: string;
  mp_payment_id?: string;
  status: StatusPagamento;
  valor: number;
  created_at: string;
  updated_at: string;
}

export type StatusAnalise = "aguardando" | "processando" | "concluida" | "erro";

export interface Analise {
  id: string;
  pagamento_id: string;
  site_id: string;
  user_id: string;
  status: StatusAnalise;
  resultado?: ResultadoAnalise;
  created_at: string;
  updated_at: string;
}

// ─── analysis results ───────────────────────────────────────────────────────

export type MetricScore = "good" | "needs-improvement" | "poor";

export interface PageSpeedMetric {
  value: number;    // Raw value
  unit: string;     // "ms", "s", "unitless"
  display: string;  // Human-readable, e.g. "2.5 s"
  score: MetricScore;
}

export interface PageSpeedResult {
  performance_score: number; // 0–100
  metrics: {
    lcp: PageSpeedMetric;   // Largest Contentful Paint
    tbt: PageSpeedMetric;   // Total Blocking Time (lab proxy for FID)
    cls: PageSpeedMetric;   // Cumulative Layout Shift
    fcp: PageSpeedMetric;   // First Contentful Paint
    ttfb: PageSpeedMetric;  // Time to First Byte
  };
  error?: string;
}

export interface SeoCheck {
  passed: boolean;
  value?: string | number;
  message: string;
}

export interface SeoBasicoResult {
  score: number; // 0–100
  https: SeoCheck;
  title: SeoCheck;
  meta_description: SeoCheck;
  h1: SeoCheck;
  canonical: SeoCheck;
  meta_robots: SeoCheck;
  og_tags: SeoCheck;
  robots_txt: SeoCheck;
  sitemap: SeoCheck;
  images_without_alt: SeoCheck;
  h2_count: number;
  error?: string;
}

export interface GoogleBusinessResult {
  encontrado: boolean;
  nome?: string;
  rating?: number;
  total_avaliacoes?: number;
  verificado?: boolean;
  horarios?: string[];
  fotos_count?: number;
  place_id?: string;
  endereco?: string;
  error?: string;
}

export type VolumeEstimado = "alto" | "medio" | "baixo";
export type DificuldadeKW  = "alta"  | "media" | "baixa";
export type IntencaoBusca  =
  | "informacional" | "navegacional" | "transacional" | "comercial";

export interface PalavraChave {
  termo: string;
  volume_estimado: VolumeEstimado;
  dificuldade: DificuldadeKW;
  intencao: IntencaoBusca;
  relevancia: number; // 1–10
}

export interface PalavrasChaveResult {
  palavras: PalavraChave[];
  fonte: "dataforseo" | "ia";
  error?: string;
}

export type CategoriaTarefa =
  | "seo" | "performance" | "google_business" | "conteudo" | "outro";

export interface TarefaGerada {
  titulo: string;
  descricao: string;
  categoria: CategoriaTarefa;
  prioridade: number; // 1 = mais urgente … 10 = mais baixo
  tempo_estimado: string;
}

export interface RelatorioIA {
  resumo_executivo: string;
  pontos_fortes: string[];       // exactly 3
  problemas_criticos: string[];  // exactly 3
  tarefas: TarefaGerada[];       // 10 prioritised actions
}

export interface ResultadoAnalise {
  score_geral: number;
  score_performance: number;
  score_seo: number;
  score_business: number;
  pagespeed: PageSpeedResult;
  seo: SeoBasicoResult;
  google_business: GoogleBusinessResult;
  palavras_chave: PalavrasChaveResult;
  relatorio: RelatorioIA;
  gerado_em: string;
}

// ─── api helpers ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}
