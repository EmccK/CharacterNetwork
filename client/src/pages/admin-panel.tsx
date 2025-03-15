import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import UserManagement from "@/components/admin/user-management";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users");
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  // Fetch all users
  const { 
    data: users = [], 
    isLoading: isUsersLoading,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: user?.isAdmin,
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User deleted",
        description: "The user has been successfully deleted",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update user role mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number, data: any }) => {
      await apiRequest("PUT", `/api/admin/users/${userId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User updated",
        description: "The user has been successfully updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // If not admin, show error message
  if (!user?.isAdmin) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar title="Admin Panel" />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <CardTitle>Access Denied</CardTitle>
                </div>
                <CardDescription>
                  You need administrator privileges to access this page.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate("/")}>
                  Return to Dashboard
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Admin Panel" />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage users and system settings</p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="settings">System Settings</TabsTrigger>
              <TabsTrigger value="logs">Activity Logs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="users">
              <UserManagement 
                users={users}
                isLoading={isUsersLoading}
                onDeleteUser={(userId) => deleteUserMutation.mutate(userId)}
                onUpdateUser={(userId, data) => updateUserMutation.mutate({ userId, data })}
                currentUserId={user.id}
              />
            </TabsContent>
            
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>
                    Configure application-wide settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center py-8 text-gray-500">
                    System settings functionality coming soon
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="logs">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Logs</CardTitle>
                  <CardDescription>
                    View system activity and user actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center py-8 text-gray-500">
                    Activity logs functionality coming soon
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
