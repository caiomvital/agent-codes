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
  | "restaurante"
  | "salao_beleza"
  | "barbearia"
  | "clinica"
  | "academia"
  | "escola"
  | "hotel"
  | "loja_fisica"
  | "ecommerce"
  | "servicos"
  | "escritorio"
  | "imobiliaria"
  | "farmacia"
  | "supermercado"
  | "outro";

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
  { uf: "AC", nome: "Acre" },
  { uf: "AL", nome: "Alagoas" },
  { uf: "AM", nome: "Amazonas" },
  { uf: "AP", nome: "Amapá" },
  { uf: "BA", nome: "Bahia" },
  { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" },
  { uf: "ES", nome: "Espírito Santo" },
  { uf: "GO", nome: "Goiás" },
  { uf: "MA", nome: "Maranhão" },
  { uf: "MG", nome: "Minas Gerais" },
  { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MT", nome: "Mato Grosso" },
  { uf: "PA", nome: "Pará" },
  { uf: "PB", nome: "Paraíba" },
  { uf: "PE", nome: "Pernambuco" },
  { uf: "PI", nome: "Piauí" },
  { uf: "PR", nome: "Paraná" },
  { uf: "RJ", nome: "Rio de Janeiro" },
  { uf: "RN", nome: "Rio Grande do Norte" },
  { uf: "RO", nome: "Rondônia" },
  { uf: "RR", nome: "Roraima" },
  { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "SC", nome: "Santa Catarina" },
  { uf: "SE", nome: "Sergipe" },
  { uf: "SP", nome: "São Paulo" },
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
  | "pendente"
  | "aprovado"
  | "recusado"
  | "cancelado"
  | "expirado";

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

export type StatusAnalise =
  | "aguardando"
  | "processando"
  | "concluida"
  | "erro";

export interface Analise {
  id: string;
  pagamento_id: string;
  site_id: string;
  user_id: string;
  status: StatusAnalise;
  resultado?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ─── api helpers ───────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}
