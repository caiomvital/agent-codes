"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ContaTab } from "@/components/dashboard/tabs/ContaTab";
import { SitesTab } from "@/components/dashboard/tabs/SitesTab";
import { PagamentosTab } from "@/components/dashboard/tabs/PagamentosTab";
import type { SiteComAnalise } from "@/components/dashboard/ListaSites";
import type { PagamentoRow } from "@/components/dashboard/HistoricoPagamentos";

interface ConfiguracoesTabsProps {
  userId: string;
  currentName: string;
  currentEmail: string;
  sites: SiteComAnalise[];
  pagamentos: PagamentoRow[];
}

export function ConfiguracoesTabs({
  userId,
  currentName,
  currentEmail,
  sites,
  pagamentos,
}: ConfiguracoesTabsProps) {
  return (
    <Tabs defaultValue="conta" className="w-full">
      <TabsList className="mb-6 grid w-full grid-cols-3">
        <TabsTrigger value="conta">Minha conta</TabsTrigger>
        <TabsTrigger value="sites">Meus sites</TabsTrigger>
        <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
      </TabsList>

      <TabsContent value="conta">
        <ContaTab
          userId={userId}
          currentName={currentName}
          currentEmail={currentEmail}
        />
      </TabsContent>

      <TabsContent value="sites">
        <SitesTab sites={sites} />
      </TabsContent>

      <TabsContent value="pagamentos">
        <PagamentosTab pagamentos={pagamentos} />
      </TabsContent>
    </Tabs>
  );
}
