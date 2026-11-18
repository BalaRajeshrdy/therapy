import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const fieldBase =
  'w-full rounded-2xl border bg-white px-4 text-[0.97rem] text-charcoal placeholder:text-charcoal-soft/60 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-sage/40 aria-[invalid=true]:border-terracotta aria-[invalid=true]:focus:ring-terracotta/20'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldBase, 'h-12 border-forest/15 focus:border-forest/50', className)} {...props} />
))
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldBase, 'min-h-[110px] resize-y border-forest/15 py-3 focus:border-forest/50', className)} {...props} />
))
Textarea.displayName = 'Textarea'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      fieldBase,
      'h-12 appearance-none border-forest/15 bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22%23294B43%22%20stroke-width%3D%222%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22/%3E%3C/svg%3E")] bg-[position:right_1rem_center] bg-no-repeat pr-10 focus:border-forest/50',
      className,
    )}
    {...props}
  >
    {children}
  </select>
))
Select.displayName = 'Select'

interface FieldProps {
  label: string
  error?: string
  hint?: string
  optional?: boolean
  className?: string
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode
}

/** Label + control + accessible hint/error wiring. */
export function Field({ label, error, hint, optional, className, children }: FieldProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-forest">
        {label}
        {optional && <span className="ml-1.5 font-normal text-charcoal-soft">(optional)</span>}
      </label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-charcoal-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-1.5 text-sm font-medium text-terracotta">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  )
}

interface ChoiceProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  type?: 'radio' | 'checkbox'
  label: ReactNode
  description?: ReactNode
}

/** Card-style radio / checkbox. */
export const ChoiceCard = forwardRef<HTMLInputElement, ChoiceProps>(({ type = 'radio', label, description, className, ...props }, ref) => (
  <label
    className={cn(
      'relative flex cursor-pointer items-start gap-3 rounded-2xl border border-forest/15 bg-white p-4 transition-all duration-200 hover:border-forest/40 has-[:checked]:border-forest has-[:checked]:bg-sage-light/50 has-[:checked]:shadow-soft has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-sage/50',
      className,
    )}
  >
    <input ref={ref} type={type} className="peer mt-0.5 size-[18px] shrink-0 accent-forest focus:outline-none" {...props} />
    <span className="flex flex-col">
      <span className="text-sm font-semibold text-forest">{label}</span>
      {description && <span className="mt-0.5 text-xs text-charcoal-soft">{description}</span>}
    </span>
  </label>
))
ChoiceCard.displayName = 'ChoiceCard'
