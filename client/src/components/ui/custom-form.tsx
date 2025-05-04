import * as React from "react"
import { cn } from "@/lib/utils"

export const FormContainer = ({ 
  children,
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      {children}
    </div>
  )
}

export const FormItem = ({ 
  children,
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {children}
    </div>
  )
}

export const FormLabel = ({ 
  children,
  className,
  ...props 
}: React.HTMLAttributes<HTMLLabelElement>) => {
  return (
    <label 
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    >
      {children}
    </label>
  )
}

export const FormMessage = ({ 
  children,
  className,
  ...props 
}: React.HTMLAttributes<HTMLParagraphElement>) => {
  return (
    <p
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {children}
    </p>
  )
}