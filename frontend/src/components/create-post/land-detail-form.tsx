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

const inputClassName = "h-12 rounded-full text-sm md:text-sm border border-[#ccc]";

const LandDetailForm = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<PostFormValues>();

  return (
    <div>
      <fieldset className="space-y-5 border-t border-gray-300 pt-6">
        <legend className="pr-3 text-lg font-bold ">
          Thông tin khác
        </legend>
        <div className="grid gap-5">
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
                    className={`${inputClassName} w-full pl-4 shadow-sm`}
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
                className={inputClassName}
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
        </div>
      </fieldset>
    </div>
  );
};

export default LandDetailForm;
