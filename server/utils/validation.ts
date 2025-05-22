import { z, ZodSchema } from "zod";
import { fromZodError } from "zod-validation-error";

/**
 * 验证请求数据
 * @param data 请求数据
 * @param schema Zod模式
 * @returns 验证结果
 */
export async function validateRequest<T>(
  data: unknown, 
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const validData = await schema.parseAsync(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = fromZodError(error);
      return { success: false, error: validationError.message };
    }
    return { success: false, error: String(error) };
  }
} 