import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-300 ease-out focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-forest disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[1.1em] [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-forest text-ivory shadow-[0_8px_24px_-8px_rgba(41,75,67,0.55)] hover:-translate-y-0.5 hover:bg-forest-light hover:shadow-[0_14px_30px_-10px_rgba(41,75,67,0.6)] active:translate-y-0',
        secondary: 'bg-white text-forest ring-1 ring-forest/15 hover:-translate-y-0.5 hover:ring-forest/40 hover:shadow-soft active:translate-y-0',
        soft: 'bg-sage-light text-forest hover:bg-sage/60',
        ghost: 'text-forest hover:bg-forest/5',
        light: 'bg-ivory text-forest hover:-translate-y-0.5 hover:bg-white hover:shadow-lift',
        outlineLight: 'text-ivory ring-1 ring-ivory/40 hover:bg-ivory/10 hover:ring-ivory/70',
        danger: 'bg-terracotta text-white hover:bg-[#9c513a]',
        link: 'rounded-md px-0 text-forest underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-[0.95rem]',
        lg: 'h-14 px-8 text-base',
        icon: 'size-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
})
Button.displayName = 'Button'

export { buttonVariants }
