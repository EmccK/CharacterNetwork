import * as React from "react"
import { Link, useLocation } from "wouter"
import { Book, Home, Users, Link as LinkIcon, Settings } from "lucide-react"

const navItems = [
  {
    label: "首页",
    path: "/",
    icon: <Home className="h-5 w-5" />
  },
  {
    label: "小说",
    path: "/novels",
    icon: <Book className="h-5 w-5" />
  },
  {
    label: "人物",
    path: "/characters",
    icon: <Users className="h-5 w-5" />
  },
  {
    label: "关系",
    path: "/relationships",
    icon: <LinkIcon className="h-5 w-5" />
  },
  {
    label: "设置",
    path: "/settings",
    icon: <Settings className="h-5 w-5" />
  }
]

export function MobileTabbar() {
  const [location] = useLocation()
  
  // 确保始终固定在底部
  React.useEffect(() => {
    const fixTabBarPosition = () => {
      const viewportHeight = window.innerHeight
      document.documentElement.style.setProperty('--viewport-height', `${viewportHeight}px`)
    }
    
    // 设置CSS变量用于图标效果
    document.documentElement.style.setProperty('--primary-rgb', '14, 165, 233')
    
    // 页面加载和方向变化时重新计算
    window.addEventListener('resize', fixTabBarPosition)
    window.addEventListener('orientationchange', fixTabBarPosition)
    fixTabBarPosition()
    
    return () => {
      window.removeEventListener('resize', fixTabBarPosition)
      window.removeEventListener('orientationchange', fixTabBarPosition)
    }
  }, [])
  
  return (
    <nav className="mobile-tabbar md:hidden">
      {navItems.map((item) => {
        // 改进选中状态判断逻辑
        const isActive = 
          location === item.path || 
          (item.path !== "/" && location.startsWith(item.path))
        
        return (
          <Link 
            key={item.path} 
            href={item.path}
            className={`mobile-tabbar-item ${isActive ? 'mobile-tabbar-item-active' : ''}`}
          >
            {item.icon}
            <span className="mobile-tabbar-label">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
} 