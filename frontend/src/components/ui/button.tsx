import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1220] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-[#10B981] text-[#06131A] shadow-sm hover:bg-[#047857] hover:text-[#F8F5ED] transition-colors',
        gradient: 'bg-[#10B981] text-[#06131A] shadow-sm hover:bg-[#047857] hover:text-[#F8F5ED] transition-colors',
        secondary: 'bg-[#1E293B] text-[#CBD5E1] border border-slate-700/60 shadow-sm hover:bg-[#334155] hover:text-[#F8F5ED]',
        outline: 'border border-[#D4AF6A]/30 text-[#F8F5ED] bg-transparent hover:bg-[#D4AF6A]/10 hover:border-[#D4AF6A]/55',
        ghost: 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8F5ED]',
        link: 'text-[#10B981] underline-offset-4 hover:underline',
        premium: 'bg-[#D4AF6A] text-[#0B1220] hover:bg-[#C29C57] font-bold shadow-sm',
        destructive: 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-11 rounded-xl px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
