import Link from "next/link";
import {
  Search,
  Zap,
  MapPin,
  Tag,
  ListChecks,
  FileDown,
  Utensils,
  Scissors,
  Stethoscope,
  ShoppingBag,
  Wrench,
  Star,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Globe,
  BarChart3,
  Shield,
  Clock,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/* ─── brand tokens ────────────────────────────────────────────────────── */
const GREEN = "#00A651";
const BLUE = "#003087";

/* ─── data ────────────────────────────────────────────────────────────── */
const steps = [
  {
    number: "01",
    icon: Globe,
    title: "Informe seu site e segmento",
    description:
      "Cole a URL do seu negócio, escolha o segmento e responda 3 perguntas rápidas sobre seus objetivos.",
  },
  {
    number: "02",
    icon: CreditCard,
    title: "Pague R$10 via PIX ou cartão",
    description:
      "Pagamento seguro e instantâneo. Sem assinatura, sem mensalidade — você paga uma vez e recebe para sempre.",
  },
  {
    number: "03",
    icon: FileDown,
    title: "Receba seu plano de ação",
    description:
      "Em até 5 minutos, seu diagnóstico completo chega no e-mail com PDF e um plano de ação priorizado por IA.",
  },
];

const deliverables = [
  {
    icon: Search,
    title: "Análise de SEO",
    description:
      "Pontuação completa de otimização para mecanismos de busca, com os erros mais críticos identificados.",
  },
  {
    icon: Zap,
    title: "Velocidade do site",
    description:
      "Core Web Vitals, tempo de carregamento e impacto na conversão e no ranking do Google.",
  },
  {
    icon: MapPin,
    title: "Presença no Google Maps",
    description:
      "Análise do Google Business Profile e oportunidades de aparecer nas buscas locais da sua cidade.",
  },
  {
    icon: Tag,
    title: "Palavras-chave",
    description:
      "As principais buscas que seus clientes fazem e como seu site está posicionado para cada uma.",
  },
  {
    icon: ListChecks,
    title: "Lista de tarefas priorizadas",
    description:
      "Plano de ação em ordem de impacto: do que resolve mais rápido ao que gera resultado a longo prazo.",
  },
  {
    icon: FileDown,
    title: "Relatório em PDF",
    description:
      "Documento profissional para apresentar para sua equipe, agência ou guardar de referência.",
  },
];

const audiences = [
  { icon: Utensils, label: "Restaurantes e lanchonetes" },
  { icon: Scissors, label: "Salões e barbearias" },
  { icon: Stethoscope, label: "Clínicas e consultórios" },
  { icon: ShoppingBag, label: "Lojas físicas e e-commerce" },
  { icon: Wrench, label: "Prestadores de serviço" },
  { icon: Globe, label: "Qualquer PME brasileira" },
];

const testimonials = [
  {
    name: "Maria Silva",
    role: "Dona de salão • São Paulo – SP",
    avatar: "MS",
    stars: 5,
    text: "Eu não entendia nada de Google. O relatório do RankBR me mostrou exatamente o que precisava mudar e em 2 semanas meu salão apareceu nas buscas do bairro. Valeu muito mais do que R$10.",
  },
  {
    name: "Carlos Mendes",
    role: "Restaurante • Belo Horizonte – MG",
    avatar: "CM",
    stars: 5,
    text: "Meu restaurante estava invisível no Google Maps mesmo sendo o melhor da região. Segui o plano de ação e hoje recebo ligações de clientes novos toda semana.",
  },
  {
    name: "Ana Paula Costa",
    role: "Clínica estética • Rio de Janeiro – RJ",
    avatar: "AC",
    stars: 5,
    text: "Contratei agência de marketing por R$2.000 por mês e nunca recebi um relatório tão claro quanto esse. Recomendo para qualquer empresa que queira crescer online.",
  },
];

const faqs = [
  {
    q: "Como funciona o diagnóstico?",
    a: "Nossa IA analisa automaticamente o seu site em mais de 50 critérios de marketing digital: SEO técnico, velocidade, presença local, palavras-chave, redes sociais e muito mais. Tudo isso em minutos, sem precisar instalar nada.",
  },
  {
    q: "Quanto tempo leva para receber o relatório?",
    a: "O diagnóstico é gerado em até 5 minutos após a confirmação do pagamento. Você recebe o PDF completo diretamente no e-mail informado no cadastro.",
  },
  {
    q: "O que acontece depois que eu pago?",
    a: "Você será redirecionado para uma tela de confirmação e receberá o relatório por e-mail. Não há cobrança recorrente — o R$10 é único por análise. Se quiser uma nova análise futuramente, basta contratar novamente.",
  },
  {
    q: "Preciso ter conhecimento técnico?",
    a: "Não. O relatório foi criado para ser lido por qualquer pessoa — dono de negócio, atendente ou gerente. Cada recomendação vem com uma explicação simples do que fazer e por quê.",
  },
  {
    q: "O diagnóstico serve para qualquer tipo de negócio?",
    a: "Sim, desde que você tenha um site ou presença online. Funciona para restaurantes, salões, clínicas, lojas, prestadores de serviço, e-commerces e qualquer pequena ou média empresa brasileira.",
  },
];

const pricing = [
  "Análise de SEO completa (50+ critérios)",
  "Diagnóstico de velocidade e Core Web Vitals",
  "Análise do Google Maps e perfil local",
  "Relatório de palavras-chave do seu segmento",
  "Lista de ações priorizadas por impacto",
  "Relatório profissional em PDF",
  "Plano de ação gerado por IA",
  "Entrega em até 5 minutos",
];

/* ─── subcomponents ───────────────────────────────────────────────────── */

function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: GREEN }}
          >
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <span
            className="text-xl font-bold"
            style={{ color: BLUE }}
          >
            Rank<span style={{ color: GREEN }}>BR</span>
          </span>
        </Link>

        {/* Nav links — hidden on mobile */}
        <nav className="hidden items-center gap-6 md:flex">
          {[
            ["Como funciona", "#como-funciona"],
            ["O que inclui", "#o-que-inclui"],
            ["Preço", "#preco"],
            ["FAQ", "#faq"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <Link href="/cadastro">
          <Button
            className="text-white shadow-sm"
            style={{ backgroundColor: GREEN }}
          >
            Analisar meu site
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </header>
  );
}

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
      {/* header bar */}
      <div className="mb-4 flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-red-400" />
        <div className="h-3 w-3 rounded-full bg-yellow-400" />
        <div className="h-3 w-3 rounded-full bg-green-400" />
        <div className="ml-2 flex-1 rounded bg-gray-100 px-3 py-1 text-xs text-gray-400">
          rankbr.com.br/relatorio/sua-empresa
        </div>
      </div>

      {/* score hero */}
      <div
        className="mb-4 rounded-xl p-4 text-white"
        style={{ background: `linear-gradient(135deg, ${BLUE}, ${GREEN})` }}
      >
        <p className="mb-1 text-xs font-medium opacity-80">
          Diagnóstico de Marketing Digital
        </p>
        <p className="text-2xl font-bold">Pontuação Geral</p>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-5xl font-black">68</span>
          <span className="mb-1 text-lg opacity-70">/100</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-white/30">
          <div
            className="h-2 rounded-full bg-white"
            style={{ width: "68%" }}
          />
        </div>
      </div>

      {/* metric rows */}
      {[
        { label: "SEO Técnico", score: 72, color: GREEN, status: "Bom" },
        { label: "Velocidade", score: 45, color: "#f59e0b", status: "Atenção" },
        { label: "Google Maps", score: 30, color: "#ef4444", status: "Crítico" },
        { label: "Palavras-chave", score: 81, color: GREEN, status: "Bom" },
      ].map(({ label, score, color, status }) => (
        <div key={label} className="mb-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-gray-700">{label}</span>
            <span className="font-semibold" style={{ color }}>
              {status} · {score}/100
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{ width: `${score}%`, backgroundColor: color }}
            />
          </div>
        </div>
      ))}

      {/* action pill */}
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
        <ListChecks className="h-4 w-4 shrink-0" style={{ color: GREEN }} />
        <p className="text-xs font-medium text-green-800">
          12 ações priorizadas prontas para executar
        </p>
        <ChevronRight className="ml-auto h-4 w-4" style={{ color: GREEN }} />
      </div>

      {/* floating badge */}
      <div
        className="absolute -right-3 -top-3 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-white shadow-lg"
        style={{ backgroundColor: GREEN }}
      >
        <Shield className="h-3 w-3" />
        PDF incluso
      </div>
    </div>
  );
}

