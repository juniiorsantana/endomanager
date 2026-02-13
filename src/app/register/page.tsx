import { CircleDot } from "lucide-react";
import RegisterForm from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <CircleDot className="mb-4 h-12 w-12 text-primary" />
          <h1 className="font-headline text-3xl font-bold text-primary">
            Endoscam
          </h1>
          <p className="text-muted-foreground">
            Crie sua conta para começar
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
