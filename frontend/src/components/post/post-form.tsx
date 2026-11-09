import { useEffect, useRef, useState } from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPostSchema,
  MAX_IMAGES,
  IMAGE_TYPES,
  type PostFormValues,
} from "../../schemas/post-form-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ImagePlus, MapPin, X } from "lucide-react";
import { useCategoryStore } from "@/stores/categoryStore";
import { useLegalDocumentStore } from "@/stores/legalDocumentStore";
import { useLocationStore } from "@/stores/locationStore";
import { Link, useNavigate } from "react-router";
import { isAxiosError } from "axios";
import { usePostStore } from "@/stores/postStore";
import { toast } from "sonner";
import HouseDetailForm from "@/components/post/house-detail-form";
import LandDetailForm from "@/components/post/land-detail-form";
import { useAuthStore } from "@/stores/authStore";

const ImagePreview = ({ file }: { file: File }) => {
  const imageRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (imageRef.current) imageRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <img
      ref={imageRef}
      alt={file.name}
      className="aspect-video w-full object-cover"
    />
  );
};

const PostForm = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const createPost = usePostStore((state) => state.createPost);
  const categories = useCategoryStore((state) => state.categories);
  const fetchCategories = useCategoryStore((state) => state.fetchCategories);
  const legalDocuments = useLegalDocumentStore((state) => state.legalDocuments);
  const fetchLegalDocuments = useLegalDocumentStore(
    (state) => state.fetchLegalDocument,
  );
  const provinces = useLocationStore((state) => state.provinces);
  const fetchProvinces = useLocationStore((state) => state.fetchProvinces);
  const wards = useLocationStore((state) => state.wards);
  const fetchWardsByProvince = useLocationStore(
    (state) => state.fetchWardsByProvince,
  );

  const [showPriceSuggestions, setShowPriceSuggestions] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [provinceCode, setProvinceCode] = useState<string | null>(null);
  const [wardId, setWardId] = useState<number | null>(null);
  const [mapAddress, setMapAddress] = useState("");
  const [imageSelectionError, setImageSelectionError] = useState("");

  useEffect(() => {
    fetchCategories().catch((err) => {
      console.error("fetchCategories", err);
    });

    fetchLegalDocuments().catch((err) => {
      console.error("fetchLegalDocuments", err);
    });

    fetchProvinces().catch((err) => {
      console.error("fetchProvinces", err);
    });
  }, [fetchCategories, fetchLegalDocuments, fetchProvinces]);

  useEffect(() => {
    if (!provinceCode) {
      return;
    }

    fetchWardsByProvince(provinceCode).catch((err) => {
      console.error("fetchWardsByProvince", err);
    });
  }, [provinceCode, fetchWardsByProvince]);

  const parsePriceInput = (input: string): number | null => {
    const text = input
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/đ/g, "d")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
    const match = text.match(
      /^(\d[\d.,]*)\s*(trieu|tr|ty|ti|nghin|ngan|k|vnd|d|dong)?$/,
    );
    if (!match) return null;
    const numericText = match[1];
    const normalizedNumber = numericText.includes(",")
      ? numericText.replace(/\./g, "").replace(",", ".")
      : /^\d{1,3}(\.\d{3})+$/.test(numericText)
        ? numericText.replace(/\./g, "")
        : numericText;
    const multiplier: Record<string, number> = {
      trieu: 1_000_000,
      tr: 1_000_000,
      ty: 1_000_000_000,
      ti: 1_000_000_000,
      nghin: 1_000,
      ngan: 1_000,
      k: 1_000,
    };
    const amount = Number(normalizedNumber) * (multiplier[match[2]] ?? 1);
    return Number.isFinite(amount) &&
      amount >= 0 &&
      amount <= Number.MAX_SAFE_INTEGER
      ? amount
      : null;
  };

  const methods = useForm<PostFormValues>({
    resolver: zodResolver(createPostSchema(categories)),
    defaultValues: {
      images: [],
      title: "",
      description: "",
      categoryId: null,
      legalDocumentId: null,
      provinceCode: "",
      wardId: null,
      address: "",
      price: "",
      area: "",
      nguoiLienHe: user?.hoTen ?? "",
      soDienThoaiLienHe: user?.soDienThoai ?? "",
      matTien: "",
      matDuong: "",
      houseDirection: "",
      huongBanCong: "",
      bedrooms: "",
      bathrooms: "",
      floors: "",
      noiThat: "",
    },
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    unregister,
    setError,
    formState: { errors, isSubmitted, isSubmitting },
  } = methods;

  const categoryId = useWatch({ control, name: "categoryId" });

  const selectedCategory = categories.find(
    (category) => category.maLoaiBatDongSan === categoryId,
  );

  const propertyGroup = selectedCategory?.nhomBatDongSan;
  useEffect(() => {
    if (propertyGroup !== "NHA") {
      unregister([
        "bedrooms",
        "bathrooms",
        "floors",
        "huongBanCong",
        "noiThat",
      ]);
    }
  }, [propertyGroup, unregister]);

  const onSubmit = async (values: PostFormValues) => {
    try {
      const { images, ...fields } = values;
      const formData = new FormData();
      formData.append("data", JSON.stringify(fields));
      images.forEach((file) => formData.append("images", file));
      const post = await createPost(formData);
      toast.success("Đăng tin thành công. Tin đang chờ kiểm duyệt.");
      navigate(`/detail/${post.maTinDang}`);
    } catch (error) {
      const body = isAxiosError(error) ? error.response?.data : null;
      if (body?.errors && typeof body.errors === "object") {
        for (const [field, message] of Object.entries(body.errors)) {
          if (field in values && typeof message === "string") {
            setError(field as keyof PostFormValues, {
              type: "server",
              message,
            });
          }
        }
      }
      setError("root.server", {
        message: body?.message ?? "Không thể đăng tin. Vui lòng thử lại.",
      });
    }
  };

  const filteredWards = wards.filter(
    (ward) => ward.maTinhThanh === provinceCode,
  );
  const fullAddress = addressInput.trim()
    ? [
        addressInput.trim(),
        filteredWards.find((ward) => ward.maPhuongXa === wardId)?.tenPhuongXa,
        provinces.find((province) => province.maTinhThanh === provinceCode)
          ?.tenTinhThanh,
        "Việt Nam",
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setMapAddress(fullAddress), 700);
    return () => window.clearTimeout(timeoutId);
  }, [fullAddress]);

  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapAddress)}&output=embed&hl=vi&z=17&iwloc=A`;

  return (
    <>
      <div className="flex item-center justify-between space-y-2  w-ful bg-white px-8 py-4">
        <div>
          <h3 className="text-xl font-bold sm:text-xl">
            Đăng tin bất động sản
          </h3>
        </div>
        <Link
          to="/"
          className="flex justify-center items-center px-4 py-2 rounded-sm border border-gray-500 text-sm font-bold text-slate-900 bg-white hover:bg-gray-100"
        >
          <X className="size-4" />
          Thoát
        </Link>
      </div>
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <FormProvider {...methods}>
          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
          >
            <fieldset
              disabled={isSubmitting}
              className="space-y-5 border-t border-gray-300 pt-6"
            >
              <legend className="pr-3 text-lg font-bold text-slate-900">
                Địa chỉ bất động sản
              </legend>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-bold" htmlFor="provinceCode">
                    Tỉnh / Thành phố <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="provinceCode"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        id="provinceCode"
                        name={field.name}
                        value={field.value || null}
                        options={provinces.map((province) => ({
                          value: province.maTinhThanh,
                          label: province.tenTinhThanh,
                        }))}
                        placeholder="Chọn tỉnh / thành phố"
                        searchLabel="Tìm tỉnh / thành phố"
                        emptyMessage="Chưa có danh sách tỉnh / thành phố."
                        triggerRef={field.ref}
                        onBlur={field.onBlur}
                        invalid={!!errors.provinceCode}
                        describedBy={
                          errors.provinceCode ? "provinceCode-error" : undefined
                        }
                        disabled={isSubmitting}
                        onValueChange={(value) => {
                          field.onChange(value ?? "");
                          setProvinceCode(value);
                          setValue("wardId", null, {
                            shouldValidate: isSubmitted,
                          });
                          setWardId(null);
                        }}
                      />
                    )}
                  />
                  {errors.provinceCode && (
                    <p
                      id="provinceCode-error"
                      role="alert"
                      className="text-destructive text-sm"
                    >
                      {errors.provinceCode.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold" htmlFor="wardId">
                    Phường / Xã <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="wardId"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        id="wardId"
                        name={field.name}
                        value={field.value}
                        options={filteredWards.map((ward) => ({
                          value: ward.maPhuongXa,
                          label: ward.tenPhuongXa,
                        }))}
                        placeholder="Chọn phường / xã"
                        searchLabel="Tìm phường / xã"
                        emptyMessage="Chưa có danh sách phường / xã."
                        triggerRef={field.ref}
                        onBlur={field.onBlur}
                        invalid={!!errors.wardId}
                        describedBy={errors.wardId ? "wardId-error" : undefined}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setWardId(value);
                        }}
                        disabled={!provinceCode || isSubmitting}
                      />
                    )}
                  />
                  {errors.wardId && (
                    <p
                      id="wardId-error"
                      role="alert"
                      className="text-destructive text-sm"
                    >
                      {errors.wardId.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold" htmlFor="address">
                  Địa chỉ chi tiết <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  {...register("address", {
                    onChange: (event) => setAddressInput(event.target.value),
                  })}
                  aria-invalid={!!errors.address}
                  aria-describedby={
                    errors.address ? "address-error" : undefined
                  }
                  required
                  maxLength={255}
                  placeholder="Số nhà, tên đường, khu dân cư..."
                  className="h-12 rounded-lg text-sm md:text-sm"
                />
                {errors.address && (
                  <p
                    id="address-error"
                    role="alert"
                    className="text-destructive text-sm"
                  >
                    {errors.address.message}
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-bold ">Vị trí trên bản đồ</h3>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  {mapAddress && addressInput.trim() ? (
                    <iframe
                      title="Vị trí bất động sản trên Google Maps"
                      src={mapUrl}
                      className="h-72 w-full border-0 sm:h-80"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex h-72 flex-col items-center justify-center gap-3 px-6 text-center text-slate-500 sm:h-80">
                      <MapPin className="size-8 text-slate-400" />
                      <p className="text-sm">
                        Nhập địa chỉ để xem vị trí trên bản đồ.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </fieldset>
            <fieldset
              disabled={isSubmitting}
              className="space-y-5 pt-6 border-t border-gray-300"
            >
              <legend className="pr-3 mb-5 text-lg font-bold text-slate-900">
                Thông tin chính
              </legend>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-bold" htmlFor="categoryId">
                    Loại bất động sản <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="categoryId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        name={field.name}
                        required
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="categoryId"
                          ref={field.ref}
                          onBlur={field.onBlur}
                          aria-invalid={!!errors.categoryId}
                          aria-describedby={
                            errors.categoryId ? "categoryId-error" : undefined
                          }
                          className="pl-4 shadow-sm"
                        >
                          <SelectValue placeholder="Chọn loại bất động sản">
                            {
                              categories.find(
                                (category) =>
                                  category.maLoaiBatDongSan === field.value,
                              )?.tenLoai
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem
                              key={category.maLoaiBatDongSan}
                              value={category.maLoaiBatDongSan}
                            >
                              {category.tenLoai}
                            </SelectItem>
                          ))}
                          {categories.length === 0 && (
                            <p className="px-3 py-3 text-sm text-slate-500">
                              Chưa có danh mục bất động sản.
                            </p>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.categoryId && (
                    <p
                      id="categoryId-error"
                      role="alert"
                      className="text-destructive text-sm"
                    >
                      {errors.categoryId.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label
                    className="text-sm font-bold"
                    htmlFor="legalDocumentId"
                  >
                    Giấy tờ pháp lý <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="legalDocumentId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        name={field.name}
                        required
                        value={field.value ?? null}
                        onValueChange={(value) => field.onChange(value ?? null)}
                      >
                        <SelectTrigger
                          id="legalDocumentId"
                          ref={field.ref}
                          onBlur={field.onBlur}
                          aria-invalid={!!errors.legalDocumentId}
                          aria-describedby={
                            errors.legalDocumentId
                              ? "legalDocumentId-error"
                              : undefined
                          }
                          className="pl-4 shadow-sm"
                        >
                          <SelectValue placeholder="Chọn giấy tờ pháp lý">
                            {
                              legalDocuments.find(
                                (document) => document.maGiayTo === field.value,
                              )?.tenGiayTo
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {legalDocuments.map((legalDocument) => (
                            <SelectItem
                              key={legalDocument.maGiayTo}
                              value={legalDocument.maGiayTo}
                            >
                              {legalDocument.tenGiayTo}
                            </SelectItem>
                          ))}
                          {legalDocuments.length === 0 && (
                            <p className="px-3 py-3 text-sm text-slate-500">
                              Chưa có danh mục giấy tờ pháp lý.
                            </p>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.legalDocumentId && (
                    <p
                      id="legalDocumentId-error"
                      role="alert"
                      className="text-destructive text-sm"
                    >
                      {errors.legalDocumentId.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold" htmlFor="price">
                    Khoảng giá (VNĐ) <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="price"
                    control={control}
                    render={({ field }) => {
                      const amount = parsePriceInput(priceInput) ?? 0;
                      const suggestions =
                        amount > 0 && amount < 10000
                          ? [
                              {
                                value: amount * 1_000_000_000,
                                unit: 1_000_000_000,
                                label: "tỷ",
                              },
                              {
                                value: amount * 10_000_000,
                                unit: 1_000_000,
                                label: "triệu",
                              },
                              {
                                value: amount * 100_000_000,
                                unit: 1_000_000,
                                label: "triệu",
                              },
                            ].filter((suggestion) =>
                              Number.isSafeInteger(suggestion.value),
                            )
                          : [];

                      return (
                        <div
                          className="relative"
                          onBlur={(event) => {
                            if (
                              !event.currentTarget.contains(event.relatedTarget)
                            ) {
                              setShowPriceSuggestions(false);
                              const parsedPrice = parsePriceInput(priceInput);
                              if (parsedPrice !== null) {
                                setPriceInput(
                                  parsedPrice.toLocaleString("vi-VN", {
                                    maximumFractionDigits: 9,
                                  }),
                                );
                                field.onChange(String(parsedPrice));
                              }
                              field.onBlur();
                            }
                          }}
                        >
                          <input
                            id="price"
                            name={field.name}
                            ref={field.ref}
                            type="text"
                            inputMode="text"
                            autoComplete="off"
                            required
                            value={priceInput}
                            onFocus={() => setShowPriceSuggestions(true)}
                            onChange={(event) => {
                              const text = event.currentTarget.value;
                              setPriceInput(text);
                              const amount = parsePriceInput(text);
                              field.onChange(
                                amount === null ? text.trim() : String(amount),
                              );
                              setShowPriceSuggestions(true);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Escape")
                                setShowPriceSuggestions(false);
                            }}
                            aria-invalid={!!errors.price}
                            aria-describedby={
                              errors.price ? "price-error" : undefined
                            }
                            placeholder="Nhập giá"
                            className="h-12 w-full rounded-lg border border-input bg-transparent px-4 py-3 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 aria-invalid:border-destructive"
                          />
                          {showPriceSuggestions && suggestions.length > 0 && (
                            <div
                              role="group"
                              aria-label="Gợi ý giá niêm yết"
                              className="absolute top-full z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
                            >
                              {suggestions.map((suggestion) => (
                                <button
                                  key={suggestion.value}
                                  type="button"
                                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none"
                                  onClick={() => {
                                    setPriceInput(
                                      suggestion.value.toLocaleString("vi-VN", {
                                        maximumFractionDigits: 9,
                                      }),
                                    );
                                    field.onChange(String(suggestion.value));
                                    setShowPriceSuggestions(false);
                                  }}
                                >
                                  <span>
                                    {(
                                      suggestion.value / suggestion.unit
                                    ).toLocaleString("vi-VN")}{" "}
                                    {suggestion.label}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {suggestion.value.toLocaleString("vi-VN")}{" "}
                                    VNĐ
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  {errors.price && (
                    <p
                      id="price-error"
                      role="alert"
                      className="text-destructive text-sm"
                    >
                      {errors.price.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold" htmlFor="area">
                    Diện tích (m²) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="area"
                    {...register("area")}
                    aria-invalid={!!errors.area}
                    aria-describedby={errors.area ? "area-error" : undefined}
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="Nhập diện tích"
                    className="h-12 rounded-lg text-sm md:text-sm"
                  />
                  {errors.area && (
                    <p
                      id="area-error"
                      role="alert"
                      className="text-destructive text-sm"
                    >
                      {errors.area.message}
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            <>
              {selectedCategory?.nhomBatDongSan === "NHA" && (
                <HouseDetailForm />
              )}
              {selectedCategory?.nhomBatDongSan === "DAT" && <LandDetailForm />}
            </>

            <fieldset
              disabled={isSubmitting}
              className="space-y-5 border-t border-gray-300 pt-6"
            >
              <legend className="pr-3 mb-5 text-lg font-bold text-slate-900">
                Thông tin cơ bản
              </legend>
              <div className="space-y-2">
                <Label className="text-sm font-bold" htmlFor="title">
                  Tiêu đề tin đăng <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  {...register("title")}
                  aria-invalid={!!errors.title}
                  aria-describedby={errors.title ? "title-error" : undefined}
                  required
                  maxLength={200}
                  placeholder="Ví dụ: Bán nhà 3 tầng, đường rộng, gần trung tâm"
                  className="h-12 rounded-lg text-sm md:text-sm"
                />
                {errors.title && (
                  <p
                    id="title-error"
                    role="alert"
                    className="text-destructive text-sm"
                  >
                    {errors.title.message}
                  </p>
                )}
                <p className="text-xs text-slate-500">Tối đa 200 ký tự.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold" htmlFor="description">
                  Mô tả chi tiết <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id="description"
                  {...register("description")}
                  aria-invalid={!!errors.description}
                  aria-describedby={
                    errors.description ? "description-error" : undefined
                  }
                  required
                  rows={6}
                  placeholder="Giới thiệu vị trí, hiện trạng, không gian sống và những điểm nổi bật của bất động sản..."
                  className="w-full resize-y rounded-lg border border-input bg-white px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
                {errors.description && (
                  <p
                    id="description-error"
                    role="alert"
                    className="text-destructive text-sm"
                  >
                    {errors.description.message}
                  </p>
                )}
              </div>
            </fieldset>

            <fieldset
              disabled={isSubmitting}
              className="space-y-5 border-t border-gray-300 pt-6"
            >
              <legend className="pr-3 text-lg font-bold text-slate-900">
                Thông tin liên hệ
              </legend>
              <div className="grid gap-5 sm:grid-cols-2">
                {(
                  [
                    {
                      name: "nguoiLienHe",
                      label: "Tên liên hệ",
                      type: "text",
                      autoComplete: "name",
                      maxLength: 100,
                      placeholder: "Nhập tên liên hệ",
                    },
                    {
                      name: "soDienThoaiLienHe",
                      label: "Số điện thoại",
                      type: "tel",
                      autoComplete: "tel",
                      maxLength: 15,
                      placeholder: "Nhập số điện thoại",
                    },
                  ] as const
                ).map(
                  ({
                    name,
                    label,
                    type,
                    autoComplete,
                    maxLength,
                    placeholder,
                  }) => (
                    <div key={name} className="space-y-2">
                      <Label className="text-sm font-bold" htmlFor={name}>
                        {label} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={name}
                        {...register(name)}
                        type={type}
                        autoComplete={autoComplete}
                        required
                        maxLength={maxLength}
                        placeholder={placeholder}
                        aria-invalid={!!errors[name]}
                        aria-describedby={
                          errors[name] ? `${name}-error` : undefined
                        }
                        className="h-12 rounded-lg text-sm md:text-sm"
                      />
                      {errors[name] && (
                        <p
                          id={`${name}-error`}
                          role="alert"
                          className="text-destructive text-sm"
                        >
                          {errors[name].message}
                        </p>
                      )}
                    </div>
                  ),
                )}
              </div>
            </fieldset>

            <fieldset
              disabled={isSubmitting}
              className="space-y-5 border-t border-gray-300 pt-6"
            >
              <legend className="pr-3 text-lg font-bold text-slate-900">
                Hình ảnh bất động sản
              </legend>
              <Controller
                name="images"
                control={control}
                render={({ field }) => (
                  <div className="space-y-4">
                    <p aria-live="polite" className="text-sm text-slate-600">
                      {field.value.length}/{MAX_IMAGES} ảnh{" "}
                      <span className="text-red-500">*</span>
                    </p>
                    <div className="grid items-start gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
                      <Label
                        htmlFor="images"
                        className="flex min-h-32 cursor-pointer flex-col items-center justify-center   gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-sm focus-within:ring-2 focus-within:ring-ring"
                      >
                        <ImagePlus className="size-6 text-primary" />
                        <span>Chọn hình ảnh</span>
                        <span className="text-xs text-slate-500">
                          JPG, PNG, WebP
                        </span>
                        <input
                          id="images"
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          type="file"
                          accept={IMAGE_TYPES.join(",")}
                          multiple
                          className="sr-only"
                          aria-required="true"
                          aria-invalid={
                            !!errors.images || !!imageSelectionError
                          }
                          aria-describedby="images-error"
                          onChange={(event) => {
                            const files = Array.from(
                              event.currentTarget.files ?? [],
                            );
                            event.currentTarget.value = "";
                            if (!files.length) return;
                            if (
                              files.some(
                                (file) => !IMAGE_TYPES.includes(file.type),
                              )
                            ) {
                              setImageSelectionError(
                                "Chỉ chấp nhận ảnh JPG, PNG, WebP.",
                              );
                              return;
                            }
                            const uniqueFiles = [...field.value];
                            for (const file of files) {
                              if (
                                !uniqueFiles.some(
                                  (existing) =>
                                    existing.name === file.name &&
                                    existing.size === file.size &&
                                    existing.lastModified === file.lastModified,
                                )
                              ) {
                                uniqueFiles.push(file);
                              }
                            }
                            if (uniqueFiles.length > MAX_IMAGES) {
                              setImageSelectionError(
                                "Tối đa 6 ảnh. Vui lòng chọn lại.",
                              );
                              return;
                            }
                            setImageSelectionError("");
                            setValue("images", uniqueFiles, {
                              shouldValidate: true,
                              shouldDirty: true,
                              shouldTouch: true,
                            });
                          }}
                        />
                      </Label>
                      <div className="grid min-w-0 grid-cols-3 gap-2">
                        {field.value.map((file, index) => (
                          <div
                            key={JSON.stringify([
                              file.name,
                              file.size,
                              file.lastModified,
                            ])}
                            className="relative overflow-hidden rounded-lg border border-slate-200"
                          >
                            <ImagePreview file={file} />
                            <button
                              type="button"
                              aria-label={
                                "Xóa ảnh " + (index + 1) + ": " + file.name
                              }
                              className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-slate-800 shadow hover:bg-slate-100"
                              onClick={() => {
                                setImageSelectionError("");
                                setValue(
                                  "images",
                                  field.value.filter(
                                    (_, imageIndex) => imageIndex !== index,
                                  ),
                                  {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                    shouldTouch: true,
                                  },
                                );
                              }}
                            >
                              <X className="size-4" />
                            </button>
                            <p
                              className="truncate px-2 py-1 text-xs"
                              title={file.name}
                            >
                              {file.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div
                      id="images-error"
                      role="alert"
                      className="text-sm text-destructive"
                    >
                      {imageSelectionError || errors.images?.message}
                    </div>
                  </div>
                )}
              />
            </fieldset>

            {errors.root?.server && (
              <p role="alert" className="text-sm text-destructive">
                {errors.root.server.message}
              </p>
            )}
            <div className="flex justify-end border-t border-gray-300 pt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-lg px-8 text-sm sm:w-auto"
              >
                {isSubmitting ? "Đang đăng tin..." : "Đăng tin"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </>
  );
};

export default PostForm;