/* ─── page ────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <>
      <Navbar />

      {/* ── 1. HERO ──────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(160deg, #f0faf5 0%, #e8f0fb 50%, #f8f8ff 100%)`,
        }}
      >
        {/* subtle background shapes */}
        <div
          className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full opacity-10"
          style={{ backgroundColor: GREEN }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full opacity-10"
          style={{ backgroundColor: BLUE }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* copy */}
            <div>
              {/* badge */}
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1">
                <div
                  className="h-2 w-2 animate-pulse rounded-full"
                  style={{ backgroundColor: GREEN }}
                />
                <span className="text-xs font-semibold" style={{ color: GREEN }}>
                  Diagnóstico com IA • Entrega em 5 minutos
                </span>
              </div>

              <h1
                className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl"
                style={{ color: BLUE }}
              >
                Seu negócio no topo do{" "}
                <span
                  className="relative inline-block"
                  style={{ color: GREEN }}
                >
                  Google
                  <span
                    className="absolute -bottom-1 left-0 h-1 w-full rounded-full opacity-30"
                    style={{ backgroundColor: GREEN }}
                  />
                </span>{" "}
                por{" "}
                <span style={{ color: GREEN }}>R$10</span>
              </h1>

              <p className="mt-5 text-lg leading-relaxed text-gray-600 sm:text-xl">
                Diagnóstico completo de marketing digital + plano de ação
                personalizado com IA para sua empresa aparecer nas buscas e
                atrair mais clientes.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/cadastro">
                  <Button
                    size="lg"
                    className="w-full text-base font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5 sm:w-auto"
                    style={{ backgroundColor: GREEN }}
                  >
                    Analisar meu site agora
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <p className="text-sm text-gray-500">
                  Apenas R$10 · Sem assinatura
                </p>
              </div>

              {/* social proof */}
              <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-gray-200 pt-8">
                <div className="flex -space-x-2">
                  {["MS", "CM", "AC", "JP", "LF"].map((initials) => (
                    <div
                      key={initials}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white"
                      style={{
                        backgroundColor:
                          initials === "MS" || initials === "AC" || initials === "LF"
                            ? GREEN
                            : BLUE,
                      }}
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    <strong className="text-gray-800">+2.400 empresas</strong>{" "}
                    brasileiras já analisadas
                  </p>
                </div>
              </div>
            </div>

            {/* mockup */}
            <div className="flex justify-center lg:justify-end">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. COMO FUNCIONA ─────────────────────────────────────────── */}
      <section id="como-funciona" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p
              className="mb-2 text-sm font-semibold uppercase tracking-widest"
              style={{ color: GREEN }}
            >
              Simples assim
            </p>
            <h2
              className="text-3xl font-black sm:text-4xl"
              style={{ color: BLUE }}
            >
              Como funciona
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-600">
              Do cadastro ao relatório em menos de 10 minutos — sem instalar
              nada, sem conhecimento técnico necessário.
            </p>
          </div>

          <div className="relative grid gap-8 md:grid-cols-3">
            {/* connector line */}
            <div
              className="absolute left-1/2 top-10 hidden h-0.5 w-2/3 -translate-x-1/2 md:block"
              style={{
                background: `linear-gradient(90deg, ${GREEN}, ${BLUE})`,
              }}
            />

            {steps.map(({ number, icon: Icon, title, description }) => (
              <div
                key={number}
                className="relative flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                {/* step number */}
                <div
                  className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white text-2xl font-black text-white shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${GREEN}, ${BLUE})`,
                  }}
                >
                  {number}
                </div>
                <Icon
                  className="mb-3 h-6 w-6"
                  style={{ color: GREEN }}
                />
                <h3
                  className="mb-2 text-lg font-bold"
                  style={{ color: BLUE }}
                >
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. O QUE VOCÊ RECEBE ─────────────────────────────────────── */}
      <section
        id="o-que-inclui"
        className="py-20"
        style={{ backgroundColor: "#f7f9fc" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p
              className="mb-2 text-sm font-semibold uppercase tracking-widest"
              style={{ color: GREEN }}
            >
              Tudo em um único relatório
            </p>
            <h2
              className="text-3xl font-black sm:text-4xl"
              style={{ color: BLUE }}
            >
              O que você recebe
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-600">
              Um diagnóstico completo que normalmente custaria centenas de reais
              em agências — por apenas R$10.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {deliverables.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${GREEN}18` }}
                >
                  <Icon className="h-6 w-6" style={{ color: GREEN }} />
                </div>
                <h3
                  className="mb-2 text-base font-bold"
                  style={{ color: BLUE }}
                >
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. PARA QUEM É ───────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p
                className="mb-2 text-sm font-semibold uppercase tracking-widest"
                style={{ color: GREEN }}
              >
                Feito para a realidade brasileira
              </p>
              <h2
                className="mb-4 text-3xl font-black sm:text-4xl"
                style={{ color: BLUE }}
              >
                Para quem é o RankBR?
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-gray-600">
                Qualquer pequena ou média empresa que precisa aparecer no Google
                mas não tem tempo ou dinheiro para contratar uma agência. O
                RankBR entrega em minutos o que levaria semanas.
              </p>
              <Link href="/cadastro">
                <Button
                  size="lg"
                  className="font-bold text-white"
                  style={{ backgroundColor: BLUE }}
                >
                  Meu negócio se encaixa — quero analisar
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              {audiences.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-4 text-center transition-colors hover:border-green-200 hover:bg-green-50"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${GREEN}18` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: GREEN }} />
                  </div>
                  <p className="text-xs font-medium leading-tight text-gray-700">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. DEPOIMENTOS ───────────────────────────────────────────── */}
      <section
        className="py-20"
        style={{
          background: `linear-gradient(160deg, #f0faf5 0%, #e8f0fb 100%)`,
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p
              className="mb-2 text-sm font-semibold uppercase tracking-widest"
              style={{ color: GREEN }}
            >
              Quem já usou, aprovou
            </p>
            <h2
              className="text-3xl font-black sm:text-4xl"
              style={{ color: BLUE }}
            >
              O que nossos clientes dizem
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map(({ name, role, avatar, stars, text }) => (
              <div
                key={name}
                className="flex flex-col rounded-2xl border border-white/80 bg-white p-6 shadow-sm"
              >
                {/* stars */}
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                <p className="flex-1 text-sm leading-relaxed text-gray-600">
                  &ldquo;{text}&rdquo;
                </p>

                <div className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-4">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: BLUE }}
                  >
                    {avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{name}</p>
                    <p className="text-xs text-gray-400">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. PREÇO ─────────────────────────────────────────────────── */}
      <section id="preco" className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p
              className="mb-2 text-sm font-semibold uppercase tracking-widest"
              style={{ color: GREEN }}
            >
              Sem surpresas
            </p>
            <h2
              className="text-3xl font-black sm:text-4xl"
              style={{ color: BLUE }}
            >
              Preço único e transparente
            </h2>
          </div>

          {/* pricing card */}
          <div
            className="relative overflow-hidden rounded-3xl p-1 shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${GREEN}, ${BLUE})`,
            }}
          >
            <div className="rounded-[20px] bg-white p-8 sm:p-10">
              {/* price */}
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Diagnóstico completo
                  </p>
                  <div className="flex items-end gap-1">
                    <span
                      className="text-6xl font-black"
                      style={{ color: BLUE }}
                    >
                      R$10
                    </span>
                    <span className="mb-2 text-sm text-gray-400">
                      por análise
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Pagamento único · Sem assinatura
                  </p>
                </div>
                <div
                  className="rounded-xl px-4 py-2 text-sm font-bold text-white"
                  style={{ backgroundColor: GREEN }}
                >
                  Mais popular
                </div>
              </div>

              {/* list */}
              <ul className="mb-8 space-y-3">
                {pricing.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2
                      className="h-5 w-5 shrink-0"
                      style={{ color: GREEN }}
                    />
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link href="/cadastro" className="block">
                <Button
                  size="lg"
                  className="w-full text-base font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: GREEN }}
                >
                  Começar agora por R$10
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>

              <p className="mt-3 text-center text-xs text-gray-400">
                PIX ou cartão de crédito · Pagamento seguro
              </p>
            </div>
          </div>

          {/* trust badges */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            {(
              [
                { Icon: Shield, text: "Pagamento seguro" },
                { Icon: Clock, text: "Entrega em 5 minutos" },
                { Icon: CheckCircle2, text: "Sem assinatura" },
              ] as const
            ).map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon className="h-4 w-4" style={{ color: GREEN }} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. FAQ ───────────────────────────────────────────────────── */}
      <section
        id="faq"
        className="py-20"
        style={{ backgroundColor: "#f7f9fc" }}
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p
              className="mb-2 text-sm font-semibold uppercase tracking-widest"
              style={{ color: GREEN }}
            >
              Dúvidas frequentes
            </p>
            <h2
              className="text-3xl font-black sm:text-4xl"
              style={{ color: BLUE }}
            >
              Perguntas e respostas
            </h2>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <Accordion type="single" collapsible className="px-6">
              {faqs.map(({ q, a }, i) => (
                <AccordionItem key={q} value={`item-${i}`}>
                  <AccordionTrigger
                    className="text-left text-sm font-semibold text-gray-800 hover:no-underline"
                  >
                    {q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-gray-500">
                    {a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Ainda tem dúvidas?{" "}
              <a
                href="mailto:oi@rankbr.com.br"
                className="font-semibold"
                style={{ color: GREEN }}
              >
                Fale conosco
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────── */}
      <section
        className="py-20"
        style={{
          background: `linear-gradient(135deg, ${BLUE} 0%, #00527a 50%, ${GREEN} 100%)`,
        }}
      >
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-white sm:text-4xl">
            Pronto para aparecer no Google?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
            Faça o diagnóstico agora e descubra exatamente o que seu negócio
            precisa para crescer online.
          </p>
          <Link href="/cadastro" className="mt-8 inline-block">
            <Button
              size="lg"
              className="bg-white text-base font-bold shadow-xl transition-transform hover:-translate-y-0.5"
              style={{ color: BLUE }}
            >
              Analisar meu site agora — R$10
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-4 text-sm text-white/60">
            +2.400 empresas brasileiras já analisadas
          </p>
        </div>
      </section>

      {/* ── 8. FOOTER ────────────────────────────────────────────────── */}
      <footer style={{ backgroundColor: "#0a1628" }}>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* brand */}
            <div className="lg:col-span-2">
              <div className="mb-3 flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: GREEN }}
                >
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">
                  Rank<span style={{ color: GREEN }}>BR</span>
                </span>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-gray-400">
                Diagnóstico de marketing digital com IA para pequenas e médias
                empresas brasileiras.
              </p>
              <p className="mt-4 text-xs text-gray-600">
                © {new Date().getFullYear()} RankBR. Todos os direitos reservados.
              </p>
            </div>

            {/* product */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Produto
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                {[
                  ["Como funciona", "#como-funciona"],
                  ["O que inclui", "#o-que-inclui"],
                  ["Preço", "#preco"],
                  ["Criar conta", "/cadastro"],
                  ["Entrar", "/login"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="transition-colors hover:text-white"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* legal */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Legal
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                {[
                  ["Termos de uso", "/termos"],
                  ["Política de privacidade", "/privacidade"],
                  ["Contato", "mailto:oi@rankbr.com.br"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="transition-colors hover:text-white"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
