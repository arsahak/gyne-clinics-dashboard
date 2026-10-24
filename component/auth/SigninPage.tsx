"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { getTranslation } from "@/lib/translations";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { FaCalendarCheck, FaLock, FaShieldAlt, FaUserMd } from "react-icons/fa";
import { IoMdEye, IoMdEyeOff, IoMdLock, IoMdMail } from "react-icons/io";

// Shown on the left panel: what admins do in this dashboard.
const features = [
  {
    icon: FaUserMd,
    title: "Verify & manage doctors",
    text: "Review sign-ups and profile changes before they go live.",
  },
  {
    icon: FaCalendarCheck,
    title: "Track consultations & payments",
    text: "Follow bookings, revenue and doctor payouts as they happen.",
  },
  {
    icon: FaShieldAlt,
    title: "Keep patients safe",
    text: "Moderate chats, reports and reviews in one place.",
  },
];

const SigninPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [isPending, startTransition] = useTransition();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email =
        getTranslation("emailRequired", language) || "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email =
        getTranslation("invalidEmail", language) || "Invalid email format";
    }

    if (!password) {
      newErrors.password =
        getTranslation("passwordRequired", language) || "Password is required";
    } else if (password.length < 6) {
      newErrors.password =
        getTranslation("passwordMinLength", language) ||
        "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Get user-friendly error message based on error type
  const getErrorMessage = (
    error: string
  ): { message: string; field?: "email" | "password" | "general" } => {
    const errorLower = error.toLowerCase();

    // Check for server/connection issues first
    if (
      errorLower.includes("unable to connect") ||
      errorLower.includes("backend") ||
      errorLower.includes("server") ||
      errorLower.includes("fetch failed") ||
      errorLower.includes("econnrefused")
    ) {
      return {
        message:
          getTranslation("serverError", language) ||
          "Unable to connect to server. Please make sure the backend is running.",
        field: "general",
      };
    }

    // Check for specific error patterns
    if (
      errorLower.includes("credentials") ||
      errorLower.includes("credentialssignin")
    ) {
      return {
        message:
          getTranslation("invalidCredentials", language) ||
          "Invalid email or password. Please check your credentials and try again.",
        field: "general",
      };
    }

    if (
      errorLower.includes("user not found") ||
      errorLower.includes("no user") ||
      errorLower.includes("no account")
    ) {
      return {
        message:
          getTranslation("userNotFound", language) ||
          "No account found with this email. Please check your email or sign up.",
        field: "email",
      };
    }

    if (
      errorLower.includes("invalid password") ||
      errorLower.includes("wrong password") ||
      errorLower.includes("incorrect password") ||
      errorLower.includes("invalid email or password")
    ) {
      return {
        message:
          getTranslation("wrongPassword", language) ||
          "Invalid email or password. Please try again.",
        field: "general",
      };
    }

    if (errorLower.includes("email") && errorLower.includes("invalid")) {
      return {
        message:
          getTranslation("invalidEmail", language) || "Invalid email address.",
        field: "email",
      };
    }

    if (
      errorLower.includes("account") &&
      (errorLower.includes("locked") || errorLower.includes("disabled"))
    ) {
      return {
        message:
          getTranslation("accountLocked", language) ||
          "Your account has been locked. Please contact support.",
        field: "general",
      };
    }

    if (
      errorLower.includes("network") ||
      errorLower.includes("connection") ||
      errorLower.includes("timeout")
    ) {
      return {
        message:
          getTranslation("networkError", language) ||
          "Network error. Please check your connection and try again.",
        field: "general",
      };
    }

    // Default error message - use the actual error if it's meaningful
    const defaultMessage =
      error.length > 10 && error.length < 200
        ? error
        : getTranslation("loginFailed", language) ||
          "Login failed. Please check your credentials and try again.";

    return {
      message: defaultMessage,
      field: "general",
    };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Clear all previous errors
    setErrors({});

    startTransition(async () => {
      try {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          const { message, field } = getErrorMessage(result.error);

          // Set field-specific error or general error
          if (field === "email") {
            setErrors({ email: message });
          } else if (field === "password") {
            setErrors({ password: message });
          } else {
            setErrors({ general: message });
          }

          toast.error(message);
          return;
        }

        if (result?.ok) {
          toast.success(
            getTranslation("loginSuccessful", language) || "Login successful!"
          );
          router.push(callbackUrl);
          router.refresh();
        }
      } catch (error) {
        console.error("Login error:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        setErrors({
          general:
            getTranslation("unexpectedError", language) ||
            "An unexpected error occurred. Please try again later.",
        });
        toast.error(errorMessage);
      }
    });
  };

  const inputClass = (hasError: boolean) =>
    `block w-full rounded-xl border bg-white py-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 ${
      hasError
        ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
        : "border-gray-200 hover:border-gray-300 focus:border-brand-primary focus:ring-brand-primary/20"
    }`;

  return (
    // Always light: the sign-in page ignores OS / saved dark mode.
    <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-10 text-gray-900 [color-scheme:light]">
      <div className="grid overflow-hidden rounded-3xl border border-brand-primary/25 bg-white/95 shadow-2xl shadow-brand-primary/20 ring-4 ring-white/60 backdrop-blur-sm md:grid-cols-[1.05fr_1fr]">
        {/* Left: what this portal is for (hidden on small screens) */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-primary via-[#1b5f69] to-brand-secondary p-10 text-white md:flex">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-brand-accent/30 blur-2xl" />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider ring-1 ring-white/25">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Admin Portal
            </span>
            <h2 className="mt-6 text-3xl font-bold leading-tight">
              Care, managed
              <br />
              in one place.
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/75">
              Run Gyneclinics day to day: doctors, consultations, payments and
              patient safety, all from one dashboard.
            </p>
          </div>

          <ul className="relative mt-10 space-y-5">
            {features.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs leading-relaxed text-white/70">
                    {text}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <p className="relative mt-10 flex items-center gap-2 text-xs text-white/70">
            <FaLock className="h-3 w-3" />
            Secure, role-based access for the Gyneclinics team
          </p>
        </aside>

        {/* Right: the form */}
        <div className="relative p-8 sm:p-10">
          {/* Brand accent line (only when the left panel is hidden) */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent md:hidden" />

          {/* Header */}
          <div className="mb-8 flex flex-col items-center text-center">
            <Image
              src="/assets/logo/gyneclinics-logo.webp"
              alt="Gyneclinics"
              width={170}
              height={58}
              priority
              className="mb-6 h-auto w-[170px]"
            />
            <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-gray-900">
              Welcome back
            </h1>
            <p className="text-sm text-gray-500">
              {getTranslation("signInToContinue", language) ||
                "Sign in to continue to your account"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* General Error Alert */}
            {errors.general && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
              >
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm font-medium text-red-800">
                  {errors.general}
                </p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                {getTranslation("email", language) || "Email"}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <IoMdMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    // Clear email and general errors when user starts typing
                    if (errors.email || errors.general) {
                      setErrors((prev) => ({
                        ...prev,
                        email: undefined,
                        general: undefined,
                      }));
                    }
                  }}
                  className={`${inputClass(
                    Boolean(errors.email || errors.general)
                  )} pl-11 pr-3`}
                  placeholder={
                    getTranslation("emailPlaceholder", language) ||
                    "Enter your email"
                  }
                  disabled={isPending}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                {getTranslation("password", language) || "Password"}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <IoMdLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    // Clear password and general errors when user starts typing
                    if (errors.password || errors.general) {
                      setErrors((prev) => ({
                        ...prev,
                        password: undefined,
                        general: undefined,
                      }));
                    }
                  }}
                  className={`${inputClass(
                    Boolean(errors.password || errors.general)
                  )} pl-11 pr-11`}
                  placeholder={
                    getTranslation("passwordPlaceholder", language) ||
                    "Enter your password"
                  }
                  disabled={isPending}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600"
                  disabled={isPending}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <IoMdEyeOff className="h-5 w-5" />
                  ) : (
                    <IoMdEye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-primary/30 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <span className="flex items-center">
                  <svg
                    className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {getTranslation("signingIn", language) || "Signing in..."}
                </span>
              ) : (
                getTranslation("signIn", language) || "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} Gyneclinics
      </p>
    </div>
  );
};

export default SigninPage;
