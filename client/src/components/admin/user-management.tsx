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
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };
  
  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !user.username.toLowerCase().includes(query) &&
        !user.email.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    
    // Filter by role
    if (roleFilter !== "all") {
      const isAdmin = roleFilter === "admin";
      if (user.isAdmin !== isAdmin) {
        return false;
      }
    }
    
    // For status filter, we'd need a status field which isn't in our model
    // This is a placeholder for demonstration
    
    return true;
  });
  
  // Handle toggling admin status
  const handleToggleAdmin = (user: User) => {
    if (user.id === currentUserId) {
      alert("You cannot change your own admin status");
      return;
    }
    
    onUpdateUser(user.id, { isAdmin: !user.isAdmin });
  };
  
  // Handle user deletion
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
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          Manage user accounts and permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Input 
              type="text" 
              placeholder="Search users..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          <div className="flex space-x-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Users Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No users found matching the criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-4">
                          <AvatarFallback className="bg-primary-600 text-white">
                            {getInitials(user.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-sm text-gray-500">
                            Joined {user.createdAt ? formatDate(user.createdAt.toString()) : "N/A"}
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
                        {user.isAdmin ? "Admin" : "User"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        className="text-primary-600 hover:text-primary-900 mr-2"
                        onClick={() => handleToggleAdmin(user)}
                        disabled={user.id === currentUserId}
                      >
                        {user.isAdmin ? "Remove Admin" : "Make Admin"}
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => setUserToDelete(user)}
                        disabled={user.id === currentUserId}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredUsers.length}</span> of <span className="font-medium">{users.length}</span> users
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
      
      {/* Delete confirmation dialog */}
      <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm User Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the user "{userToDelete?.username}"? This action cannot be undone and will remove all their novels, characters, and relationships.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
