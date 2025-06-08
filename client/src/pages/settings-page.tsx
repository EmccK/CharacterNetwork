import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowRight, Mail, User, Lock, BellRing, Save, Trash2, AlertCircle } from "lucide-react";

const profileSchema = z.object({
  username: z.string().min(1, "用户名是必填项"),
  email: z.string().email("请输入有效的电子邮箱"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "当前密码是必填项"),
  newPassword: z.string().min(6, "新密码必须至少6个字符"),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "两次输入的密码不匹配",
  path: ["confirmPassword"],
});

export default function SettingsPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [novelUpdates, setNovelUpdates] = useState(true);
  const [characterUpdates, setCharacterUpdates] = useState(true);
  
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      const res = await apiRequest("PATCH", `/api/users/${user?.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "个人资料已更新",
        description: "您的个人资料已成功更新",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "更新个人资料失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordSchema>) => {
      const res = await apiRequest("POST", `/api/users/${user?.id}/change-password`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "密码已更新",
        description: "您的密码已成功更新",
      });
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "更新密码失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveNotificationSettings = () => {
    toast({
      title: "通知设置已保存",
      description: "您的通知偏好已更新",
    });
  };

  const handleDeleteAccount = () => {
    // 这是一个危险操作，所以需要确认
    if (window.confirm("您确定要删除您的账户吗？此操作无法撤消。")) {
      toast({
        title: "账户删除",
        description: "请联系管理员删除您的账户。",
      });
    }
  };

  function onProfileSubmit(data: z.infer<typeof profileSchema>) {
    updateProfileMutation.mutate(data);
  }

  function onPasswordSubmit(data: z.infer<typeof passwordSchema>) {
    updatePasswordMutation.mutate(data);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-3 mb-6">
            <TabsTrigger value="profile" className="flex items-center">
              <User className="mr-2 h-4 w-4" /> 个人资料
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center">
              <Lock className="mr-2 h-4 w-4" /> 安全
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center">
              <BellRing className="mr-2 h-4 w-4" /> 通知
            </TabsTrigger>
          </TabsList>
          
          {/* 个人资料选项卡 */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>个人资料设置</CardTitle>
                <CardDescription>
                  管理您的用户个人资料信息
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>用户名</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input placeholder="输入您的用户名" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>电子邮箱</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input type="email" placeholder="输入您的电子邮箱" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="flex gap-2" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          保存中...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" /> 保存更改
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-red-600">危险区域</CardTitle>
                <CardDescription>
                  此区域的操作可能导致永久数据丢失
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <h4 className="font-medium text-red-800">警告：账户删除</h4>
                      <p className="text-sm text-red-700 mt-1">
                        删除您的账户将移除所有您的小说、角色和关系。
                        此操作无法撤消。
                      </p>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  className="flex gap-2" 
                  onClick={handleDeleteAccount}
                >
                  <Trash2 className="h-4 w-4" /> 删除账户
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* 安全选项卡 */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>修改密码</CardTitle>
                <CardDescription>
                  更新您的密码以保持账户安全
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>当前密码</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="输入您当前的密码" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>新密码</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="输入您的新密码" {...field} />
                          </FormControl>
                          <FormDescription>
                            密码必须至少6个字符长
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>确认新密码</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="确认您的新密码" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="flex gap-2" disabled={updatePasswordMutation.isPending}>
                      {updatePasswordMutation.isPending ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          更新中...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" /> 更新密码
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* 通知选项卡 */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>通知偏好设置</CardTitle>
                <CardDescription>
                  自定义接收通知的方式和时间
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">电子邮件通知</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications" className="font-medium">
                        电子邮件通知
                      </Label>
                      <p className="text-sm text-gray-500">
                        接收关于您账户的常规电子邮件通知
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">应用通知</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="novel-updates" className="font-medium">
                          小说更新
                        </Label>
                        <p className="text-sm text-gray-500">
                          当您的小说进行更新时获得通知
                        </p>
                      </div>
                      <Switch
                        id="novel-updates"
                        checked={novelUpdates}
                        onCheckedChange={setNovelUpdates}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="character-updates" className="font-medium">
                          角色更新
                        </Label>
                        <p className="text-sm text-gray-500">
                          获取关于角色变更和添加的通知
                        </p>
                      </div>
                      <Switch
                        id="character-updates"
                        checked={characterUpdates}
                        onCheckedChange={setCharacterUpdates}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveNotificationSettings} className="ml-auto flex gap-2">
                  <Save className="h-4 w-4" /> 保存偏好设置
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}