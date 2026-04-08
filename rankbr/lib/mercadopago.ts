import axios from "axios";

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN!;

export const mercadopago = axios.create({
  baseURL: "https://api.mercadopago.com",
  headers: {
    Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  },
});

// TODO: adicionar funções de pagamento (criar preferência, webhook, etc.)
