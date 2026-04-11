import { ListaSites, type SiteComAnalise } from "@/components/dashboard/ListaSites";

interface SitesTabProps {
  sites: SiteComAnalise[];
}

export function SitesTab({ sites }: SitesTabProps) {
  return <ListaSites sites={sites} />;
}
