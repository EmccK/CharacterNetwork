import { Novel } from "@shared/schema";
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";

interface CharacterNovelSelectorProps {
  form: UseFormReturn<any>;
  novels: Novel[];
  novelId?: number;
}

/**
 * 小说选择器组件
 * 允许用户从列表中选择角色所属的小说
 */
export default function CharacterNovelSelector({ 
  form, 
  novels, 
  novelId 
}: CharacterNovelSelectorProps) {
  // 如果已经提供了novelId或者没有小说可选，就不显示选择器
  if (novelId || !novels.length) {
    return null;
  }

  return (
    <FormField
      control={form.control}
      name="novelId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>小说</FormLabel>
          <Select
            onValueChange={(value) => field.onChange(parseInt(value))}
            defaultValue={field.value?.toString()}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="选择小说" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {novels.map((novel) => (
                <SelectItem key={novel.id} value={novel.id.toString()}>
                  {novel.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}