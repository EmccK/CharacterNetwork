import React, { useState, useEffect } from 'react';
import type { Character, Relationship, RelationshipType } from '@shared/schema';
import GraphVisualization from './graph/GraphVisualization';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, UsersRound, Network } from 'lucide-react';

interface CharacterNetworkGraphProps {
  characters: Character[];
  relationships: Relationship[];
  relationshipTypes: RelationshipType[];
  isLoading?: boolean;
  onSelectCharacter?: (character: Character | null) => void;
  onBack?: () => void;
}

export default function CharacterNetworkGraph({
  characters,
  relationships,
  relationshipTypes,
  isLoading = false,
  onSelectCharacter,
  onBack
}: CharacterNetworkGraphProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [selectedTab, setSelectedTab] = useState('graph');
  const [notifiedCharacterIds, setNotifiedCharacterIds] = useState<Set<number>>(new Set());

  // 处理节点选择
  const handleNodeSelect = (character: Character | null) => {
    // 如果点击已选中的角色，则将其反选
    if (character && selectedCharacter && character.id === selectedCharacter.id) {
      setSelectedCharacter(null);
      if (onSelectCharacter) {
        onSelectCharacter(null);
      }
      return;
    }
    
    // 选中一个新的角色，自动切换到信息标签
    if (character) {
      setSelectedCharacter(character);
      
      if (onSelectCharacter) {
        onSelectCharacter(character);
        
        // 添加到已通知集合，便于展示通知需求
        if (!notifiedCharacterIds.has(character.id)) {
          setNotifiedCharacterIds(prev => {
            const newSet = new Set(prev);
            newSet.add(character.id);
            return newSet;
          });
        }
      }
    } else if (!character) {
      // 取消选中（点击空白处）
      setSelectedCharacter(null);
      if (onSelectCharacter) {
        onSelectCharacter(null);
      }
    }
  };

  // 获取与选中角色相关的关系
  const getRelatedRelationships = (characterId: number) => {
    return relationships.filter(rel => 
      rel.sourceId === characterId || rel.targetId === characterId
    );
  };

  // 获取与选中角色相关的其他角色
  const getRelatedCharacters = (characterId: number) => {
    const relatedIds = new Set<number>();
    
    relationships.forEach(rel => {
      if (rel.sourceId === characterId) {
        relatedIds.add(rel.targetId);
      } else if (rel.targetId === characterId) {
        relatedIds.add(rel.sourceId);
      }
    });
    
    return characters.filter(char => relatedIds.has(char.id));
  };

  // 根据关系ID获取关系类型
  const getRelationshipTypeName = (typeId: number) => {
    const relType = relationshipTypes.find(type => type.id === typeId);
    return relType?.name || '未知关系';
  };

  // 获取关系描述
  const getRelationshipDescription = (rel: Relationship) => {
    const source = characters.find(c => c.id === rel.sourceId);
    const target = characters.find(c => c.id === rel.targetId);
    const typeName = getRelationshipTypeName(rel.typeId);
    
    if (!source || !target) return '';
    
    return `${source.name} 与 ${target.name} 的关系是 ${typeName}`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          {onBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack} 
              className="mr-2"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              返回
            </Button>
          )}
          <h2 className="text-xl font-bold">角色关系网络</h2>
        </div>
        
        <div className="w-auto">
          <Button
            variant={selectedTab === 'graph' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTab('graph')}
            className="mr-2"
          >
            <Network className="h-4 w-4 mr-1" />
            图谱视图
          </Button>
          <Button
            variant={selectedTab === 'info' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTab('info')}
          >
            <User className="h-4 w-4 mr-1" />
            角色信息
          </Button>
        </div>
      </div>

      {selectedTab === 'graph' && (
        <div className="mt-0 flex-grow">
          <Card className="border rounded-lg shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <GraphVisualization
                characters={characters}
                relationships={relationships}
                relationshipTypes={relationshipTypes}
                isLoading={isLoading}
                onNodeSelect={handleNodeSelect}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === 'info' && (
        <div className="mt-0">
          {selectedCharacter ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    {selectedCharacter.avatar ? (
                      <img 
                        src={selectedCharacter.avatar} 
                        alt={selectedCharacter.name} 
                        className="w-24 h-24 rounded-full object-cover border-2 border-primary/20"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold mb-1">{selectedCharacter.name}</h3>
                    {selectedCharacter.title && (
                      <p className="text-sm text-gray-500 mb-2">{selectedCharacter.title}</p>
                    )}
                    
                    {selectedCharacter.description && (
                      <p className="text-gray-700 mb-4">{selectedCharacter.description}</p>
                    )}
                    
                    <div className="mt-4">
                      <h4 className="font-medium text-sm text-gray-500 mb-2 flex items-center">
                        <UsersRound className="h-4 w-4 mr-1" />
                        关系网络
                      </h4>
                      <div className="space-y-3">
                        {getRelatedRelationships(selectedCharacter.id).map(rel => {
                          const relType = relationshipTypes.find(type => type.id === rel.typeId);
                          const otherCharId = rel.sourceId === selectedCharacter.id ? rel.targetId : rel.sourceId;
                          const otherChar = characters.find(c => c.id === otherCharId);
                          
                          if (!otherChar || !relType) return null;
                          
                          return (
                            <div 
                              key={`rel-${rel.id}`} 
                              className="flex items-center p-2 rounded-md hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex-shrink-0 mr-3">
                                {otherChar.avatar ? (
                                  <img 
                                    src={otherChar.avatar} 
                                    alt={otherChar.name} 
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <User className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-grow">
                                <div className="font-medium">{otherChar.name}</div>
                                <div className="text-sm text-gray-500">{otherChar.title}</div>
                              </div>
                              <Badge 
                                style={{backgroundColor: relType.color}}
                                className="ml-2"
                              >
                                {relType.name}
                              </Badge>
                            </div>
                          );
                        })}
                        
                        {getRelatedRelationships(selectedCharacter.id).length === 0 && (
                          <p className="text-sm text-gray-500 italic">此角色暂无关系连接</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <UsersRound className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <h3 className="text-lg font-medium mb-1">未选择角色</h3>
                  <p className="text-sm">从图谱中选择一个角色以查看详细信息</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
