import CatalogManager, {
  type CatalogValues,
} from "@/components/admin/shared/catalog-manager";
import { legalDocumentService } from "@/services/legalDocumentService";

const toPayload = (values: CatalogValues) => ({
  tenGiayTo: values.name,
  moTa: values.description || null,
});
const config = {
  title: "Danh sách giấy tờ pháp lý",
  label: "giấy tờ pháp lý",
  maxName: 200,
  list: async (signal: AbortSignal) =>
    (await legalDocumentService.fetchLegalDocuments(signal)).map((record) => ({
      id: record.maGiayTo,
      name: record.tenGiayTo,
      description: record.moTa,
    })),
  create: (values: CatalogValues) =>
    legalDocumentService.create(toPayload(values)),
  update: (id: number, values: CatalogValues) =>
    legalDocumentService.update(id, toPayload(values)),
  remove: (id: number) => legalDocumentService.remove(id),
};

const ManagerLegalDocument = () => <CatalogManager config={config} />;

export default ManagerLegalDocument;
