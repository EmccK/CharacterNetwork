import * as React from "react"
import { cn } from "@/lib/utils"

interface CardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  gap?: "none" | "sm" | "md" | "lg"
  columns?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
}

export function CardGrid({
  children,
  className,
  gap = "md",
  columns = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 },
  ...props
}: CardGridProps) {
  // 转换间距尺寸为Tailwind类
  const gapClasses = {
    none: "gap-0",
    sm: "gap-2", 
    md: "gap-4",
    lg: "gap-6"
  }
  
  // 动态生成响应式列数的类名
  const getColumnsClasses = () => {
    const classes = []
    
    if (columns.xs) classes.push(`grid-cols-${columns.xs}`)
    if (columns.sm) classes.push(`sm:grid-cols-${columns.sm}`)
    if (columns.md) classes.push(`md:grid-cols-${columns.md}`)
    if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`)
    if (columns.xl) classes.push(`xl:grid-cols-${columns.xl}`)
    
    return classes.join(' ')
  }
  
  return (
    <div
      className={cn(
        "grid",
        gapClasses[gap],
        getColumnsClasses(),
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
} 