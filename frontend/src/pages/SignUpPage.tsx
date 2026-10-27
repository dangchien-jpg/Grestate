import { SignupForm } from "@/components/auth/signup-form";

const SignUpPage = () => {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6  bg-[url('/Background.png')] bg-cover bg-center">
      <div className="w-full md:max-w-3xl ">
        <SignupForm />
      </div>
    </div>
  );
};

export default SignUpPage;
