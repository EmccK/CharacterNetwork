import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { 
  BookOpen, 
  Users, 
  Link, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

function SidebarLink({ href, icon, children, active, onClick }: SidebarLinkProps) {
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
      {icon}
      <span className="ml-3">{children}</span>
    </a>
  );
}

export default function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <div className="bg-white w-64 hidden md:block shadow-md">
      <div className="p-4 bg-primary-600 text-white">
        <h1 className="text-xl font-bold">Novel Character Manager</h1>
      </div>
      <nav className="mt-4">
        <SidebarLink 
          href="/" 
          icon={<LayoutDashboard className="text-xl" />}
          active={location === "/"}
          onClick={() => navigate("/")}
        >
          Dashboard
        </SidebarLink>
        <SidebarLink 
          href="/novels" 
          icon={<BookOpen className="text-xl" />}
          active={location === "/novels" || location.startsWith("/novels/")}
          onClick={() => navigate("/novels")}
        >
          Novels
        </SidebarLink>
        <SidebarLink 
          href="/characters" 
          icon={<Users className="text-xl" />}
          active={location === "/characters"}
          onClick={() => navigate("/characters")}
        >
          Characters
        </SidebarLink>
        <SidebarLink 
          href="/relationships" 
          icon={<Link className="text-xl" />}
          active={location === "/relationships"}
          onClick={() => navigate("/relationships")}
        >
          Relationships
        </SidebarLink>
        
        {/* Admin panel - only shown for admin users */}
        {user?.isAdmin && (
          <SidebarLink 
            href="/admin" 
            icon={<Shield className="text-xl" />}
            active={location === "/admin"}
            onClick={() => navigate("/admin")}
          >
            Admin Panel
          </SidebarLink>
        )}
        
        <div className="border-t my-4"></div>
        
        <SidebarLink 
          href="/settings" 
          icon={<Settings className="text-xl" />}
          active={location === "/settings"}
          onClick={() => navigate("/settings")}
        >
          Settings
        </SidebarLink>
        <SidebarLink 
          href="/logout" 
          icon={<LogOut className="text-xl" />}
          onClick={handleLogout}
        >
          Logout
        </SidebarLink>
      </nav>
    </div>
  );
}
