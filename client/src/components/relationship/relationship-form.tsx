import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertRelationshipSchema, Character, RelationshipType } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

const formSchema = insertRelationshipSchema.extend({});

type RelationshipFormValues = z.infer<typeof formSchema>;

interface RelationshipFormProps {
  initialData?: Partial<RelationshipFormValues>;
  novelId: number;
  characters: Character[];
  relationshipTypes: RelationshipType[];
  onSuccess?: () => void;
}

export default function RelationshipForm({ 
  initialData,
  novelId,
  characters,
  relationshipTypes,
  onSuccess 
}: RelationshipFormProps) {
  const { toast } = useToast();
  
  // Set up form with default values
  const form = useForm<RelationshipFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceId: initialData?.sourceId || undefined,
      targetId: initialData?.targetId || undefined,
      typeId: initialData?.typeId || undefined,
      description: initialData?.description || "",
      novelId: novelId,
    },
  });
  
  // Get values from form for conditional rendering
  const sourceId = form.watch("sourceId");
  const targetId = form.watch("targetId");
  const typeId = form.watch("typeId");
  
  // Handle form submission
  const mutation = useMutation({
    mutationFn: async (values: RelationshipFormValues) => {
      return await apiRequest("POST", "/api/relationships", values);
    },
    onSuccess: () => {
      toast({
        title: "关系已创建",
        description: "角色关系已成功创建",
      });
      if (onSuccess) onSuccess();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "错误",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(values: RelationshipFormValues) {
    mutation.mutate(values);
  }
  
  // Get character names for display
  const getCharacterName = (id?: number) => {
    if (!id) return "";
    const character = characters.find(c => c.id === id);
    return character ? character.name : "";
  };
  
  // Get relationship type for display
  const getRelationshipType = (id?: number) => {
    if (!id) return null;
    return relationshipTypes.find(t => t.id === id);
  };
  
  const selectedType = getRelationshipType(typeId);
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="sourceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>源角色</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="选择源角色" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {characters.map((character) => (
                    <SelectItem 
                      key={character.id} 
                      value={character.id.toString()}
                      disabled={character.id === targetId}
                    >
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          {character.avatar ? (
                            <AvatarImage src={character.avatar} alt={character.name} />
                          ) : (
                            <AvatarFallback className="text-xs">
                              {character.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        {character.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="targetId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>目标角色</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="选择目标角色" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {characters.map((character) => (
                    <SelectItem 
                      key={character.id} 
                      value={character.id.toString()}
                      disabled={character.id === sourceId}
                    >
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          {character.avatar ? (
                            <AvatarImage src={character.avatar} alt={character.name} />
                          ) : (
                            <AvatarFallback className="text-xs">
                              {character.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        {character.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="typeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>关系类型</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="选择关系类型" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {relationshipTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: type.color }}
                        />
                        {type.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>关系描述（可选）</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="关于这段关系的详细信息" 
                  rows={3} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Preview of relationship */}
        {sourceId && targetId && typeId && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-2">关系预览</h4>
            <div className="flex items-center">
              <div className="font-medium">{getCharacterName(sourceId)}</div>
              <div 
                className="mx-2 px-2 py-1 rounded text-white text-xs"
                style={{ backgroundColor: selectedType?.color }}
              >
                {selectedType?.name}
              </div>
              <div className="font-medium">{getCharacterName(targetId)}</div>
            </div>
          </div>
        )}
        
        <div className="flex justify-end mt-6">
          <Button 
            type="submit" 
            disabled={mutation.isPending}
            className="w-full sm:w-auto py-5 sm:py-3 transition-transform active:scale-[0.98] text-base"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                创建中...
              </>
            ) : (
              "创建关系"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
