import * as React from "react"
import { Link, useLocation } from "wouter"
import { Book, Home, LogOut, Menu, Users, Link as LinkIcon, Settings, BookType } from "lucide-react"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// 导航项定义
const navItems = [
  {
    label: "首页",
    path: "/",
    icon: <Home className="h-5 w-5" />
  },
  {
    label: "我的小说",
    path: "/novels",
    icon: <Book className="h-5 w-5" />
  },
  {
    label: "人物列表",
    path: "/characters",
    icon: <Users className="h-5 w-5" />
  },
  {
    label: "角色关系",
    path: "/relationships",
    icon: <LinkIcon className="h-5 w-5" />
  },
  {
    label: "小说分类",
    path: "/novel-genres",
    icon: <BookType className="h-5 w-5" />
  },
  {
    label: "设置",
    path: "/settings",
    icon: <Settings className="h-5 w-5" />
  }
]

export function MobileNav() {
  const [open, setOpen] = React.useState(false)
  const { user, logoutMutation } = useAuth()
  const [location, navigate] = useLocation()
  
  // 处理注销
  const handleLogout = async () => {
    await logoutMutation.mutateAsync()
    setOpen(false)
    navigate("/auth")
  }
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">打开菜单</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 max-w-[280px]">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Book className="h-5 w-5 text-primary" />
              <span>人物关系管理器</span>
            </SheetTitle>
          </SheetHeader>
          
          {user && (
            <div className="flex items-center gap-3 p-4 border-b">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{user.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.username || "用户"}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email || ""}</p>
              </div>
            </div>
          )}
          
          <nav className="flex-1 px-2 py-4">
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = location === item.path || 
                  (item.path !== "/" && location.startsWith(item.path))
                
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`
                      flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors
                      ${isActive 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-foreground hover:bg-muted"}
                    `}
                    onClick={() => setOpen(false)}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </nav>
          
          <div className="p-4 border-t">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2" 
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 