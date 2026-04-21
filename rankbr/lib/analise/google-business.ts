/**
 * Module 3 — Google Places API (New, v1)
 *
 * Searches for the business by name + city using the Places Text Search endpoint.
 * Returns structured data if found, or { encontrado: false } otherwise.
 *
 * Requires: GOOGLE_PLACES_API_KEY
 *
 * @see https://developers.google.com/maps/documentation/places/web-service/text-search
 */

import type { GoogleBusinessResult } from "@/types";

const PLACES_URL = "https://places.googleapis.com/v1/places:searchText";

// Fields we request — controls billing (only pay for what you use).
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.rating",
  "places.userRatingCount",
  "places.businessStatus",
  "places.regularOpeningHours",
  "places.photos",
  "places.formattedAddress",
  "places.googleMapsUri",
].join(",");

interface PlacesTextSearchResponse {
  places?: Array<{
    id?: string;
    displayName?: { text?: string };
    rating?: number;
    userRatingCount?: number;
    businessStatus?: string;
    regularOpeningHours?: { weekdayDescriptions?: string[] };
    photos?: unknown[];
    formattedAddress?: string;
    googleMapsUri?: string;
  }>;
}

export async function buscarGoogleBusiness(
  nomeNegocio: string,
  cidade?: string,
  estado?: string
): Promise<GoogleBusinessResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return {
      encontrado: false,
      error: "GOOGLE_PLACES_API_KEY não configurado — análise do Google Business ignorada",
    };
  }

  // Build the most specific query possible.
  const locationParts = [cidade, estado].filter(Boolean).join(", ");
  const query = locationParts
    ? `${nomeNegocio} ${locationParts}`
    : nomeNegocio;

  let res: Response;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);

    res = await fetch(PLACES_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: "pt-BR",
        regionCode: "BR",
        maxResultCount: 1,
      }),
    });

    clearTimeout(timer);
  } catch (err) {
    return {
      encontrado: false,
      error: `Falha na requisição à Places API: ${String(err)}`,
    };
  }

  if (!res.ok) {
    return {
      encontrado: false,
      error: `Places API retornou ${res.status}: ${await res.text().catch(() => "")}`,
    };
  }

  let data: PlacesTextSearchResponse;
  try {
    data = (await res.json()) as PlacesTextSearchResponse;
  } catch {
    return { encontrado: false, error: "Resposta inválida da Places API" };
  }

  const place = data.places?.[0];
  if (!place) {
    return {
      encontrado: false,
      error: undefined, // Not an error — just not found.
    };
  }

  // ── Verification heuristic ─────────────────────────────────────────────
  // The Places API v1 doesn't expose a "verified" flag directly.
  // We treat businesses with reviews AND photos as likely verified/claimed.
  const likelyVerified =
    (place.userRatingCount ?? 0) > 0 && (place.photos?.length ?? 0) > 0;

  return {
    encontrado:       true,
    nome:             place.displayName?.text,
    rating:           place.rating,
    total_avaliacoes: place.userRatingCount,
    verificado:       likelyVerified,
    horarios:         place.regularOpeningHours?.weekdayDescriptions,
    fotos_count:      place.photos?.length ?? 0,
    place_id:         place.id,
    endereco:         place.formattedAddress,
  };
}
