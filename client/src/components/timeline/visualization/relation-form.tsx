import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TimelineEvent, EventRelation } from '@/types/timeline';

interface RelationFormContentProps {
  events: TimelineEvent[];
  onSubmit: (relation: EventRelation) => void;
  onCancel: () => void;
}

export const RelationFormContent: React.FC<RelationFormContentProps> = ({
  events,
  onSubmit,
  onCancel
}) => {
  const [sourceEventId, setSourceEventId] = useState<number | null>(null);
  const [targetEventId, setTargetEventId] = useState<number | null>(null);
  const [relationType, setRelationType] = useState<'causes' | 'follows' | 'parallel'>('follows');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sourceEventId || !targetEventId) {
      alert('请选择源事件和目标事件');
      return;
    }
    
    if (sourceEventId === targetEventId) {
      alert('源事件和目标事件不能相同');
      return;
    }
    
    const relation: EventRelation = {
      sourceEventId,
      targetEventId,
      relationType,
      description
    };
    
    onSubmit(relation);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 源事件选择 */}
      <div className="space-y-2">
        <Label htmlFor="source-event">源事件</Label>
        <Select 
          onValueChange={(value) => setSourceEventId(parseInt(value))}
          required
        >
          <SelectTrigger id="source-event" className="w-full">
            <SelectValue placeholder="选择源事件" />
          </SelectTrigger>
          <SelectContent>
            {events.map(event => (
              <SelectItem key={`source-${event.id}`} value={event.id.toString()}>
                {event.title} ({event.date})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* 关系类型选择 */}
      <div className="space-y-2">
        <Label htmlFor="relation-type">关系类型</Label>
        <Select 
          value={relationType}
          onValueChange={(value) => setRelationType(value as 'causes' | 'follows' | 'parallel')}
          required
        >
          <SelectTrigger id="relation-type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="follows">跟随/发生于之后</SelectItem>
            <SelectItem value="causes">引起/导致</SelectItem>
            <SelectItem value="parallel">同时发生</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* 目标事件选择 */}
      <div className="space-y-2">
        <Label htmlFor="target-event">目标事件</Label>
        <Select 
          onValueChange={(value) => setTargetEventId(parseInt(value))}
          required
        >
          <SelectTrigger id="target-event" className="w-full">
            <SelectValue placeholder="选择目标事件" />
          </SelectTrigger>
          <SelectContent>
            {events.map(event => (
              <SelectItem 
                key={`target-${event.id}`} 
                value={event.id.toString()}
                disabled={sourceEventId === event.id}
              >
                {event.title} ({event.date})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* 描述 */}
      <div className="space-y-2">
        <Label htmlFor="relation-description">关系描述（可选）</Label>
        <Textarea
          id="relation-description"
          placeholder="输入关系的详细描述..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="resize-none"
          rows={3}
        />
      </div>
      
      {/* 操作按钮 */}
      <div className="flex justify-end space-x-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit">
          添加关系
        </Button>
      </div>
    </form>
  );
};
