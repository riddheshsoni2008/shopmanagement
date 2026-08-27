"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/lib/validators/auth";
import { loginUser } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Gem, Lock, Mail, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginInput) => {
    setIsPending(true);
    try {
      const res = await loginUser(values);
      if (res.success) {
        toast.success("Welcome back! Authentication successful.");
        window.location.href = "/dashboard";
      } else {
        toast.error(res.error || "Invalid credentials");
      }
    } catch (err) {
      toast.error("Failed to sign in. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient Gold Glow background effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-xl shadow-amber-500/20">
          <Gem className="h-10 w-10" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight font-serif text-amber-400 flex items-center justify-center gap-2">
          Aura Jewelers <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Internal Shop Management System & POS
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 px-6 py-8 shadow-2xl backdrop-blur-xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                Account Email
              </label>
              <div className="mt-2 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@jewelry.com"
                  className="pl-10"
                  disabled={isPending}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                Password
              </label>
              <div className="mt-2 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  disabled={isPending}
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 text-base font-bold"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In To Dashboard"
              )}
            </Button>
          </form>

          {/* Quick Demo Credentials Info */}
          <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1">
              <ShieldCheck className="h-4 w-4" /> Demo Access Credentials:
            </div>
            <div className="space-y-1 font-mono text-[11px] text-slate-400">
              <p>Admin: <strong className="text-slate-200">admin@jewelry.com</strong> / <strong className="text-slate-200">admin123</strong></p>
              <p>Staff: <strong className="text-slate-200">staff@jewelry.com</strong> / <strong className="text-slate-200">staff123</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
