import { HistoricoPagamentos, type PagamentoRow } from "@/components/dashboard/HistoricoPagamentos";

interface PagamentosTabProps {
  pagamentos: PagamentoRow[];
}

export function PagamentosTab({ pagamentos }: PagamentosTabProps) {
  return <HistoricoPagamentos pagamentos={pagamentos} />;
}
