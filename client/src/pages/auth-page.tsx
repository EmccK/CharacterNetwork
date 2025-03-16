import { useState } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "用户名不能为空"),
  password: z.string().min(1, "密码不能为空"),
});

const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "密码长度至少为6个字符"),
  confirmPassword: z.string(),
  email: z.string().email("请输入有效的电子邮箱"),
}).refine(data => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");

  // If user is already logged in, redirect to home
  if (user) {
    navigate("/");
    return null;
  }

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      isAdmin: false,
    },
  });

  function onLoginSubmit(data: z.infer<typeof loginSchema>) {
    loginMutation.mutate(data);
  }

  function onRegisterSubmit(data: z.infer<typeof registerSchema>) {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left side - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              小说角色管理器
            </CardTitle>
            <CardDescription className="text-center">
              管理您的小说角色及其关系
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">登录</TabsTrigger>
                <TabsTrigger value="register">注册</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>用户名</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入用户名" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>密码</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="请输入密码" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          登录中...
                        </>
                      ) : (
                        "登录"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>用户名</FormLabel>
                          <FormControl>
                            <Input placeholder="请选择用户名" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>电子邮箱</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="请输入您的电子邮箱" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>密码</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="请创建密码" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>确认密码</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="请确认您的密码" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          创建账户中...
                        </>
                      ) : (
                        "创建账户"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-center text-gray-500">
              {activeTab === "login" 
                ? "还没有账户？" 
                : "已有账户？"}
              <button 
                className="text-primary-600 hover:underline" 
                onClick={() => setActiveTab(activeTab === "login" ? "register" : "login")}
              >
                {activeTab === "login" ? "注册" : "登录"}
              </button>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Right side - Hero */}
      <div className="w-full md:w-1/2 bg-slate-800 text-white p-8 hidden md:flex flex-col justify-center items-center">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold mb-4">小说角色关系管理器</h1>
          <p className="mb-6">
            创建、管理和可视化您小说中的角色及其关系。
            通过精美的可视化图表组织故事角色之间的互动。
          </p>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-slate-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">角色管理</h3>
              <p className="text-sm">为每部小说创建和组织角色</p>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">关系映射</h3>
              <p className="text-sm">通过交互式图表可视化复杂的角色关系</p>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">小说组织</h3>
              <p className="text-sm">使用封面、描述和类型组织您的小说</p>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">可定制化</h3>
              <p className="text-sm">为您的独特故事需求创建自定义关系类型</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
