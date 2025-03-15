import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import NovelCard from "@/components/novel/novel-card";
import NovelForm from "@/components/novel/novel-form";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RefreshCcw, Plus, FilterIcon } from "lucide-react";

export default function NovelsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [genreFilter, setGenreFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updated");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  // Fetch novels
  const { data: novels = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/novels"],
  });
  
  // Delete novel mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/novels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/novels"] });
      toast({
        title: "Novel deleted",
        description: "The novel has been successfully deleted",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete novel",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filter and sort novels
  const filteredNovels = novels
    .filter((novel: any) => {
      // Apply genre filter
      if (genreFilter !== "all" && novel.genre !== genreFilter) return false;
      
      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return novel.title.toLowerCase().includes(query) || 
               (novel.description && novel.description.toLowerCase().includes(query));
      }
      
      return true;
    })
    .sort((a: any, b: any) => {
      // Apply sorting
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "created":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "updated":
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });
  
  // Get unique genres for filter dropdown
  const uniqueGenres = Array.from(new Set(novels.map((novel: any) => novel.genre).filter(Boolean)));
  
  const handleDeleteNovel = (id: number) => {
    if (window.confirm("Are you sure you want to delete this novel? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Novels" />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">My Novels</h3>
              <Button
                className="bg-primary-600 hover:bg-primary-700"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="mr-1 h-4 w-4" /> Add Novel
              </Button>
            </div>
            
            {/* Search and Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Input 
                  type="text" 
                  placeholder="Search novels..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <FilterIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              
              <Select value={genreFilter} onValueChange={setGenreFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {uniqueGenres.map((genre: string) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">Recently Updated</SelectItem>
                  <SelectItem value="created">Recently Created</SelectItem>
                  <SelectItem value="title">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Novel Waterfall Grid */}
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredNovels.length > 0 ? (
              <div className="waterfall-grid">
                {filteredNovels.map((novel: any) => (
                  <NovelCard 
                    key={novel.id} 
                    novel={novel} 
                    onView={() => navigate(`/novels/${novel.id}`)}
                    onEdit={() => navigate(`/novels/${novel.id}`)}
                    onDelete={() => handleDeleteNovel(novel.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <div className="flex justify-center">
                  <div className="bg-gray-100 p-3 rounded-full">
                    <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No novels found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery || genreFilter !== "all" 
                    ? "Try changing your search or filter criteria"
                    : "Start by adding your first novel"}
                </p>
                <div className="mt-6">
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="mr-1 h-4 w-4" /> Add Novel
                  </Button>
                </div>
              </div>
            )}
            
            {/* Pagination (simplified) */}
            {filteredNovels.length > 0 && (
              <div className="mt-6 flex justify-center">
                <nav className="inline-flex rounded-md shadow">
                  <Button variant="outline" size="sm" className="rounded-l-md">
                    &larr;
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-none bg-primary-600 border-primary-600 text-white">
                    1
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-r-md">
                    &rarr;
                  </Button>
                </nav>
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Create Novel Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Novel</DialogTitle>
            <DialogDescription>
              Create a new novel to start tracking characters and their relationships.
            </DialogDescription>
          </DialogHeader>
          
          <NovelForm 
            onSuccess={() => {
              setIsCreateModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ["/api/novels"] });
            }}
          />
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
