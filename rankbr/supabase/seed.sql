-- ============================================================
--  RankBR — Seed data for local development
-- ============================================================
-- Run AFTER schema.sql.
-- Uses a fixed UUID for the test user so foreign keys stay consistent.
--
-- IMPORTANT: This creates a test user ONLY in the public.users table.
-- To sign in, create the matching auth user via:
--   Supabase Dashboard → Authentication → Users → Add user
--   Email: dev@rankbr.com.br  Password: Dev@123456
--   Then copy the auto-generated UUID and replace DEV_USER_ID below.
--
-- Or, sign up through the app UI and replace DEV_USER_ID with your real UUID:
--   select id from auth.users limit 1;
-- ============================================================

-- Replace this with your real auth.users UUID:
\set DEV_USER_ID '00000000-0000-0000-0000-000000000001'

-- ── users ────────────────────────────────────────────────────────────────────
insert into public.users (id, email, name, role)
values (:'DEV_USER_ID', 'dev@rankbr.com.br', 'Dev Tester', 'user')
on conflict (id) do nothing;

-- ── site ─────────────────────────────────────────────────────────────────────
insert into public.sites (id, user_id, url, nome, segmento, cidade, estado)
values (
  '10000000-0000-0000-0000-000000000001',
  :'DEV_USER_ID',
  'https://restauranteexemplo.com.br',
  'Restaurante Exemplo',
  'restaurante',
  'São Paulo',
  'SP'
) on conflict (id) do nothing;

-- ── pagamento (aprovado) ──────────────────────────────────────────────────────
insert into public.pagamentos (id, site_id, user_id, status, valor, mp_payment_id)
values (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  :'DEV_USER_ID',
  'aprovado',
  10.00,
  'mp_test_123456'
) on conflict (id) do nothing;

-- ── analise concluída com resultado mock ──────────────────────────────────────
insert into public.analises (id, pagamento_id, site_id, user_id, status, resultado)
values (
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  :'DEV_USER_ID',
  'concluida',
  '{
    "score_geral": 62,
    "score_performance": 55,
    "score_seo": 68,
    "score_business": 60,
    "gerado_em": "2024-01-15T10:30:00Z",
    "relatorio": {
      "resumo_executivo": "O site apresenta desempenho médio com oportunidades claras de melhoria em velocidade de carregamento e SEO técnico.",
      "pontos_fortes": [
        "Site com HTTPS ativo e certificado válido",
        "Presença no Google Business Profile com 4.2 estrelas",
        "Boa estrutura de headings H1 e H2"
      ],
      "problemas_criticos": [
        "Tempo de carregamento acima de 4 segundos no mobile",
        "Meta descriptions ausentes em 60% das páginas",
        "Imagens sem atributo alt prejudicando acessibilidade e SEO"
      ],
      "tarefas": []
    },
    "pagespeed": { "performance_score": 55, "error": null },
    "seo": { "score": 68, "error": null },
    "google_business": { "encontrado": true, "rating": 4.2, "total_avaliacoes": 87 },
    "palavras_chave": { "palavras": [], "fonte": "ia" }
  }'::jsonb
) on conflict (id) do nothing;

-- ── tarefas mock ─────────────────────────────────────────────────────────────
insert into public.tarefas (analise_id, titulo, descricao, categoria, prioridade, tempo_estimado, concluida)
values
  ('30000000-0000-0000-0000-000000000001', 'Otimizar imagens para WebP', 'Converta todas as imagens para o formato WebP e adicione lazy loading. Isso pode reduzir o tempo de carregamento em até 40%.', 'performance', 1, '2-3 horas', false),
  ('30000000-0000-0000-0000-000000000001', 'Adicionar meta descriptions', 'Escreva meta descriptions únicas de 150-160 caracteres para cada página. Inclua a palavra-chave principal e um call-to-action claro.', 'seo', 2, '1-2 horas', false),
  ('30000000-0000-0000-0000-000000000001', 'Adicionar alt text nas imagens', 'Inclua descrições alt em todas as imagens do site. Use palavras-chave relevantes de forma natural.', 'seo', 3, '1 hora', true),
  ('30000000-0000-0000-0000-000000000001', 'Responder avaliações no Google', 'Responda todas as avaliações (positivas e negativas) no Google Business Profile. Isso melhora o score de engajamento.', 'google_business', 4, '30 min/semana', false),
  ('30000000-0000-0000-0000-000000000001', 'Criar sitemap.xml e enviar ao Google', 'Gere um sitemap.xml atualizado e envie pelo Google Search Console para acelerar a indexação das páginas.', 'seo', 5, '1 hora', false),
  ('30000000-0000-0000-0000-000000000001', 'Implementar cache de browser', 'Configure headers de cache para recursos estáticos (imagens, CSS, JS). Use Cache-Control com max-age de 31536000 para assets com hash.', 'performance', 6, '2 horas', false),
  ('30000000-0000-0000-0000-000000000001', 'Adicionar fotos ao Google Business', 'Publique pelo menos 10 fotos de alta qualidade do estabelecimento, pratos e equipe. Perfis com fotos recebem 42% mais pedidos de rotas.', 'google_business', 7, '1-2 horas', false),
  ('30000000-0000-0000-0000-000000000001', 'Criar página "Sobre nós" com schema markup', 'Desenvolva uma página sobre com história, equipe e missão. Adicione schema LocalBusiness para melhor presença nos resultados de busca.', 'conteudo', 8, '3-4 horas', false),
  ('30000000-0000-0000-0000-000000000001', 'Configurar Google Analytics 4', 'Instale o GA4 e configure eventos de conversão (reservas, cliques no WhatsApp, visualizações do cardápio).', 'outro', 9, '2 horas', false),
  ('30000000-0000-0000-0000-000000000001', 'Publicar conteúdo semanal no blog', 'Crie 1 post por semana sobre culinária, dicas e novidades. Foque nas palavras-chave do seu segmento para atrair tráfego orgânico.', 'conteudo', 10, 'Recorrente', false)
on conflict do nothing;

-- ============================================================
--  Seed concluído! Acesse /dashboard para ver o relatório demo.
-- ============================================================
