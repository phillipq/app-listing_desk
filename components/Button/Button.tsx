import { cva, type VariantProps } from "class-variance-authority"

import { twMerge } from "tailwind-merge"

const button = cva(
  [
    "justify-center",
    "inline-flex",
    "items-center",
    "rounded-xl",
    "text-center",
    "border",
    "border-blue-400",
    "transition-colors",
    "delay-50",
  ],
  {
    variants: {
      intent: {
        primary: ["bg-blue-400", "text-gray-700", "hover:enabled:bg-keppel-500"],
        secondary: ["bg-transparent", "text-blue-400", "hover:enabled:bg-blue-400", "hover:enabled:text-gray-700"],
      },
      size: {
        sm: ["min-w-20", "h-full", "min-h-10", "text-sm", "py-1.5", "px-4"],
        lg: ["min-w-32", "h-full", "min-h-12", "text-lg", "py-2.5", "px-6"],
      },
      underline: { true: ["underline"], false: [] },
    },
    defaultVariants: {
      intent: "primary",
      size: "lg",
    },
  }
)

export interface ButtonProps extends VariantProps<typeof button> {
  underline?: boolean
  href?: string
  as?: "button" | "a"
  children?: React.ReactNode
  className?: string
  type?: "button" | "submit" | "reset"
  disabled?: boolean
  onClick?: (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void
}

export function Button({ className, intent, size, underline, as = "button", href, type, disabled, ...props }: ButtonProps) {
  if (as === "a" && href) {
    return (
      <a className={twMerge(button({ intent, size, className, underline }))} href={href} {...props}>
        {props.children}
      </a>
    )
  }
  
  return (
    <button 
      type={type}
      disabled={disabled}
      className={twMerge(button({ intent, size, className, underline }))} 
      {...props}
    >
      {props.children}
    </button>
  )
}
