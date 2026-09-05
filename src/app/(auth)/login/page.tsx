"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  LoginInput,
  registerSchema,
  RegisterInput,
  resetPasswordSchema,
  ResetPasswordInput,
} from "@/lib/validators/auth";
import { loginUser, registerUser, resetUserPassword } from "@/actions/auth";
import { toast } from "sonner";
import {
  Lock,
  Mail,
  User as UserIcon,
  Loader2,
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  UserPlus,
  CheckCircle2,
  Gem,
  Camera,
  Scissors,
  Building2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register" | "reset">("login");
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [showResetNew, setShowResetNew] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedCat, setSelectedCat] = useState<"jewelry" | "studio" | "clothing">("jewelry");

  // 1. Sign In Form
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    setValue: setLoginValue,
    formState: { errors: loginErrors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 2. Register Form
  const {
    register: registerReg,
    handleSubmit: handleSubmitReg,
    reset: resetRegForm,
    setValue: setRegValue,
    formState: { errors: regErrors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "admin",
      businessCategory: "jewelry",
      shopName: "",
    },
  });

  // 3. Reset Password Form
  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    reset: resetResetForm,
    formState: { errors: resetErrors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = async (values: LoginInput) => {
    setIsPending(true);
    try {
      const res = await loginUser(values);
      if (res.success) {
        toast.success("Signed in successfully!");
      } else {
        toast.error(res.error || "Invalid email or password");
      }
    } catch (err: any) {
      if (err?.digest?.includes("NEXT_REDIRECT")) {
        return;
      }
      toast.error("Failed to sign in. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  const onRegisterSubmit = async (values: RegisterInput) => {
    setIsPending(true);
    try {
      const payload: RegisterInput = {
        ...values,
        businessCategory: selectedCat,
      };
      const res = await registerUser(payload);
      if (res.success) {
        toast.success(res.data);
        resetRegForm();

        try {
          await loginUser({
            email: values.email,
            password: values.password,
          });
        } catch (loginErr: any) {
          if (loginErr?.digest?.includes("NEXT_REDIRECT")) {
            return;
          }
          setLoginValue("email", values.email);
          setLoginValue("password", values.password);
          setActiveTab("login");
        }
      } else {
        toast.error(res.error || "Failed to create account.");
      }
    } catch (err: any) {
      if (err?.digest?.includes("NEXT_REDIRECT")) {
        return;
      }
      toast.error("An error occurred during registration.");
    } finally {
      setIsPending(false);
    }
  };

  const onResetSubmit = async (values: ResetPasswordInput) => {
    setIsPending(true);
    try {
      const res = await resetUserPassword(values);
      if (res.success) {
        toast.success(res.data);
        resetResetForm();
        setLoginValue("email", values.email);
        setLoginValue("password", values.newPassword);
        setActiveTab("login");
      } else {
        toast.error(res.error || "Failed to update password");
      }
    } catch {
      toast.error("An unexpected error occurred while resetting password.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gradient-to-b from-[#faf8f5] via-[#f5efe4] to-[#faf8f5] dark:from-slate-950 dark:via-[#120a18] dark:to-slate-950 px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-amber-500 selection:text-white dark:selection:text-slate-950 transition-colors duration-200">
      {/* Luxury Ambient Glow Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-amber-400/[0.12] dark:bg-amber-500/[0.07] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-amber-300/[0.1] dark:bg-purple-900/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Corner Theme Switcher */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle showLabel />
      </div>

      {/* Logo & Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-6">
        <div className="relative mx-auto flex items-center justify-center">
          <img
            src="/logo.png"
            alt="Zeal Jewellers"
            className="h-28 sm:h-36 w-auto object-contain drop-shadow-md dark:drop-shadow-[0_8px_30px_rgba(217,119,6,0.25)] transition-transform duration-500 hover:scale-[1.03]"
          />
        </div>

        {/* Decorative Divider */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-500/40" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-800 dark:text-amber-400">
            Shop Management & POS
          </span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-500/40" />
        </div>
      </div>

      {/* Main Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-white dark:bg-slate-900/90 p-6 sm:p-8 shadow-xl backdrop-blur-xl transition-all duration-300">
          
          {/* Top Tab Bar Switcher */}
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-amber-50 dark:bg-slate-950/80 p-1.5 border border-amber-200 dark:border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab("login")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === "login"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-amber-900 dark:hover:text-slate-200 hover:bg-amber-100/50 dark:hover:bg-slate-900/50"
              }`}
            >
              <LogIn className="h-3.5 w-3.5" /> Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("register")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === "register"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-amber-900 dark:hover:text-slate-200 hover:bg-amber-100/50 dark:hover:bg-slate-900/50"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" /> Create Account
            </button>
          </div>

          {/* TAB 1: SIGN IN FORM */}
          {activeTab === "login" && (
            <form className="space-y-5" onSubmit={handleSubmitLogin(onLoginSubmit)}>
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Account Email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-amber-600 dark:text-amber-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10 h-11"
                    disabled={isPending}
                    {...registerLogin("email")}
                  />
                </div>
                {loginErrors.email && (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                    {loginErrors.email.message}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab("reset")}
                    className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline transition-colors"
                  >
                    Set / Reset Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-amber-600 dark:text-amber-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11"
                    disabled={isPending}
                    {...registerLogin("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {loginErrors.password && (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                    {loginErrors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-sm font-extrabold tracking-wide uppercase bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md rounded-xl transition-all duration-200 active:scale-[0.99]"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                    Authenticating...
                  </>
                ) : (
                  "Sign In To Dashboard"
                )}
              </Button>
            </form>
          )}

          {/* TAB 2: CREATE ACCOUNT FORM */}
          {activeTab === "register" && (
            <form className="space-y-4" onSubmit={handleSubmitReg(onRegisterSubmit)}>
              {/* BUSINESS CATEGORY SELECTOR */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Business Category <span className="text-amber-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Jewelry */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCat("jewelry");
                      setRegValue("businessCategory", "jewelry");
                    }}
                    className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all duration-200 ${
                      selectedCat === "jewelry"
                        ? "border-amber-500 bg-amber-500/10 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500/30 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-600/50 text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60"
                    }`}
                  >
                    {selectedCat === "jewelry" && (
                      <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-white">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                    )}
                    <div className={`p-1.5 rounded-lg mb-1 ${selectedCat === "jewelry" ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                      <Gem className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold leading-tight">Jewelry</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Stock & Gold</span>
                  </button>

                  {/* Studio */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCat("studio");
                      setRegValue("businessCategory", "studio");
                    }}
                    className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all duration-200 ${
                      selectedCat === "studio"
                        ? "border-violet-500 bg-violet-500/10 text-violet-950 dark:text-violet-200 ring-2 ring-violet-500/30 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-600/50 text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60"
                    }`}
                  >
                    {selectedCat === "studio" && (
                      <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-violet-500 text-white">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                    )}
                    <div className={`p-1.5 rounded-lg mb-1 ${selectedCat === "studio" ? "bg-violet-500/20 text-violet-600 dark:text-violet-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                      <Camera className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold leading-tight">Studio</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Shoots & Gear</span>
                  </button>

                  {/* Clothing */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCat("clothing");
                      setRegValue("businessCategory", "clothing");
                    }}
                    className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all duration-200 ${
                      selectedCat === "clothing"
                        ? "border-rose-500 bg-rose-500/10 text-rose-950 dark:text-rose-200 ring-2 ring-rose-500/30 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-600/50 text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60"
                    }`}
                  >
                    {selectedCat === "clothing" && (
                      <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-white">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                    )}
                    <div className={`p-1.5 rounded-lg mb-1 ${selectedCat === "clothing" ? "bg-rose-500/20 text-rose-600 dark:text-rose-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                      <Scissors className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold leading-tight">Clothing</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Tailoring & Fits</span>
                  </button>
                </div>
              </div>

              {/* SHOP / BUSINESS NAME */}
              <div>
                <label
                  htmlFor="reg-shopName"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                >
                  Shop / Studio Name <span className="text-slate-400 font-normal lowercase text-[10px]">(optional)</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-amber-600 dark:text-amber-400">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <Input
                    id="reg-shopName"
                    type="text"
                    placeholder={
                      selectedCat === "jewelry"
                        ? "e.g. Zeal Jewellers"
                        : selectedCat === "studio"
                        ? "e.g. Dreamlens Photography Studio"
                        : "e.g. Royal Fashion Boutique"
                    }
                    className="pl-10 h-10 text-sm"
                    disabled={isPending}
                    {...registerReg("shopName")}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-name"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-amber-600 dark:text-amber-400">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <Input
                    id="reg-name"
                    type="text"
                    placeholder="Your Full Name"
                    className="pl-10 h-10 text-sm"
                    disabled={isPending}
                    {...registerReg("name")}
                  />
                </div>
                {regErrors.name && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">{regErrors.name.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                >
                  Account Email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-amber-600 dark:text-amber-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="name@jewellers.com"
                    className="pl-10 h-10 text-sm"
                    disabled={isPending}
                    {...registerReg("email")}
                  />
                </div>
                {regErrors.email && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">{regErrors.email.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="reg-password"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="reg-password"
                      type={showRegPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pr-9 h-10 text-sm"
                      disabled={isPending}
                      {...registerReg("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showRegPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {regErrors.password && (
                    <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                      {regErrors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="reg-confirm"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Confirm
                  </label>
                  <div className="relative">
                    <Input
                      id="reg-confirm"
                      type={showRegConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      className="pr-9 h-10 text-sm"
                      disabled={isPending}
                      {...registerReg("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirm(!showRegConfirm)}
                      className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showRegConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {regErrors.confirmPassword && (
                    <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                      {regErrors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>



              <Button
                type="submit"
                className="w-full h-11 text-sm font-extrabold tracking-wide uppercase bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md rounded-xl transition-all duration-200 active:scale-[0.99] mt-2"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account & Save"
                )}
              </Button>
            </form>
          )}

          {/* TAB 3: RESET PASSWORD FORM */}
          {activeTab === "reset" && (
            <form className="space-y-5" onSubmit={handleSubmitReset(onResetSubmit)}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <KeyRound className="h-3.5 w-3.5" /> Password Reset Mode
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("login")}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline"
                >
                  Back to Sign In
                </button>
              </div>

              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Account Email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-amber-600 dark:text-amber-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10 h-11"
                    disabled={isPending}
                    {...registerReset("email")}
                  />
                </div>
                {resetErrors.email && (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                    {resetErrors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="reset-newPassword"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  New Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-amber-600 dark:text-amber-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <Input
                    id="reset-newPassword"
                    type={showResetNew ? "text" : "password"}
                    placeholder="Enter new password"
                    className="pl-10 pr-10 h-11"
                    disabled={isPending}
                    {...registerReset("newPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetNew(!showResetNew)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showResetNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {resetErrors.newPassword && (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                    {resetErrors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="reset-confirmPassword"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-amber-600 dark:text-amber-400">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <Input
                    id="reset-confirmPassword"
                    type={showResetConfirm ? "text" : "password"}
                    placeholder="Re-enter new password"
                    className="pl-10 pr-10 h-11"
                    disabled={isPending}
                    {...registerReset("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(!showResetConfirm)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showResetConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {resetErrors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                    {resetErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-sm font-extrabold tracking-wide uppercase bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md rounded-xl transition-all duration-200 active:scale-[0.99]"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                    Updating Password...
                  </>
                ) : (
                  "Save & Update Password"
                )}
              </Button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
