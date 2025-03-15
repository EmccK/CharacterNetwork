import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Menu, Bell, Search, X, LayoutDashboard, Shield, BookOpen, Users, Link as LinkIcon, Settings, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [_, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
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
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          </div>
          <div className="flex items-center space-x-4">
            {!searchOpen ? (
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden" 
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
            ) : (
              <div className="flex items-center lg:hidden">
                <Input 
                  type="text"
                  placeholder="搜索..."
                  className="w-full"
                  autoFocus
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSearchOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}
            
            <div className="relative hidden lg:block">
              <Input 
                type="text" 
                placeholder="搜索..." 
                className="pl-10 pr-4 py-2 w-full max-w-xs"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5 text-gray-600" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary-600 text-white">
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
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden">
          <div className="bg-white w-64 h-full overflow-y-auto">
            <div className="p-4 bg-primary-600 text-white flex justify-between items-center">
              <h1 className="text-xl font-bold">小说人物关系管理</h1>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-primary-700" 
                onClick={() => setMobileMenuOpen(false)}
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
                  setMobileMenuOpen(false);
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
                  setMobileMenuOpen(false);
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
                  setMobileMenuOpen(false);
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
                  setMobileMenuOpen(false);
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
                    setMobileMenuOpen(false);
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
                  setMobileMenuOpen(false);
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
                  setMobileMenuOpen(false);
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
