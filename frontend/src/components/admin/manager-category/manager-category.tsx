import CatalogManager, {
  type CatalogValues,
} from "@/components/admin/shared/catalog-manager";
import { categoryService } from "@/services/categoryService";

const toPayload = (values: CatalogValues) => ({
  tenLoai: values.name,
  moTa: values.description || null,
  nhomBatDongSan: values.group,
});
const config = {
  title: "Danh sách loại bất động sản",
  label: "loại bất động sản",
  maxName: 100,
  hasGroup: true,
  list: async (signal: AbortSignal) =>
    (await categoryService.fetchCategories(signal)).map((record) => ({
      id: record.maLoaiBatDongSan,
      name: record.tenLoai,
      description: record.moTa,
      group: record.nhomBatDongSan,
    })),
  create: (values: CatalogValues) => categoryService.create(toPayload(values)),
  update: (id: number, values: CatalogValues) =>
    categoryService.update(id, toPayload(values)),
  remove: (id: number) => categoryService.remove(id),
};

const ManagerCategory = () => <CatalogManager config={config} />;

export default ManagerCategory;
