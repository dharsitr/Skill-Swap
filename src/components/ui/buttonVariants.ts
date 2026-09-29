import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "link";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export const buttonBaseStyles =
  "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 select-none cursor-pointer";

export const buttonVariantsMap: Record<ButtonVariant, string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow shadow-indigo-500/20 active:bg-indigo-800",
  secondary:
    "bg-slate-100 text-slate-800 hover:bg-slate-200/80 active:bg-slate-200 border border-slate-200/80",
  outline:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 shadow-xs",
  ghost:
    "text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs",
  link:
    "text-indigo-600 hover:text-indigo-700 underline-offset-4 hover:underline p-0 h-auto font-semibold",
};

export const buttonSizesMap: Record<ButtonSize, string> = {
  sm: "text-xs px-3 py-1.5 gap-1.5 h-8",
  md: "text-sm px-4 py-2 gap-2 h-10",
  lg: "text-base px-6 py-2.5 gap-2.5 h-12 font-semibold",
  icon: "h-10 w-10 p-0 rounded-xl",
};

export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(buttonBaseStyles, buttonVariantsMap[variant], buttonSizesMap[size], className);
}
