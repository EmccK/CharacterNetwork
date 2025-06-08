import React, { useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import TimelineAdvancedView from '@/components/timeline/visualization/timeline-advanced-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

interface TimelineEvent {
  id: number;
  title: string;
  description: string | null;
  date: string;
  importance: string;
  characterIds: number[];
  novelId: number;
  createdAt: string;
}

interface Character {
  id: number;
  name: string;
  novelId: number;
  description: string | null;
  avatar: string | null;
  createdAt: string;
}

interface Relationship {
  id: number;
  novelId: number;
  description: string | null;
  sourceId: number;
  targetId: number;
  typeId: number;
}

const TimelinePage: React.FC = () => {
  const [match, params] = useRoute<{ id: string }>('/novels/:id/timeline');
  const [activeTab, setActiveTab] = useState('list');

  // 获取小说数据
  const {
    data: novel,
    isLoading: isNovelLoading,
  } = useQuery({
    queryKey: [`/api/novels/${params?.id}`],
    queryFn: () => fetch(`/api/novels/${params?.id}`, { credentials: "include" }).then(res => res.json()),
    enabled: !!params?.id,
  });

  // 获取该小说的时间线事件
  const {
    data: timelineEvents = [],
    isLoading: isTimelineEventsLoading,
    refetch: refetchTimelineEvents,
  } = useQuery<TimelineEvent[]>({
    queryKey: [`/api/novels/${params?.id}/timeline-events`],
    queryFn: () => fetch(`/api/novels/${params?.id}/timeline-events`, { credentials: "include" }).then(res => res.json()),
    enabled: !!params?.id,
  });

  // 获取该小说的角色
  const {
    data: characters = [],
    isLoading: isCharactersLoading,
  } = useQuery<Character[]>({
    queryKey: [`/api/novels/${params?.id}/characters`],
    queryFn: () => fetch(`/api/novels/${params?.id}/characters`, { credentials: "include" }).then(res => res.json()),
    enabled: !!params?.id,
  });

  // 获取该小说的角色关系
  const {
    data: relationships = [],
    isLoading: isRelationshipsLoading,
  } = useQuery<Relationship[]>({
    queryKey: [`/api/novels/${params?.id}/relationships`],
    queryFn: () => fetch(`/api/novels/${params?.id}/relationships`, { credentials: "include" }).then(res => res.json()),
    enabled: !!params?.id,
  });

  // 是否正在加载
  const isLoading = isNovelLoading || isTimelineEventsLoading || isCharactersLoading || isRelationshipsLoading;

  // 小说标题
  const novelTitle = (novel as any)?.title || '小说时间线';

  // 渲染加载状态
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">《{novelTitle}》时间线</h1>
        <p className="text-gray-600 mt-1">管理和可视化小说中的重要事件</p>
      </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="list">时间线列表</TabsTrigger>
                <TabsTrigger value="gantt">甘特图</TabsTrigger>
                <TabsTrigger value="tree">树状图</TabsTrigger>
                <TabsTrigger value="relations">关系网络</TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="mt-4">
                <TimelineAdvancedView
                  events={timelineEvents}
                  characters={characters}
                  relationships={relationships}
                  novelId={parseInt(params?.id || '0')}
                  onUpdate={refetchTimelineEvents}
                  viewType="list"
                />
              </TabsContent>

              <TabsContent value="gantt" className="mt-4">
                <TimelineAdvancedView
                  events={timelineEvents}
                  characters={characters}
                  relationships={relationships}
                  novelId={parseInt(params?.id || '0')}
                  onUpdate={refetchTimelineEvents}
                  viewType="gantt"
                />
              </TabsContent>

              <TabsContent value="tree" className="mt-4">
                <TimelineAdvancedView
                  events={timelineEvents}
                  characters={characters}
                  relationships={relationships}
                  novelId={parseInt(params?.id || '0')}
                  onUpdate={refetchTimelineEvents}
                  viewType="tree"
                />
              </TabsContent>

              <TabsContent value="relations" className="mt-4">
                <TimelineAdvancedView
                  events={timelineEvents}
                  characters={characters}
                  relationships={relationships}
                  novelId={parseInt(params?.id || '0')}
                  onUpdate={refetchTimelineEvents}
                  viewType="relations"
                />
              </TabsContent>
            </Tabs>
          </div>
    </div>
  );
};

export default TimelinePage;
