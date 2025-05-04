import React, { useState } from 'react';
import { 
  CalendarDays, 
  Clock, 
  Edit, 
  Plus, 
  Star, 
  Trash,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import TimelineForm from './timeline-form';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface TimelineEvent {
  id: number;
  title: string;
  description?: string;
  date: string;
  importance: string;
  characterIds: number[];
  novelId: number;
  createdAt: string;
}

interface Character {
  id: number;
  name: string;
  avatar?: string | null;
}

interface TimelineViewProps {
  events: TimelineEvent[];
  characters: Character[];
  novelId: number;
  isLoading: boolean;
  onUpdate: () => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({
  events,
  characters,
  novelId,
  isLoading,
  onUpdate,
}) => {
  const { toast } = useToast();
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<TimelineEvent | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<number[]>([]);

  // 处理删除事件
  const deleteMutation = useMutation({
    mutationFn: (eventId: number) =>
      apiRequest('DELETE', `/api/timeline-events/${eventId}`, {}),
    onSuccess: () => {
      toast({
        title: '事件已删除',
        description: '时间线事件已成功删除',
      });
      onUpdate();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: '删除失败',
        description: (error as Error).message,
      });
    },
  });

  // 处理事件折叠/展开
  const toggleEventExpand = (eventId: number) => {
    if (expandedEvents.includes(eventId)) {
      setExpandedEvents(expandedEvents.filter(id => id !== eventId));
    } else {
      setExpandedEvents([...expandedEvents, eventId]);
    }
  };

  // 根据重要性获取样式
  const getImportanceStyle = (importance: string) => {
    switch (importance) {
      case 'minor':
        return 'bg-gray-100 border-gray-300 text-gray-700';
      case 'normal':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'important':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  // 获取重要性标签文本
  const getImportanceLabel = (importance: string) => {
    switch (importance) {
      case 'minor': return '次要';
      case 'normal': return '普通';
      case 'important': return '重要';
      case 'critical': return '关键';
      default: return '普通';
    }
  };

  // 根据事件重要性排序
  const sortedEvents = [...events].sort((a, b) => {
    // 按日期排序，日期可能是自定义格式，需要考虑解析问题
    return a.date.localeCompare(b.date);
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">故事时间线</h3>
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => setIsAddEventModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" /> 添加事件
        </Button>
      </div>

      {/* 时间线列表 */}
      {sortedEvents.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <CalendarDays className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无时间线事件</h3>
          <p className="text-gray-500 mb-4">添加重要事件来构建故事时间线</p>
          <Button onClick={() => setIsAddEventModalOpen(true)}>
            添加第一个事件
          </Button>
        </div>
      ) : (
        <div className="relative">
          {/* 垂直时间线 */}
          <div className="absolute top-0 bottom-0 left-6 w-0.5 bg-gray-200 z-0"></div>
          
          {/* 时间线事件列表 */}
          <div className="space-y-6 relative z-10">
            {sortedEvents.map((event) => {
              const isExpanded = expandedEvents.includes(event.id);
              const importanceStyle = getImportanceStyle(event.importance);
              
              return (
                <div key={event.id} className="relative pl-14">
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
                            onClick={() => {
                              setEventToEdit(event);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            <span>编辑事件</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              if (window.confirm('确定要删除这个时间线事件吗？此操作不可撤销。')) {
                                deleteMutation.mutate(event.id);
                              }
                            }}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            <span>删除事件</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
            })}
          </div>
        </div>
      )}

      {/* 添加事件对话框 */}
      <Dialog open={isAddEventModalOpen} onOpenChange={setIsAddEventModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加时间线事件</DialogTitle>
          </DialogHeader>
          <TimelineForm
            novelId={novelId}
            characters={characters}
            onSuccess={() => {
              setIsAddEventModalOpen(false);
              onUpdate();
              toast({
                title: '事件已添加',
                description: '时间线事件已成功添加',
              });
            }}
            mode="create"
          />
        </DialogContent>
      </Dialog>

      {/* 编辑事件对话框 */}
      <Dialog 
        open={!!eventToEdit} 
        onOpenChange={(open) => {
          if (!open) setEventToEdit(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑时间线事件</DialogTitle>
          </DialogHeader>
          {eventToEdit && (
            <TimelineForm
              novelId={novelId}
              characters={characters}
              timelineEvent={eventToEdit}
              onSuccess={() => {
                setEventToEdit(null);
                onUpdate();
                toast({
                  title: '事件已更新',
                  description: '时间线事件已成功更新',
                });
              }}
              mode="edit"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimelineView;
