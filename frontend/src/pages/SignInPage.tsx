import { SigninForm } from "@/components/auth/signin-form";

export const SignInPage = () => {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-[url('/Background.png')] bg-cover bg-center p-6">
      <div className="w-full md:max-w-3xl ">
        <SigninForm />
      </div>
    </div>
  );
};
