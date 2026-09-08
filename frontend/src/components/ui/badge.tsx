import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-[#10B981]/30 bg-[#10B981]/12 text-[#34D399]',
        secondary: 'border-slate-700/60 bg-[#1E293B] text-[#CBD5E1]',
        outline: 'text-[#CBD5E1] border-slate-700/60 bg-[#1E293B]/40',
        premium: 'border-[#D4AF6A]/35 bg-[#D4AF6A]/12 text-[#D4AF6A]',
        success: 'border-emerald-500/25 bg-emerald-500/12 text-[#34D399]',
        warning: 'border-amber-500/25 bg-amber-500/12 text-[#FBBF24]',
        destructive: 'border-red-500/25 bg-red-500/12 text-[#F87171]',
        info: 'border-sky-500/25 bg-sky-500/12 text-[#38BDF8]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
