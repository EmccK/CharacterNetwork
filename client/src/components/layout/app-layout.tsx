import * as React from "react"
import { useLocation } from "wouter"
import { useAuth } from "@/hooks/use-auth"
import { useIsMobile } from "@/hooks/use-mobile"
import Topbar from "./topbar"
import Sidebar from "./sidebar"
import { MobileTabbar } from "./mobile-tabbar"
import { cn } from "@/lib/utils"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile()
  const [location] = useLocation()
  const { user, isLoading } = useAuth()

  // 如果是登录页面，不显示导航栏
  const isAuthPage = location === "/auth"

  // 获取当前页面标题
  const getPageTitle = () => {
    if (location === "/") return "控制面板"
    if (location.startsWith("/novels") && !location.includes("/timeline")) return "我的小说"
    if (location === "/characters") return "人物列表"
    if (location === "/relationships") return "角色关系"
    if (location === "/novel-genres") return "小说分类"
    if (location === "/admin") return "管理员面板"
    if (location === "/settings") return "设置"
    if (location.includes("/timeline")) return "时间线"
    return "人物关系管理器"
  }

  // 如果是登录页面，直接渲染子组件
  if (isAuthPage) {
    return <>{children}</>
  }

  // 如果正在加载认证状态，显示加载指示器
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">正在验证身份...</p>
        </div>
      </div>
    )
  }

  // 如果用户未登录，让子组件处理重定向
  if (!user) {
    return <>{children}</>
  }
  
  return (
    <div className="flex flex-col min-h-screen md:flex-row">
      {!isAuthPage && !isMobile && <Sidebar />}
      
      <div className="flex flex-col flex-1 min-h-screen overflow-hidden">
        {!isAuthPage && <Topbar title={getPageTitle()} />}
        
        <main 
          className={cn(
            "flex-1",
            "py-4 px-4 md:py-6 md:px-6",
            isMobile && !isAuthPage && "pb-24" // 只在移动端为底部导航留出空间
          )}
          style={{
            marginBottom: isMobile && !isAuthPage ? 'var(--tabbar-margin, 0px)' : '0',
          }}
        >
          {children}
        </main>
        
        {isMobile && !isAuthPage && <MobileTabbar />}
      </div>
    </div>
  )
} 