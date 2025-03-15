import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import RelationshipGraph from "@/components/relationship/relationship-graph";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Share, MoreHorizontal, BookOpen } from "lucide-react";
import CharacterForm from "@/components/character/character-form";
import CharacterList from "@/components/character/character-list";
import RelationshipForm from "@/components/relationship/relationship-form";
import NovelForm from "@/components/novel/novel-form";

export default function NovelDetail() {
  const [match, params] = useRoute<{ id: string }>("/novels/:id");
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("characters");
  const [isAddCharacterModalOpen, setIsAddCharacterModalOpen] = useState(false);
  const [isAddRelationshipModalOpen, setIsAddRelationshipModalOpen] = useState(false);
  const [isEditNovelModalOpen, setIsEditNovelModalOpen] = useState(false);
  
  // Fetch novel data
  const { 
    data: novel,
    isLoading: isNovelLoading,
    isError: isNovelError
  } = useQuery({
    queryKey: [`/api/novels/${params?.id}`],
    enabled: !!params?.id,
  });
  
  // Fetch characters for this novel
  const { 
    data: characters = [],
    isLoading: isCharactersLoading,
    refetch: refetchCharacters
  } = useQuery({
    queryKey: [`/api/novels/${params?.id}/characters`],
    enabled: !!params?.id,
  });
  
  // Fetch relationships for this novel
  const { 
    data: relationships = [],
    isLoading: isRelationshipsLoading,
    refetch: refetchRelationships
  } = useQuery({
    queryKey: [`/api/novels/${params?.id}/relationships`],
    enabled: !!params?.id,
  });
  
  // Fetch relationship types
  const { 
    data: relationshipTypes = [],
    isLoading: isRelationshipTypesLoading
  } = useQuery({
    queryKey: ["/api/relationship-types"],
  });
  
  // If no match, redirect to novels page
  useEffect(() => {
    if (!match) {
      navigate("/novels");
    }
  }, [match, navigate]);
  
  if (isNovelLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar title="Novel Details" />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  if (isNovelError || !novel) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar title="Novel Details" />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">Novel not found</h3>
              <p className="mt-2 text-sm text-gray-500">
                The novel you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <div className="mt-6">
                <Button onClick={() => navigate("/novels")}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Novels
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={novel.title} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          <div className="mb-6 bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="w-full md:w-1/3 lg:w-1/4">
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-200">
                  {novel.coverImage ? (
                    <img src={novel.coverImage} alt={novel.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <BookOpen className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-gray-500">Genre</h4>
                    {novel.genre ? (
                      <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded">
                        {novel.genre}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Not specified</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-gray-500">Characters</h4>
                    <span className="text-gray-800 font-medium">{characters.length} characters</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-gray-500">Relationships</h4>
                    <span className="text-gray-800 font-medium">{relationships.length} connections</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-gray-500">Last Updated</h4>
                    <span className="text-gray-800 font-medium">
                      {new Date(novel.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="pt-2 flex gap-2">
                    <Button className="flex-1" onClick={() => setIsEditNovelModalOpen(true)}>
                      <Edit className="mr-1 h-4 w-4" /> Edit
                    </Button>
                    <Button variant="outline" size="icon">
                      <Share className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{novel.title}</h2>
                    <p className="mt-1 text-gray-600">
                      {novel.description || "No description provided."}
                    </p>
                  </div>
                  <Button variant="outline" size="icon" onClick={() => navigate("/novels")}>
                    <ArrowLeft className="h-4 w-4 text-gray-600" />
                  </Button>
                </div>
                
                {/* Tabs */}
                <div className="mt-6 border-b border-gray-200">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="border-b-0">
                      <TabsTrigger value="characters">Characters</TabsTrigger>
                      <TabsTrigger value="relationships">Relationship Map</TabsTrigger>
                      <TabsTrigger value="notes">Notes</TabsTrigger>
                      <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                {/* Tab Content */}
                <div className="mt-6">
                  {activeTab === "characters" && (
                    <CharacterList 
                      characters={characters}
                      isLoading={isCharactersLoading}
                      novelId={parseInt(params?.id || "0")}
                      onAddCharacter={() => setIsAddCharacterModalOpen(true)}
                      onUpdate={() => refetchCharacters()}
                    />
                  )}
                  
                  {activeTab === "relationships" && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Character Relationship Map</h3>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setIsAddCharacterModalOpen(true)}
                          >
                            <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg> 
                            Add Character
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setIsAddRelationshipModalOpen(true)}
                            disabled={characters.length < 2}
                          >
                            <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg> 
                            Add Relationship
                          </Button>
                        </div>
                      </div>
                      
                      <RelationshipGraph 
                        characters={characters}
                        relationships={relationships}
                        relationshipTypes={relationshipTypes}
                        isLoading={isCharactersLoading || isRelationshipsLoading || isRelationshipTypesLoading}
                      />
                    </div>
                  )}
                  
                  {activeTab === "notes" && (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-medium text-gray-400">Notes Feature Coming Soon</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        This feature is currently under development.
                      </p>
                    </div>
                  )}
                  
                  {activeTab === "timeline" && (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-medium text-gray-400">Timeline Feature Coming Soon</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        This feature is currently under development.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Add Character Modal */}
      <Dialog open={isAddCharacterModalOpen} onOpenChange={setIsAddCharacterModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Character</DialogTitle>
          </DialogHeader>
          <CharacterForm 
            novelId={parseInt(params?.id || "0")}
            onSuccess={() => {
              setIsAddCharacterModalOpen(false);
              refetchCharacters();
              toast({
                title: "Character added",
                description: "Character has been successfully added to your novel",
              });
            }}
          />
        </DialogContent>
      </Dialog>
      
      {/* Add Relationship Modal */}
      <Dialog open={isAddRelationshipModalOpen} onOpenChange={setIsAddRelationshipModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Relationship</DialogTitle>
          </DialogHeader>
          <RelationshipForm 
            novelId={parseInt(params?.id || "0")}
            characters={characters}
            relationshipTypes={relationshipTypes}
            onSuccess={() => {
              setIsAddRelationshipModalOpen(false);
              refetchRelationships();
              toast({
                title: "Relationship added",
                description: "Relationship has been successfully added",
              });
            }}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Novel Modal */}
      <Dialog open={isEditNovelModalOpen} onOpenChange={setIsEditNovelModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Novel</DialogTitle>
          </DialogHeader>
          <NovelForm 
            initialData={{
              id: parseInt(params?.id || "0"),
              title: novel.title,
              description: novel.description,
              genre: novel.genre,
              status: novel.status,
              coverImage: novel.coverImage
            }}
            onSuccess={() => {
              setIsEditNovelModalOpen(false);
              // Refetch novel data to update the UI
              queryClient.invalidateQueries({ queryKey: [`/api/novels/${params?.id}`] });
              toast({
                title: "Novel updated",
                description: "Your novel has been successfully updated",
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
