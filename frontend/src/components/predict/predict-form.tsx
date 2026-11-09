import { Input } from "@/components/ui/input";
import { useForm, useWatch } from "react-hook-form";
import type {
  Coordinates,
  GeocodedLocation,
  LocationMetadata,
  ValuationFieldErrors,
  ValuationRequest,
} from "@/types/valuation";

type FormValues = Omit<ValuationRequest, "lat" | "lon">;
interface Props {
  metadata: LocationMetadata;
  coordinates: Coordinates;
  pending: boolean;
  locating: boolean;
  onCoordinatesChange: (point: Coordinates) => void;
  onSubmit: (payload: ValuationRequest) => Promise<void>;
  onDirty: () => void;
  onFindLocation: (query: string) => Promise<void>;
  suggestion: GeocodedLocation | null;
  serverErrors: ValuationFieldErrors;
}
const fieldClass =
  "mt-2 h-12 rounded-lg font-sans text-sm font-normal md:text-sm";
const selectClass =
  "mt-2 h-12 w-full min-w-0 rounded-lg border border-input bg-white pl-4 pr-3 font-sans text-sm font-normal text-slate-700 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
const textareaClass =
  "mt-2 w-full resize-y rounded-lg border border-input bg-white px-4 py-3 font-sans text-sm font-normal outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring";
const numericFields = [
  ["frontage", "Mặt tiền (m)", 0.01, 1000, "any"],
  ["road_width", "Đường trước nhà (m)", 0, 200, "any"],
  ["num_floors", "Số tầng", 0, 100, "1"],
  ["num_bedrooms", "Số phòng ngủ", 0, 100, "1"],
  ["num_toilets", "Số phòng WC", 0, 100, "1"],
] as const;
function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-red-500">
      *
    </span>
  );
}

