import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Clock, 
  Edit, 
  Trash,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TimelineEvent, Character } from '@/types/timeline';

interface SortableTimelineItemProps {
  event: TimelineEvent;
  characters: Character[];
  isExpanded: boolean;
  toggleEventExpand: (id: number) => void;
  onEdit: (event: TimelineEvent) => void;
  onDelete: (id: number) => void;
  getImportanceStyle: (importance: string) => string;
  getImportanceLabel: (importance: string) => string;
}

export const SortableTimelineItem: React.FC<SortableTimelineItemProps> = ({
  event,
  characters,
  isExpanded,
  toggleEventExpand,
  onEdit,
  onDelete,
  getImportanceStyle,
  getImportanceLabel
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: event.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const importanceStyle = getImportanceStyle(event.importance);
  
  return (
    <div ref={setNodeRef} style={style} className="relative pl-14 mt-6 first:mt-0">
      {/* 时间点标记 */}
      <div className={`absolute left-6 -translate-x-1/2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 ${importanceStyle} flex items-center justify-center`}>
        {event.importance === 'critical' && <Star className="h-3 w-3" />}
      </div>
      
      {/* 事件卡片 */}
      <div className={`rounded-lg border p-4 ${isExpanded ? 'shadow-sm' : ''} transition-all`}>
        <div className="flex items-start justify-between">
          <div 
            className="flex-1 cursor-pointer" 
            onClick={() => toggleEventExpand(event.id)}
          >
            <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{event.date}</span>
              
              <span className={`ml-2 px-1.5 py-0.5 rounded-sm text-xs ${importanceStyle}`}>
                {getImportanceLabel(event.importance)}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <h4 className="font-medium text-gray-900">{event.title}</h4>
              {!isExpanded && event.description && (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
              {isExpanded && (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
          
          <div className="flex items-center">
            <span
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing mr-2 text-gray-400 hover:text-gray-600"
            >
              <GripVertical className="h-5 w-5" />
            </span>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                >
                  <span className="sr-only">打开菜单</span>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                    <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor"></path>
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => onEdit(event)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  <span>编辑事件</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => {
                    if (window.confirm('确定要删除这个时间线事件吗？此操作不可撤销。')) {
                      onDelete(event.id);
                    }
                  }}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  <span>删除事件</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* 展开的详情 */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            {event.description ? (
              <p className="text-gray-700 text-sm whitespace-pre-line">
                {event.description}
              </p>
            ) : (
              <p className="text-gray-500 text-sm italic">暂无详细描述</p>
            )}
            
            {/* 相关角色 */}
            {event.characterIds && event.characterIds.length > 0 && (
              <div className="mt-3">
                <h5 className="text-xs font-medium text-gray-500 mb-1">相关角色</h5>
                <div className="flex flex-wrap gap-2">
                  {event.characterIds.map(charId => {
                    const character = characters.find(c => c.id === charId);
                    return character ? (
                      <span 
                        key={charId} 
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-50 text-purple-700"
                      >
                        {character.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
