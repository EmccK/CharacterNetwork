import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Menu, Bell, X, LayoutDashboard, Shield, BookOpen, Users, Link as LinkIcon, Settings, LogOut, BookType } from "lucide-react";
import { Link } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";

interface TopbarProps {
  title?: string;
}

export default function Topbar({ title = "控制面板" }: TopbarProps) {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  
  // 根据当前页面路径选择合适的图标
  const pageIcon = useMemo(() => {
    if (location === "/") return <LayoutDashboard className="h-6 w-6 text-primary-600" />;
    if (location === "/novels" || location.startsWith("/novels/")) return <BookOpen className="h-6 w-6 text-primary-600" />;
    if (location === "/characters") return <Users className="h-6 w-6 text-blue-600" />;
    if (location === "/relationships") return <LinkIcon className="h-6 w-6 text-green-600" />;
    if (location === "/novel-genres") return <BookType className="h-6 w-6 text-amber-600" />;
    if (location === "/admin") return <Shield className="h-6 w-6 text-red-600" />;
    if (location === "/settings") return <Settings className="h-6 w-6 text-gray-600" />;
    return <img src="/icons/icon-universal.svg" alt="小说人物关系" className="h-6 w-6" />;
  }, [location]);
  
  const openMobileMenu = () => {
    setMobileMenuVisible(true);
    setMenuClosing(false);
  };
  
  const closeMobileMenu = () => {
    setMenuClosing(true);
    // 等待动画完成后再隐藏菜单
    setTimeout(() => {
      setMobileMenuVisible(false);
      setMenuClosing(false);
      }, 300); // 与动画持续时间匹配
      };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <>
      <header className="bg-white shadow-sm z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden mr-2" 
              onClick={openMobileMenu}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <Link href="/" className="flex items-center mr-3">
              {pageIcon}
            </Link>
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5 text-gray-600" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-red-500 text-white font-bold">
                      {user?.username ? getInitials(user.username) : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  设置
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      {/* Mobile menu */}
      {mobileMenuVisible && (
        <div 
          className={`fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden fade-in ${menuClosing ? 'animate-out fade-out duration-300' : ''}`} 
          onClick={closeMobileMenu}
        >
          <div 
            className={`bg-white w-64 h-full overflow-y-auto ${menuClosing ? 'mobile-menu-exit' : 'mobile-menu-enter'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-primary-600 text-white flex justify-between items-center">
              <div className="flex items-center">
                {pageIcon}
                <h1 className="text-xl font-bold ml-3">小说人物关系管理</h1>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-primary-700" 
                onClick={closeMobileMenu}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <nav className="mt-4">
              <a 
                href="#" 
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-primary-600 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/");
                  closeMobileMenu();
                }}
              >
                <LayoutDashboard className="mr-3 text-xl" />
                <span>控制面板</span>
              </a>
              <a 
                href="#" 
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-primary-600 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/novels");
                  closeMobileMenu();
                }}
              >
                <BookOpen className="mr-3 text-xl" />
                <span>小说作品</span>
              </a>
              <a 
                href="#" 
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-primary-600 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/characters");
                  closeMobileMenu();
                }}
              >
                <Users className="mr-3 text-xl" />
                <span>人物角色</span>
              </a>
              <a 
                href="#" 
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-primary-600 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/relationships");
                  closeMobileMenu();
                }}
              >
                <LinkIcon className="mr-3 text-xl" />
                <span>角色关系</span>
              </a>
              
              {/* Admin panel - only shown for admin users */}
              {user?.isAdmin && (
                <a 
                  href="#" 
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-primary-600 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/admin");
                    closeMobileMenu();
                  }}
                >
                  <Shield className="mr-3 text-xl" />
                  <span>管理员面板</span>
                </a>
              )}
              
              <div className="border-t my-4"></div>
              
              <a 
                href="#" 
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-primary-600 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/settings");
                  closeMobileMenu();
                }}
              >
                <Settings className="mr-3 text-xl" />
                <span>设置</span>
              </a>
              <a 
                href="#" 
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-primary-600 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout();
                  closeMobileMenu();
                }}
              >
                <LogOut className="mr-3 text-xl" />
                <span>退出登录</span>
              </a>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

// No additional imports needed