export default function PredictForm({
  metadata,
  coordinates,
  pending,
  locating,
  onCoordinatesChange,
  onSubmit,
  onDirty,
  onFindLocation,
  suggestion,
  serverErrors,
}: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    shouldUnregister: true,
    defaultValues: {
      district: "",
      ward: "",
      street: "",
      property_type: "",
      direction: "",
      legal_status: "",
      amenity_text: "",
    },
  });
  const district = useWatch({ control, name: "district" });
  const ward = useWatch({ control, name: "ward" });
  const kind = useWatch({ control, name: "property_type" });
  const selected = metadata.districts[district];
  const isLand = kind === "Đất";
  function errorFor(name: keyof FormValues) {
    const message = errors[name]?.message || serverErrors[name];
    return message ? (
      <span
        role="alert"
        className="mt-1 block text-xs font-normal text-red-600"
      >
        {message}
      </span>
    ) : null;
  }
  function changeDistrict(name: string) {
    onDirty();
    setValue("district", name, { shouldValidate: true });
    setValue("ward", "");
    setValue("street", "");
    const next = metadata.districts[name];
    if (next) onCoordinatesChange({ lat: next.lat, lon: next.lon });
  }
  function locate() {
    const values = getValues();
    if (!values.district || !values.ward) return;
    void onFindLocation(
      [
        values.street.trim(),
        values.ward,
        values.district,
        "Đà Nẵng",
        "Việt Nam",
      ]
        .filter(Boolean)
        .join(", "),
    );
  }
  function useSuggestion() {
    if (!suggestion?.street) return;
    const point = suggestion;
    onDirty();
    if (
      point.district &&
      point.district !== district &&
      metadata.districts[point.district]
    ) {
      setValue("district", point.district);
      setValue("ward", "");
    }
    setValue("street", point.street, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }
  return (
    <section className="rounded-2xl border bg-white p-6 font-sans">
      <h2 className="border-b pb-3 text-lg font-bold">
        Nhập thông tin bất động sản của bạn
      </h2>
      <p className="my-3 text-sm text-amber-700">
        Hỗ trợ danh mục quận/phường Đà Nẵng cũ, diện tích {metadata.area_min}–
        {metadata.area_max} m².
      </p>
      <form
        onChange={onDirty}
        onSubmit={handleSubmit((values) =>
          onSubmit({
            ...values,
            street: values.street.trim(),
            amenity_text: values.amenity_text.trim(),
            ...coordinates,
            num_floors: isLand ? 0 : values.num_floors,
            num_bedrooms: isLand ? 0 : values.num_bedrooms,
            num_toilets: isLand ? 0 : values.num_toilets,
          }),
        )}
        className="space-y-4"
      >
        <fieldset disabled={pending} className="space-y-4 disabled:opacity-70">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-bold">
              Tỉnh/Thành <RequiredMark />
              <Input
                aria-required="true"
                readOnly
                value="Thành phố Đà Nẵng"
                className={fieldClass}
              />
            </label>
            <label className="block text-sm font-bold">
              Quận/Huyện <RequiredMark />
              <select
                required
                {...register("district", { required: "Chọn quận/huyện" })}
                onChange={(event) => changeDistrict(event.target.value)}
                className={selectClass}
                aria-invalid={!!(errors.district || serverErrors.district)}
              >
                <option value="">Chọn quận/huyện</option>
                {Object.keys(metadata.districts).map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
              {errorFor("district")}
            </label>
            <label className="block text-sm font-bold">
              Phường/Xã <RequiredMark />
              <select
                required
                {...register("ward", { required: "Chọn phường/xã" })}
                className={selectClass}
                disabled={!selected}
                aria-invalid={!!(errors.ward || serverErrors.ward)}
              >
                <option value="">Chọn phường/xã</option>
                {selected?.wards.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
              {errorFor("ward")}
            </label>
            <label className="block text-sm font-bold">
              Đường/Phố <RequiredMark />
              <Input
                required
                {...register("street", {
                  required: "Nhập tên đường",
                  validate: (value) => !!value.trim() || "Nhập tên đường",
                  maxLength: {
                    value: 160,
                    message: "Tên đường tối đa 160 ký tự",
                  },
                })}
                className={fieldClass}
                placeholder="Ví dụ: Nguyễn Văn Linh"
                aria-invalid={!!(errors.street || serverErrors.street)}
              />
              {errorFor("street")}
            </label>
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={locate}
              disabled={locating || !district || !ward}
              className="rounded-lg border border-input px-4 py-2 text-sm disabled:opacity-50"
            >
              {locating ? "Đang tra cứu vị trí..." : "Tìm vị trí trên bản đồ"}
            </button>
            <p className="text-xs text-slate-500">
              Chọn phường rồi tìm vị trí hoặc ghim trực tiếp. Kiểm tra địa chỉ
              tương ứng với ghim.
            </p>
            {suggestion?.street && (
              <button
                type="button"
                onClick={useSuggestion}
                className="block text-sm text-primary underline"
              >
                Dùng tên đường gợi ý: {suggestion.street}
                {suggestion.district ? ` (${suggestion.district})` : ""}
              </button>
            )}
            {(serverErrors.lat || serverErrors.lon) && (
              <p role="alert" className="text-sm text-red-600">
                Vị trí phải nằm trong khu vực Đà Nẵng được hỗ trợ.
              </p>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block text-sm font-bold">
              Loại hình BĐS <RequiredMark />
              <select
                required
                {...register("property_type", {
                  required: "Chọn loại bất động sản",
                })}
                className={selectClass}
                aria-invalid={
                  !!(errors.property_type || serverErrors.property_type)
                }
              >
                <option value="">Chọn loại bất động sản</option>
                {metadata.property_types.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
              {errorFor("property_type")}
            </label>
            <label className="block text-sm font-bold">
              Pháp lý <RequiredMark />
              <select
                required
                {...register("legal_status", {
                  required: "Chọn tình trạng pháp lý",
                })}
                className={selectClass}
                aria-invalid={
                  !!(errors.legal_status || serverErrors.legal_status)
                }
              >
                <option value="">Chọn tình trạng pháp lý</option>
                {metadata.legal_statuses.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
              {errorFor("legal_status")}
            </label>
            <label className="block text-sm font-bold">
              Hướng nhà / đất <RequiredMark />
              <select
                required
                {...register("direction", { required: "Chọn hướng nhà / đất" })}
                className={selectClass}
                aria-invalid={!!(errors.direction || serverErrors.direction)}
              >
                <option value="">Chọn hướng nhà / đất</option>
                {metadata.directions.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
              {errorFor("direction")}
            </label>
          </div>
          <p className="text-xs text-slate-500">
            Các trường có dấu <RequiredMark /> bắt buộc nhập hoặc chọn. Số 0 chỉ
            dùng khi thực tế không có.
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <label className="block text-sm font-bold">
              Diện tích (m²) <RequiredMark />
              <Input
                required
                type="number"
                step="any"
                min={metadata.area_min}
                max={metadata.area_max}
                {...register("area", {
                  valueAsNumber: true,
                  required: "Nhập diện tích",
                  min: {
                    value: metadata.area_min,
                    message: `Diện tích tối thiểu ${metadata.area_min} m²`,
                  },
                  max: {
                    value: metadata.area_max,
                    message: `Diện tích tối đa ${metadata.area_max} m²`,
                  },
                  validate: (value) =>
                    Number.isFinite(value) || "Diện tích không hợp lệ",
                })}
                placeholder="Nhập diện tích"
                className={fieldClass}
                aria-invalid={!!(errors.area || serverErrors.area)}
              />
              {errorFor("area")}
            </label>
            {numericFields
              .filter(
                ([name]) =>
                  !isLand || name === "frontage" || name === "road_width",
              )
              .map(([name, label, min, max, step]) => (
                <label key={name} className="block text-sm font-bold">
                  {label} <RequiredMark />
                  <Input
                    required
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    placeholder={`Nhập ${label.toLowerCase()}`}
                    {...register(name, {
                      valueAsNumber: true,
                      required: `Vui lòng nhập ${label.toLowerCase()}`,
                      validate: (value) =>
                        (Number.isFinite(value) &&
                          value >= min &&
                          value <= max &&
                          (step === "any" || Number.isInteger(value))) ||
                        `Nhập ${step === "1" ? "số nguyên " : "số "}từ ${min} đến ${max}`,
                    })}
                    className={fieldClass}
                    aria-invalid={!!(errors[name] || serverErrors[name])}
                  />
                  {errorFor(name)}
                </label>
              ))}
          </div>
          <label className="block text-sm font-bold">
            Tiện ích xung quanh
            <textarea
              {...register("amenity_text", {
                maxLength: { value: 4000, message: "Mô tả tối đa 4.000 ký tự" },
              })}
              rows={3}
              aria-invalid={
                !!(errors.amenity_text || serverErrors.amenity_text)
              }
              className={textareaClass}
              placeholder="Ví dụ: gần trường học, chợ, bệnh viện, biển Mỹ Khê..."
            />
            {errorFor("amenity_text")}
          </label>
          <button
            type="submit"
            disabled={locating}
            className="w-full rounded-xl bg-primary px-6 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {pending
              ? "Đang định giá..."
              : locating
                ? "Đang xác định vị trí..."
                : "Định giá bất động sản"}
          </button>
        </fieldset>
      </form>
    </section>
  );
}
