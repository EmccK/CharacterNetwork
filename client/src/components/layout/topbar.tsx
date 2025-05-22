import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Bell, LayoutDashboard, Shield, BookOpen, Users, Link as LinkIcon, Settings, BookType } from "lucide-react";
import { Link, useLocation } from "wouter";
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
import { MobileNav } from "./mobile-nav";
import { useIsMobile } from "@/hooks/use-mobile";

interface TopbarProps {
  title?: string;
}

export default function Topbar({ title = "控制面板" }: TopbarProps) {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const isMobile = useIsMobile();
  
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
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };
  
  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate("/auth");
  };
  
  return (
    <header className="bg-white shadow-sm z-10 sticky top-0">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {isMobile && <MobileNav />}
          
          <Link href="/" className="flex items-center">
            {pageIcon}
          </Link>
          <h2 className="text-xl font-semibold text-gray-800 hidden xs:block">{title}</h2>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Bell className="h-5 w-5 text-gray-600" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-white font-bold">
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
  );
}

// No additional imports needed
