import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertNovelSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImagePlus, Loader2, Link as LinkIcon } from "lucide-react";

const formSchema = insertNovelSchema.extend({
  coverImage: z.instanceof(File).optional().or(z.string().optional()),
  id: z.number().optional(),
});

type NovelFormValues = z.infer<typeof formSchema>;

interface NovelFormProps {
  initialData?: Partial<NovelFormValues & { id?: number }>;
  onSuccess?: () => void;
}

export default function NovelForm({ 
  initialData,
  onSuccess 
}: NovelFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.coverImage as string || null
  );
  const [coverImageUrl, setCoverImageUrl] = useState<string>(
    initialData?.coverImage as string || ""
  );
  const [activeTab, setActiveTab] = useState<string>("upload");
  
  // Set up form with default values
  const form = useForm<NovelFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      genre: initialData?.genre || "",
      status: initialData?.status || "In Progress",
      userId: user?.id,
      id: initialData?.id,
    },
  });
  
  // Determine if we're editing or creating
  const isEditing = !!initialData?.id;
  
  // Handle URL input
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setCoverImageUrl(url);
    setPreviewUrl(url);
    setSelectedFile(null);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Reset preview if switching to upload and no file is selected
    if (value === "upload" && !selectedFile && coverImageUrl) {
      setPreviewUrl(null);
    }
    // Set preview to URL if switching to url tab and URL exists
    if (value === "url" && coverImageUrl) {
      setPreviewUrl(coverImageUrl);
    }
  };

  // Handle form submission
  const mutation = useMutation({
    mutationFn: async (values: NovelFormValues) => {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("userId", String(user?.id));
      
      if (values.description) {
        formData.append("description", values.description);
      }
      
      if (values.genre) {
        formData.append("genre", values.genre);
      }
      
      if (values.status) {
        formData.append("status", values.status);
      }
      
      // Handle image based on active tab
      if (activeTab === "upload" && selectedFile) {
        formData.append("coverImage", selectedFile);
      } else if (activeTab === "url" && coverImageUrl) {
        formData.append("coverImageUrl", coverImageUrl);
      }
      
      let url = "/api/novels";
      let method = "POST";
      
      // If editing, use PUT and include the novel ID
      if (isEditing && initialData.id) {
        url = `/api/novels/${initialData.id}`;
        method = "PUT";
      }
      
      const response = await fetch(url, {
        method: method,
        body: formData,
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} novel`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Novel updated" : "Novel created",
        description: `Your novel has been successfully ${isEditing ? 'updated' : 'created'}`,
      });
      if (onSuccess) onSuccess();
      if (!isEditing) {
        form.reset();
        setSelectedFile(null);
        setPreviewUrl(null);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  function onSubmit(values: NovelFormValues) {
    mutation.mutate(values);
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Novel Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter novel title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of your novel" 
                      rows={3} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="genre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Genre</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a genre" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Fantasy">Fantasy</SelectItem>
                    <SelectItem value="Science Fiction">Science Fiction</SelectItem>
                    <SelectItem value="Mystery">Mystery</SelectItem>
                    <SelectItem value="Romance">Romance</SelectItem>
                    <SelectItem value="Historical">Historical</SelectItem>
                    <SelectItem value="Thriller">Thriller</SelectItem>
                    <SelectItem value="Horror">Horror</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Planning">Planning</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="md:col-span-2">
            <FormLabel>Cover Image</FormLabel>
            <Tabs 
              defaultValue={activeTab} 
              className="mt-2" 
              onValueChange={handleTabChange}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">
                  <ImagePlus className="w-4 h-4 mr-2" />
                  Upload Image
                </TabsTrigger>
                <TabsTrigger value="url">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Image URL
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="mt-4">
                <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  {previewUrl && activeTab === "upload" ? (
                    <div className="space-y-2 text-center">
                      <div className="aspect-[3/4] w-40 mx-auto overflow-hidden rounded-md">
                        <img 
                          src={previewUrl} 
                          alt="Cover preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex text-sm">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500"
                        >
                          <span>Change file</span>
                          <input 
                            id="file-upload" 
                            name="file-upload" 
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 text-center">
                      <ImagePlus className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500"
                        >
                          <span>Upload a file</span>
                          <input 
                            id="file-upload" 
                            name="file-upload" 
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="url" className="mt-4">
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <Input 
                      type="text" 
                      placeholder="Enter image URL" 
                      value={coverImageUrl}
                      onChange={handleUrlChange}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Enter a direct URL to an image (.jpg, .png, .gif)
                    </p>
                  </div>
                  
                  {previewUrl && activeTab === "url" && (
                    <div className="aspect-[3/4] w-40 mx-auto overflow-hidden rounded-md">
                      <img 
                        src={previewUrl} 
                        alt="Cover preview" 
                        className="w-full h-full object-cover"
                        onError={() => setPreviewUrl(null)}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : (
              isEditing ? "Update Novel" : "Create Novel"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
