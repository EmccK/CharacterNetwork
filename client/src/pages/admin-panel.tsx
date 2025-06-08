import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
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
    queryFn: () => fetch("/api/admin/users", { credentials: "include" }).then(res => res.json()),
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
        title: "用户已删除",
        description: "用户已成功删除",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "删除用户失败",
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
        title: "用户已更新",
        description: "用户已成功更新",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "更新用户失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // If not admin, show error message
  if (!user?.isAdmin) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle>访问被拒绝</CardTitle>
          </div>
          <CardDescription>
            您需要管理员权限才能访问此页面。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/")}>
            返回控制面板
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">管理员控制面板</h1>
        <p className="text-gray-600">管理用户和系统设置</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="users">用户管理</TabsTrigger>
          <TabsTrigger value="settings">系统设置</TabsTrigger>
          <TabsTrigger value="logs">活动日志</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement
            users={users as any[]}
            isLoading={isUsersLoading}
            onDeleteUser={(userId) => deleteUserMutation.mutate(userId)}
            onUpdateUser={(userId, data) => updateUserMutation.mutate({ userId, data })}
            currentUserId={user.id}
          />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
             <CardTitle>系统设置</CardTitle>
              <CardDescription>
               配置应用范围的设置
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-gray-500">
               系统设置功能即将推出
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
             <CardTitle>活动日志</CardTitle>
              <CardDescription>
               查看系统活动和用户操作
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-gray-500">
               活动日志功能即将推出
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}