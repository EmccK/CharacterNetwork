import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Users, Link, BookMarked, ArrowRight } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);
  
  // Get novels count
  const { data: novels = [] } = useQuery({
    queryKey: ["/api/novels"],
  });
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Dashboard" />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Welcome, {user?.username}!</h1>
            <p className="text-gray-600">Manage your novels, characters, and their relationships all in one place.</p>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6 flex items-center">
                <div className="bg-primary-100 p-3 rounded-full mr-4">
                  <BookOpen className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Novels</p>
                  <h3 className="text-2xl font-bold">{novels.length}</h3>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Characters</p>
                  <h3 className="text-2xl font-bold">-</h3>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 flex items-center">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <Link className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Relationships</p>
                  <h3 className="text-2xl font-bold">-</h3>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 flex items-center">
                <div className="bg-amber-100 p-3 rounded-full mr-4">
                  <BookMarked className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">In Progress</p>
                  <h3 className="text-2xl font-bold">-</h3>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Create New Novel</CardTitle>
                  <CardDescription>Add a new novel to your collection</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    onClick={() => navigate("/novels")}
                  >
                    Create Novel <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Manage Characters</CardTitle>
                  <CardDescription>View and edit your character roster</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    variant="secondary"
                    onClick={() => navigate("/characters")}
                  >
                    View Characters <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Visualize Relationships</CardTitle>
                  <CardDescription>Explore character connections</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => navigate("/relationships")}
                  >
                    View Relationships <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Recent Novels */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Recent Novels</h2>
            {novels.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {novels.slice(0, 3).map((novel: any) => (
                  <Card key={novel.id} className="hover:shadow-md transition-shadow">
                    <div className="relative aspect-[3/1] bg-gray-200">
                      {novel.coverImage ? (
                        <img 
                          src={novel.coverImage} 
                          alt={novel.title} 
                          className="w-full h-full object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-t-lg">
                          <BookOpen className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{novel.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {novel.description || "No description provided"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        variant="ghost" 
                        className="w-full"
                        onClick={() => navigate(`/novels/${novel.id}`)}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500 mb-4">You haven't created any novels yet.</p>
                  <Button onClick={() => navigate("/novels")}>
                    Create Your First Novel
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
