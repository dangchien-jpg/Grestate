import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Controller, useFormContext } from "react-hook-form";
import type { PostFormValues } from "../../schemas/post-form-schema";

const HouseDetailForm = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<PostFormValues>();

  return (
    <div>
      <fieldset className="space-y-5 border-t border-gray-300 pt-6">
        <legend className="pr-3 text-lg font-bold text-slate-900">
          Thông tin khác
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          {(
            [
              { name: "bedrooms", label: "Số phòng ngủ" },
              { name: "bathrooms", label: "Số phòng tắm" },
              { name: "floors", label: "Số tầng" },
            ] as const
          ).map((field) => (
            <div key={field.name} className="space-y-2">
              <Label className="text-sm font-bold" htmlFor={field.name}>
                {field.label}
              </Label>
              <Input
                id={field.name}
                {...register(field.name)}
                aria-invalid={!!errors[field.name]}
                aria-describedby={
                  errors[field.name] ? `${field.name}-error` : undefined
                }
                type="number"
                min={0}
                max={2147483647}
                step={1}
                placeholder="Nhập số lượng"
                className="h-12 rounded-lg text-sm md:text-sm"
              />
              {errors[field.name] && (
                <p
                  id={`${field.name}-error`}
                  role="alert"
                  className="text-destructive text-sm"
                >
                  {errors[field.name]?.message}
                </p>
              )}
            </div>
          ))}
          <div className="space-y-2">
            <Label className="text-sm font-bold" htmlFor="houseDirection">
              Hướng nhà
            </Label>
            <Controller
              name="houseDirection"
              control={control}
              render={({ field }) => (
                <Select
                  name={field.name}
                  value={field.value || null}
                  onValueChange={(value) => field.onChange(value ?? "")}
                >
                  <SelectTrigger
                    id="houseDirection"
                    ref={field.ref}
                    onBlur={field.onBlur}
                    className="pl-4 shadow-sm"
                  >
                    <SelectValue placeholder="Chọn hướng nhà" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Đông",
                      "Tây",
                      "Nam",
                      "Bắc",
                      "Đông Bắc",
                      "Đông Nam",
                      "Tây Bắc",
                      "Tây Nam",
                    ].map((direction) => (
                      <SelectItem key={direction} value={direction}>
                        {direction}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-bold" htmlFor="huongBanCong">
              Hướng ban công
            </Label>
            <Controller
              name="huongBanCong"
              control={control}
              render={({ field }) => (
                <Select
                  name={field.name}
                  value={field.value || null}
                  onValueChange={(value) => field.onChange(value ?? "")}
                >
                  <SelectTrigger
                    id="huongBanCong"
                    ref={field.ref}
                    onBlur={field.onBlur}
                    className="pl-4 shadow-sm"
                  >
                    <SelectValue placeholder="Chọn hướng ban công" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Đông",
                      "Tây",
                      "Nam",
                      "Bắc",
                      "Đông Bắc",
                      "Đông Nam",
                      "Tây Bắc",
                      "Tây Nam",
                    ].map((direction) => (
                      <SelectItem key={direction} value={direction}>
                        {direction}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          {(
            [
              { name: "matTien", label: "Mặt tiền (m)" },
              { name: "matDuong", label: "Đường vào (m)" },
            ] as const
          ).map(({ name, label }) => (
            <div key={name} className="space-y-2">
              <Label className="text-sm font-bold" htmlFor={name}>
                {label}
              </Label>
              <Input
                id={name}
                {...register(name)}
                type="number"
                min={0.01}
                max={9999999999.99}
                step={0.01}
                placeholder="Nhập chiều rộng"
                aria-invalid={!!errors[name]}
                aria-describedby={errors[name] ? `${name}-error` : undefined}
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
          ))}
          <div className="space-y-2">
            <Label className="text-sm font-bold" htmlFor="noiThat">
              Nội thất
            </Label>
            <Controller
              name="noiThat"
              control={control}
              render={({ field }) => (
                <Select
                  name={field.name}
                  value={field.value || null}
                  onValueChange={(value) => field.onChange(value ?? "")}
                >
                  <SelectTrigger
                    id="noiThat"
                    ref={field.ref}
                    onBlur={field.onBlur}
                    className="pl-4 shadow-sm"
                  >
                    <SelectValue placeholder="Chọn nội thất" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Đầy đủ nội thất", "Cơ bản", "Chưa có"].map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </fieldset>
    </div>
  );
};

export default HouseDetailForm;
