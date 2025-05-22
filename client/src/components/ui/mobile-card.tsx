import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

const mobileCardVariants = cva(
  "relative flex flex-col overflow-hidden rounded-lg border transition-all duration-200 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground shadow-sm hover:shadow",
        outline: "border-2 bg-background hover:bg-accent/50",
        ghost: "border-none shadow-none bg-transparent hover:bg-accent/50",
      },
      size: {
        default: "p-3",
        sm: "p-2",
        lg: "p-4",
      },
      isActive: {
        true: "border-primary/50 bg-primary/5",
        false: "",
      },
      hasArrow: {
        true: "",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      isActive: false,
      hasArrow: false,
    },
  }
)

export interface MobileCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof mobileCardVariants> {
  asChild?: boolean
  thumbnail?: React.ReactNode
  title: string
  subtitle?: string
  badge?: React.ReactNode
  meta?: string
  leading?: React.ReactNode
  action?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}

const MobileCard = React.forwardRef<HTMLDivElement, MobileCardProps>(
  ({
    className,
    variant,
    size,
    isActive,
    hasArrow = false,
    thumbnail,
    title,
    subtitle,
    badge,
    meta,
    leading,
    action,
    onClick,
    disabled = false,
    ...props
  }, ref) => {
    const handleClick = () => {
      if (!disabled && onClick) {
        onClick()
      }
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          mobileCardVariants({ variant, size, isActive, hasArrow }),
          disabled && "opacity-60 pointer-events-none",
          onClick && "cursor-pointer",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        <div className="flex items-center gap-3">
          {leading && (
            <div className="flex-shrink-0">
              {leading}
            </div>
          )}
          
          {thumbnail && (
            <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden">
              {thumbnail}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-sm truncate">{title}</h3>
              {badge && (
                <div className="flex-shrink-0">
                  {badge}
                </div>
              )}
            </div>
            
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
            
            {meta && (
              <p className="text-xs text-muted-foreground mt-1">{meta}</p>
            )}
          </div>
          
          {action ? (
            <div className="flex-shrink-0 ml-2">
              {action}
            </div>
          ) : hasArrow ? (
            <ChevronRight className="flex-shrink-0 ml-2 h-5 w-5 text-muted-foreground" />
          ) : null}
        </div>
      </div>
    )
  }
)

MobileCard.displayName = "MobileCard"

export { MobileCard } 