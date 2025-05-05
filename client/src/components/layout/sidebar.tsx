import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  BookOpen, 
  Users, 
  Link, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  Shield,
  BookType
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  count?: number;
}

function SidebarLink({ href, icon, children, active, onClick, count }: SidebarLinkProps) {
  return (
    <a 
      href={href} 
      className={cn(
        "flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-primary-600 transition-colors",
        active && "bg-gray-100 text-primary-600"
      )}
      onClick={(e) => {
        e.preventDefault();
        if (onClick) onClick();
      }}
    >
      <span className="w-6 h-6 flex items-center justify-center mr-3">{icon}</span>
      <span className="flex-grow text-sm font-medium">{children}</span>
      {count !== undefined && (
        <span className="ml-auto bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 text-xs font-medium">
          {count}
        </span>
      )}
    </a>
  );
}

export default function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  
  // 获取小说总数
  const { data: novels = [] } = useQuery({
    queryKey: ["/api/novels"],
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });
  
  // 获取所有小说的角色总数
  const { data: allCharacters = [] } = useQuery({
    queryKey: ["allCharacters"],
    queryFn: async () => {
      if (novels.length === 0) return [];
      
      let characters = [];
      for (const novel of novels) {
        try {
          const chars = await fetch(`/api/novels/${novel.id}/characters`, {
            credentials: "include"
          }).then(res => res.json());
          characters = [...characters, ...chars];
        } catch (e) {
          console.error(`无法获取小说 ID ${novel.id} 的角色`, e);
        }
      }
      return characters;
    },
    enabled: novels.length > 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });
  
  // 获取所有小说的关系总数
  const { data: allRelationships = [] } = useQuery({
    queryKey: ["allRelationships"],
    queryFn: async () => {
      if (novels.length === 0) return [];
      
      let relationships = [];
      for (const novel of novels) {
        try {
          const rels = await fetch(`/api/novels/${novel.id}/relationships`, {
            credentials: "include"
          }).then(res => res.json());
          relationships = [...relationships, ...rels];
        } catch (e) {
          console.error(`无法获取小说 ID ${novel.id} 的关系`, e);
        }
      }
      return relationships;
    },
    enabled: novels.length > 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <div className="bg-white w-64 hidden md:block shadow-md">
    <div className="p-4 bg-primary-600 text-white">
    <div className="flex items-center">
        <img src="/icons/icon-universal.svg" alt="小说人物关系" className="h-8 w-8 mr-3" />
          <h1 className="text-xl font-bold">小说人物关系管理</h1>
        </div>
      </div>
      <nav className="mt-4">
        <SidebarLink 
          href="/" 
          icon={<LayoutDashboard className="text-xl" />}
          active={location === "/"}
          onClick={() => navigate("/")}
        >
          控制面板
        </SidebarLink>
        <SidebarLink 
          href="/novels" 
          icon={<BookOpen className="text-xl" />}
          active={location === "/novels" || location.startsWith("/novels/")}
          onClick={() => navigate("/novels")}
          count={novels.length}
        >
          小说作品
        </SidebarLink>
        <SidebarLink 
          href="/characters" 
          icon={<Users className="text-xl" />}
          active={location === "/characters"}
          onClick={() => navigate("/characters")}
          count={allCharacters.length}
        >
          人物角色
        </SidebarLink>
        <SidebarLink 
          href="/relationships" 
          icon={<Link className="text-xl" />}
          active={location === "/relationships"}
          onClick={() => navigate("/relationships")}
          count={allRelationships.length}
        >
          角色关系
        </SidebarLink>
        <SidebarLink 
          href="/novel-genres" 
          icon={<BookType className="text-xl" />}
          active={location === "/novel-genres"}
          onClick={() => navigate("/novel-genres")}
        >
          小说类型
        </SidebarLink>
        
        {/* Admin panel - only shown for admin users */}
        {user?.isAdmin && (
          <SidebarLink 
            href="/admin" 
            icon={<Shield className="text-xl" />}
            active={location === "/admin"}
            onClick={() => navigate("/admin")}
          >
            管理员面板
          </SidebarLink>
        )}
        
        <div className="border-t my-4"></div>
        
        <SidebarLink 
          href="/settings" 
          icon={<Settings className="text-xl" />}
          active={location === "/settings"}
          onClick={() => navigate("/settings")}
        >
          设置
        </SidebarLink>
        <SidebarLink 
          href="/logout" 
          icon={<LogOut className="text-xl" />}
          onClick={handleLogout}
        >
          退出登录
        </SidebarLink>
      </nav>
    </div>
  );
}
