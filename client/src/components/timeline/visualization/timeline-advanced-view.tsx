import React, { useState, useEffect, useMemo } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  CalendarDays,
  Plus,
  Filter,
  Link2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import TimelineForm from '../timeline-form';
import { SortableTimelineItem } from './timeline-item';
import { RelationFormContent } from './relation-form';
import GanttView from './gantt-view';
import TreeView from './tree-view';
import RelationNetworkView from './relation-network-view';

// 导入类型定义
import { TimelineEvent, Character, Relationship, EventRelation } from '@/types/timeline';

interface TimelineAdvancedViewProps {
  events: TimelineEvent[];
  characters: Character[];
  relationships: Relationship[];
  novelId: number;
  onUpdate: () => void;
  viewType: 'list' | 'gantt' | 'tree' | 'relations';
}

const TimelineAdvancedView: React.FC<TimelineAdvancedViewProps> = ({
  events,
  characters,
  relationships,
  novelId,
  onUpdate,
  viewType
}) => {
  const { toast } = useToast();
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isAddRelationModalOpen, setIsAddRelationModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<TimelineEvent | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<number[]>([]);
  const [filterCharacterIds, setFilterCharacterIds] = useState<number[]>([]);
  const [filterImportance, setFilterImportance] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortedEvents, setSortedEvents] = useState<TimelineEvent[]>([]);
  const [eventRelations, setEventRelations] = useState<EventRelation[]>([]);

  // 设置DND传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates => ({
        ...sortableKeyboardCoordinates,
      }),
    })
  );

  // 当events变化时，更新排序后的事件列表
  useEffect(() => {
    setSortedEvents([...events].sort((a, b) => a.date.localeCompare(b.date)));
  }, [events]);

  // 过滤和搜索事件
  const filteredEvents = useMemo(() => {
    return sortedEvents.filter(event => {
      // 按角色过滤
      const passesCharacterFilter = filterCharacterIds.length === 0 ||
        filterCharacterIds.some(id => event.characterIds?.includes(id));

      // 按重要性过滤
      const passesImportanceFilter = filterImportance.length === 0 ||
        filterImportance.includes(event.importance);

      // 搜索标题和描述
      const matchesSearch = searchQuery === '' ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return passesCharacterFilter && passesImportanceFilter && matchesSearch;
    });
  }, [sortedEvents, filterCharacterIds, filterImportance, searchQuery]);

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

  // 处理拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedEvents.findIndex(item => item.id === active.id);
      const newIndex = sortedEvents.findIndex(item => item.id === over.id);

      const newArray = [...sortedEvents];
      const [removed] = newArray.splice(oldIndex, 1);
      newArray.splice(newIndex, 0, removed);

      setSortedEvents(newArray);

      // 这里可以添加API调用来永久保存新排序
      toast({
        title: '事件顺序已更新',
        description: '时间线事件顺序已成功更改',
      });
    }
  };

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

  // 添加事件关系
  const addEventRelation = (relation: EventRelation) => {
    setEventRelations([...eventRelations, relation]);

    toast({
      title: '关系已添加',
      description: '事件关系已成功创建',
    });
  };

  // 清除所有过滤器
  const clearAllFilters = () => {
    setFilterCharacterIds([]);
    setFilterImportance([]);
    setSearchQuery('');
  };

  return (
    <div className="space-y-4">
      {/* 顶部工具栏 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* 左侧 - 标题和事件添加按钮 */}
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-800">
            {viewType === 'list' && '时间线事件'}
            {viewType === 'gantt' && '甘特图视图'}
            {viewType === 'tree' && '树状结构图'}
            {viewType === 'relations' && '事件关系网络'}
          </h3>
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsAddEventModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> 添加事件
          </Button>
          {(viewType === 'tree' || viewType === 'relations') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddRelationModalOpen(true)}
              disabled={filteredEvents.length < 2}
            >
              <Link2 className="h-4 w-4 mr-1" /> 添加关联
            </Button>
          )}
        </div>

        {/* 右侧 - 过滤器和搜索 */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="搜索事件..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-[200px] pl-8"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-400"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="h-4 w-4 mr-1" />
                筛选
                {(filterCharacterIds.length > 0 || filterImportance.length > 0) && (
                  <Badge className="ml-1 bg-primary py-0 px-1.5 h-5" variant="default">
                    {filterCharacterIds.length + filterImportance.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 text-sm">按角色筛选</h4>
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {characters.map((character) => (
                      <div key={character.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-char-${character.id}`}
                          checked={filterCharacterIds.includes(character.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilterCharacterIds([...filterCharacterIds, character.id]);
                            } else {
                              setFilterCharacterIds(
                                filterCharacterIds.filter((id) => id !== character.id)
                              );
                            }
                          }}
                        />
                        <label
                          htmlFor={`filter-char-${character.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {character.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 text-sm">按重要性筛选</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {['minor', 'normal', 'important', 'critical'].map((importance) => (
                      <div key={importance} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-importance-${importance}`}
                          checked={filterImportance.includes(importance)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilterImportance([...filterImportance, importance]);
                            } else {
                              setFilterImportance(
                                filterImportance.filter((item) => item !== importance)
                              );
                            }
                          }}
                        />
                        <label
                          htmlFor={`filter-importance-${importance}`}
                          className="text-sm font-medium leading-none"
                        >
                          {getImportanceLabel(importance)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                  onClick={clearAllFilters}
                >
                  清除所有筛选
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* 显示当前激活的过滤器 */}
      {(filterCharacterIds.length > 0 || filterImportance.length > 0) && (
        <div className="flex flex-wrap gap-2 my-2">
          {filterCharacterIds.map(id => {
            const character = characters.find(c => c.id === id);
            return character ? (
              <Badge key={`char-${id}`} variant="secondary" className="flex items-center gap-1">
                {character.name}
                <button
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  onClick={() => setFilterCharacterIds(filterCharacterIds.filter(cid => cid !== id))}
                >
                  <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                  </svg>
                </button>
              </Badge>
            ) : null;
          })}

          {filterImportance.map(importance => (
            <Badge key={`imp-${importance}`} variant="secondary" className="flex items-center gap-1">
              {getImportanceLabel(importance)}
              <button
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                onClick={() => setFilterImportance(filterImportance.filter(imp => imp !== importance))}
              >
                <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                </svg>
              </button>
            </Badge>
          ))}

          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={clearAllFilters}
          >
            清除全部
          </Button>
        </div>
      )}

      {/* 不同的视图内容 */}
      {viewType === 'list' && (
        filteredEvents.length === 0 ? (
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext
                items={filteredEvents.map(event => event.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-0 relative z-10">
                  {filteredEvents.map((event) => (
                    <SortableTimelineItem
                      key={event.id}
                      event={event}
                      characters={characters}
                      isExpanded={expandedEvents.includes(event.id)}
                      toggleEventExpand={toggleEventExpand}
                      onEdit={setEventToEdit}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      getImportanceStyle={getImportanceStyle}
                      getImportanceLabel={getImportanceLabel}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )
      )}

      {viewType === 'gantt' && (
        <GanttView
          events={filteredEvents}
          characters={characters}
        />
      )}

      {viewType === 'tree' && (
        <TreeView
          events={filteredEvents}
          eventRelations={eventRelations}
          characters={characters}
        />
      )}

      {viewType === 'relations' && (
        <RelationNetworkView
          events={filteredEvents}
          characters={characters}
          eventRelations={eventRelations}
        />
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

      {/* 添加事件关系对话框 */}
      <Dialog open={isAddRelationModalOpen} onOpenChange={setIsAddRelationModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加事件关联</DialogTitle>
          </DialogHeader>
          <RelationFormContent
            events={events}
            onSubmit={addEventRelation}
            onCancel={() => setIsAddRelationModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimelineAdvancedView;