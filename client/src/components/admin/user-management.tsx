import { useState } from "react";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SearchIcon, RefreshCw, Loader2 } from "lucide-react";

interface UserManagementProps {
  users: User[];
  isLoading: boolean;
  onDeleteUser: (userId: number) => void;
  onUpdateUser: (userId: number, data: any) => void;
  currentUserId: number;
}

export default function UserManagement({ 
  users, 
  isLoading, 
  onDeleteUser,
  onUpdateUser,
  currentUserId
}: UserManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // 获取头像首字母
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  // 格式化日期以供显示
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-CN', { // 改为中文日期格式
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  // 根据搜索和筛选条件过滤用户
  const filteredUsers = users.filter(user => {
    // 按搜索查询过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !user.username.toLowerCase().includes(query) &&
        !user.email.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // 按角色过滤
    if (roleFilter !== "all") {
      const isAdmin = roleFilter === "admin";
      if (user.isAdmin !== isAdmin) {
        return false;
      }
    }

    // 对于状态筛选，我们需要一个状态字段，但我们的模型中没有
    // 这只是一个演示占位符

    return true;
  });

  // 处理切换管理员状态
  const handleToggleAdmin = (user: User) => {
    if (user.id === currentUserId) {
      alert("您不能更改自己的管理员状态");
      return;
    }

    onUpdateUser(user.id, { isAdmin: !user.isAdmin });
  };

  // 处理用户删除
  const handleDeleteUser = () => {
    if (userToDelete) {
      onDeleteUser(userToDelete.id);
      setUserToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>用户管理</CardTitle>
        <CardDescription>
          管理用户账户和权限
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 搜索和筛选 */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Input 
              type="text" 
              placeholder="搜索用户..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          <div className="flex space-x-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="所有角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有角色</SelectItem>
                <SelectItem value="admin">管理员</SelectItem>
                <SelectItem value="user">用户</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="所有状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="active">活跃</SelectItem>
                <SelectItem value="inactive">非活跃</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 用户表格 */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    没有找到符合条件的用户
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-4">
                          <AvatarFallback className="bg-indigo-500 text-white">
                            {getInitials(user.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-sm text-gray-500">
                            加入于 {user.createdAt ? formatDate(user.createdAt.toString()) : "未知"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isAdmin 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {user.isAdmin ? "管理员" : "用户"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        活跃
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        className="text-primary-600 hover:text-primary-900 mr-2"
                        onClick={() => handleToggleAdmin(user)}
                        disabled={user.id === currentUserId}
                      >
                        {user.isAdmin ? "移除管理员" : "设为管理员"}
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => setUserToDelete(user)}
                        disabled={user.id === currentUserId}
                      >
                        删除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 分页 */}
        {filteredUsers.length > 0 && (
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-700">
              显示 <span className="font-medium">1</span> 到 <span className="font-medium">{filteredUsers.length}</span> 条，共 <span className="font-medium">{users.length}</span> 位用户
            </div>
            <div className="flex">
              <Button variant="outline" size="sm" className="rounded-l-md">
                &larr;
              </Button>
              <Button variant="outline" size="sm" className="rounded-none bg-primary-600 border-primary-600 text-white">
                1
              </Button>
              <Button variant="outline" size="sm" className="rounded-r-md">
                &rarr;
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* 删除确认对话框 */}
      <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除用户</DialogTitle>
            <DialogDescription>
              您确定要删除用户 "{userToDelete?.username}" 吗？此操作无法撤销，并将删除其所有的小说、角色和关系。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToDelete(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              删除用户
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}