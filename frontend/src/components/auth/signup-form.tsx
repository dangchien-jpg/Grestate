import { isAxiosError } from "axios";
import { cn } from "cn";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";

const signUpSchema = z
  .object({
    firstName: z.string().min(1, "Tên không thể để trống"),
    lastName: z.string().min(1, "Họ không thể để trống"),
    email: z.email("Email không đúng định dạng"),
    password: z.string().min(6, "Mật khẩu phải tối thiểu 6 ký tự"),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((accepted) => accepted, {
      message:
        "Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách quyền riêng tư để tiếp tục.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });
type SignUpFormValues = z.infer<typeof signUpSchema>;

const inputClassName =
  "h-12 rounded-full text-sm md:text-sm border border-[#ccc]";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { signUp } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { acceptTerms: false },
  });
  const onSubmit = async (data: SignUpFormValues) => {
    const { password, email, firstName, lastName } = data;
    try {
      await signUp(password, email, firstName, lastName);
      navigate("/verify-email", { replace: true, state: { ...location.state, email, resendAt: Date.now() + 30000 } });
      toast.success(
        "Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản.",
      );
    } catch (error) {
      if (isAxiosError(error) && error.response?.data?.code === "OTP_DELIVERY_FAILED") {
        toast.error(error.response.data.message);
        navigate("/verify-email", { replace: true, state: { ...location.state, email } });
        return;
      }
      const message =
        isAxiosError(error) && typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : "Đăng ký thất bại. Vui lòng thử lại.";
      if (isAxiosError(error) && error.response?.status === 409) {
        setError("email", { type: "server", message }, { shouldFocus: true });
      }
      toast.error(message);
    }
  };
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 rounded-sm">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Tạo tài khoản</h1>
              </div>
              <Field>
                <FieldLabel className="font-bold text-sm" htmlFor="firstName">
                  Họ
                </FieldLabel>
                <Input
                  className={inputClassName}
                  id="firstName"
                  type="text"
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <p className="text-destructive text-sm">
                    {errors.firstName.message}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel className="font-bold text-sm" htmlFor="lastName">
                  Tên
                </FieldLabel>
                <Input
                  className={inputClassName}
                  id="lastName"
                  type="text"
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <p className="text-destructive text-sm">
                    {errors.lastName.message}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel className="font-bold text-sm" htmlFor="email">
                  Email
                </FieldLabel>
                <Input
                  className={inputClassName}
                  id="email"
                  type="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={
                    errors.email ? "signup-email-error" : undefined
                  }
                  placeholder="m@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p
                    id="signup-email-error"
                    role="alert"
                    className="text-destructive text-sm"
                  >
                    {errors.email.message}
                  </p>
                )}
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel
                      className="font-bold text-sm"
                      htmlFor="password"
                    >
                      Mật khẩu
                    </FieldLabel>
                    <Input
                      className={inputClassName}
                      id="password"
                      type="password"
                      {...register("password")}
                    />
                    {errors.password && (
                      <p className="text-destructive text-sm">
                        {errors.password.message}
                      </p>
                    )}
                  </Field>
                  <Field>
                    <FieldLabel
                      className="font-bold text-sm"
                      htmlFor="confirm-password"
                    >
                      Nhập lại mật khẩu
                    </FieldLabel>
                    <Input
                      className={inputClassName}
                      id="confirm-password"
                      type="password"
                      {...register("confirmPassword")}
                    />
                    {errors.confirmPassword && (
                      <p className="text-destructive text-sm">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </Field>
                </Field>
              </Field>
              <Field>
                <div className="flex items-start gap-3">
                  <input
                    id="signup-accept-terms"
                    type="checkbox"
                    className="mt-1 size-4 shrink-0 cursor-pointer accent-primary"
                    aria-invalid={!!errors.acceptTerms}
                    aria-describedby={
                      errors.acceptTerms ? "signup-terms-error" : undefined
                    }
                    {...register("acceptTerms")}
                  />
                  <label
                    htmlFor="signup-accept-terms"
                    className="cursor-pointer text-xs leading-relaxed [&_a]:underline [&_a]:underline-offset-4"
                  >
                    Bằng việc “Tiếp tục”, bạn đồng ý với{" "}
                    <a href="#">Điều khoản dịch vụ</a> và{" "}
                    <a href="#">Chính sách quyền riêng tư</a> của chúng tôi.
                  </label>
                </div>
                {errors.acceptTerms && (
                  <p
                    id="signup-terms-error"
                    role="alert"
                    className="text-destructive text-sm"
                  >
                    {errors.acceptTerms.message}
                  </p>
                )}
              </Field>
              <Field>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer rounded-full h-12 text-sm font-bold"
                >
                  Tiếp tục
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Đã có tài khoản?{" "}
                <Link to="/signin" state={location.state} replace>
                  Đăng nhập
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="relative hidden bg-white md:block">
            <img
              src="/House searching-amico.svg"
              alt="Image"
              className="mt-30 absolute inset-0 h-100 w-100 object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
