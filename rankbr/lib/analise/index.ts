/**
 * Public API for the RankBR analysis engine.
 *
 * Import from here rather than from individual modules so internal
 * implementation details stay encapsulated.
 *
 * Usage:
 *   import { rodarAnalise } from "@/lib/analise";
 */

export { rodarAnalise }          from "./orquestrador";
export { analisarPageSpeed }     from "./pagespeed";
export { analisarSeoBasico }     from "./seo-basico";
export { buscarGoogleBusiness }  from "./google-business";
export { sugerirPalavrasChave }  from "./palavras-chave";
export { gerarRelatorioIA }      from "./ia";
