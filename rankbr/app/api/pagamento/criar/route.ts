import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase";
import { createPreference } from "@/lib/mercadopago";
import type { Segmento } from "@/types";

// ─── validation ─────────────────────────────────────────────────────────────

const bodySchema = z.object({
  url: z
    .string()
    .url("URL inválida. Informe um endereço completo, ex: https://meusite.com.br")
    .max(500),
  nomeNegocio: z.string().min(2).max(200),
  segmento: z.enum([
    "restaurante","salao_beleza","barbearia","clinica","academia",
    "escola","hotel","loja_fisica","ecommerce","servicos",
    "escritorio","imobiliaria","farmacia","supermercado","outro",
  ] as [Segmento, ...Segmento[]]),
  cidade: z.string().max(100).optional(),
  estado: z.string().length(2).optional(),
});

// ─── handler ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Auth — only authenticated users can purchase.
  const supabase = createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Você precisa estar autenticado para continuar." },
      { status: 401 }
    );
  }

  // 2. Parse and validate body.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 422 }
    );
  }

  const { url, nomeNegocio, segmento, cidade, estado } = parsed.data;

  // 3. Use the service client for all writes — bypasses RLS.
  const db = createServiceSupabaseClient();

  // 4. Insert into sites.
  const { data: site, error: siteError } = await db
    .from("sites")
    .insert({
      user_id: user.id,
      url,
      nome: nomeNegocio,
      segmento,
      cidade: cidade ?? null,
      estado: estado ?? null,
    })
    .select("id")
    .single();

  if (siteError || !site) {
    console.error("[pagamento/criar] site insert error:", siteError);
    return NextResponse.json(
      { error: "Erro ao salvar os dados do site. Tente novamente." },
      { status: 500 }
    );
  }

  // 5. Insert into pagamentos (status: pendente).
  const { data: pagamento, error: pagamentoError } = await db
    .from("pagamentos")
    .insert({
      site_id: site.id,
      user_id: user.id,
      status: "pendente",
      valor: 10.0,
    })
    .select("id")
    .single();

  if (pagamentoError || !pagamento) {
    console.error("[pagamento/criar] pagamento insert error:", pagamentoError);
    return NextResponse.json(
      { error: "Erro ao registrar o pagamento. Tente novamente." },
      { status: 500 }
    );
  }

  // 6. Insert into analises (status: aguardando).
  const { data: analise, error: analiseError } = await db
    .from("analises")
    .insert({
      pagamento_id: pagamento.id,
      site_id: site.id,
      user_id: user.id,
      status: "aguardando",
    })
    .select("id")
    .single();

  if (analiseError || !analise) {
    console.error("[pagamento/criar] analise insert error:", analiseError);
    // Non-fatal: the webhook will create the analise record when payment is approved.
    // Continue to create the MP preference.
  }

  // 7. Create the Mercado Pago Checkout Pro preference.
  let initPoint: string;
  try {
    initPoint = await createPreference({
      siteId: site.id,
      nomeNegocio,
      email: user.email ?? "",
      pagamentoId: pagamento.id,
    });
  } catch (err) {
    console.error("[pagamento/criar] MP preference error:", err);
    return NextResponse.json(
      { error: "Erro ao criar a sessão de pagamento. Tente novamente em alguns segundos." },
      { status: 502 }
    );
  }

  // 8. Persist the MP preference ID for later reconciliation.
  const prefId = initPoint.split("pref_id=")[1] ?? null;
  if (prefId) {
    await db
      .from("pagamentos")
      .update({ mp_preference_id: prefId })
      .eq("id", pagamento.id);
  }

  return NextResponse.json({
    init_point: initPoint,
    pagamentoId: pagamento.id,
    analiseId: analise?.id ?? null,
  });
}
