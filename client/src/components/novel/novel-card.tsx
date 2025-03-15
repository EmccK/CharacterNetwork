import { Novel } from "@shared/schema";
import { 
  Card,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NovelCardProps {
  novel: Novel;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function NovelCard({ novel, onView, onEdit, onDelete }: NovelCardProps) {
  // Function to calculate time ago from date
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const updated = new Date(date);
    const diffMs = now.getTime() - updated.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Updated today";
    } else if (diffDays === 1) {
      return "Updated yesterday";
    } else {
      return `Updated ${diffDays} days ago`;
    }
  };
  
  // Generate random colors for the character avatars
  const getRandomColor = (index: number) => {
    const colors = [
      "bg-blue-500", "bg-red-500", "bg-green-500", "bg-purple-500", 
      "bg-yellow-500", "bg-pink-500", "bg-indigo-500", "bg-cyan-500",
      "bg-lime-500", "bg-fuchsia-500", "bg-orange-500", "bg-teal-500"
    ];
    return colors[index % colors.length];
  };
  
  // Placeholder for character avatars since we're not fetching characters here
  // In a real implementation, you would fetch characters for this novel
  const characterPlaceholders = Array.from({ length: 3 }, (_, i) => ({
    id: i,
    name: "Character " + (i + 1),
    initials: String.fromCharCode(65 + i),
    color: getRandomColor(i)
  }));
  
  return (
    <Card className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow h-full group">
      <div className="relative aspect-[2/3] bg-gray-100">
        {novel.coverImage ? (
          <img 
            src={novel.coverImage} 
            alt={novel.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}
        {novel.genre && (
          <div className="absolute top-2 right-2">
            <div className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-md font-medium">
              {novel.genre}
            </div>
          </div>
        )}
        
        {/* Quick action buttons as overlay */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 p-0 text-white rounded-full bg-black/30 hover:bg-black/50"
            onClick={onView}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 p-0 text-white rounded-full bg-black/30 hover:bg-black/50"
            onClick={onEdit}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 p-0 text-white rounded-full bg-black/30 hover:bg-red-500/70"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-1">
          <h4 className="text-sm font-semibold line-clamp-1">{novel.title}</h4>
          <span className="text-[10px] text-gray-500 whitespace-nowrap ml-1">
            {getTimeAgo(novel.updatedAt)}
          </span>
        </div>
        
        <p className="text-xs text-gray-600 line-clamp-2 mb-2 h-8">
          {novel.description || "No description provided."}
        </p>
        
        {/* Character avatars - simplified */}
        <div className="flex -space-x-1.5">
          {characterPlaceholders.slice(0, 3).map((char) => (
            <Avatar key={char.id} className={`w-6 h-6 border-2 border-white ${char.color}`}>
              <AvatarFallback className="text-white text-[10px] font-medium">
                {char.initials}
              </AvatarFallback>
            </Avatar>
          ))}
          {characterPlaceholders.length > 3 && (
            <Avatar className="w-6 h-6 border-2 border-white bg-gray-400">
              <AvatarFallback className="text-white text-[10px] font-medium">
                +{characterPlaceholders.length - 3}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
