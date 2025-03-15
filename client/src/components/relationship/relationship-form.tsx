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
        title: "Relationship created",
        description: "The character relationship has been successfully created",
      });
      if (onSuccess) onSuccess();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
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
              <FormLabel>Source Character</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source character" />
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
              <FormLabel>Target Character</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target character" />
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
              <FormLabel>Relationship Type</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship type" />
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
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Details about this relationship" 
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
            <h4 className="text-sm font-medium mb-2">Relationship Preview</h4>
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
        
        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Relationship"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
