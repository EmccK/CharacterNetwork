import * as React from "react"
import Topbar from "./topbar"
import { MobileTabbar } from "./mobile-tabbar"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

interface MainLayoutProps {
  children: React.ReactNode
  title?: string
  className?: string
  fullWidth?: boolean
  showTopbar?: boolean
  showTabbar?: boolean
}

export function MainLayout({
  children,
  title,
  className,
  fullWidth = false,
  showTopbar = true,
  showTabbar = true
}: MainLayoutProps) {
  const isMobile = useIsMobile()
  
  return (
    <div className="flex flex-col min-h-screen">
      {showTopbar && <Topbar title={title} />}
      
      <main 
        className={cn(
          "flex-1",
          !fullWidth && "container",
          "py-4 px-4 md:py-6 md:px-6",
          isMobile && "pb-24", // 增加底部填充，避免内容被底部导航栏遮挡
          className
        )}
        style={{
          marginBottom: isMobile ? 'var(--tabbar-margin, 0px)' : '0',
        }}
      >
        {children}
      </main>
      
      {showTabbar && isMobile && <MobileTabbar />}
    </div>
  )
} 