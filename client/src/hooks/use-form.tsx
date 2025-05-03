import { useState, useCallback, FormEvent, ChangeEvent } from 'react';

export interface UseFormOptions<T> {
  initialValues: T;
  onSubmit?: (values: T) => void | Promise<void>;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  resetAfterSubmit?: boolean;
}

export interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldTouched: (field: keyof T, isTouched?: boolean) => void;
  setFieldError: (field: keyof T, error: string | undefined) => void;
  resetForm: () => void;
  validateForm: () => boolean;
  setValues: (values: Partial<T>) => void;
}

/**
 * 自定义表单处理Hook
 * 提供表单状态管理、验证、提交等功能
 */
function useForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
  resetAfterSubmit = false,
}: UseFormOptions<T>): UseFormReturn<T> {
  // 表单状态
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 验证表单
  const validateForm = useCallback(() => {
    if (!validate) return true;

    const validationErrors = validate(values);
    setErrors(validationErrors);
    
    return Object.keys(validationErrors).length === 0;
  }, [values, validate]);

  // 处理表单输入变化
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let finalValue: any = value;
    
    // 处理特殊类型输入
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      finalValue = value === '' ? '' : Number(value);
    }
    
    setValues(prevValues => ({
      ...prevValues,
      [name]: finalValue,
    }));
    
    // 如果字段有错误且已被修改，清除错误
    if (errors[name as keyof T]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: undefined,
      }));
    }
  }, [errors]);

  // 处理字段失焦
  const handleBlur = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    
    setTouched(prevTouched => ({
      ...prevTouched,
      [name]: true,
    }));
    
    if (validate) {
      const validationErrors = validate(values);
      
      if (validationErrors[name as keyof T]) {
        setErrors(prevErrors => ({
          ...prevErrors,
          [name]: validationErrors[name as keyof T],
        }));
      }
    }
  }, [values, validate]);

  // 设置单个字段的值
  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues(prevValues => ({
      ...prevValues,
      [field]: value,
    }));
    
    // 如果字段有错误且已被修改，清除错误
    if (errors[field]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [field]: undefined,
      }));
    }
  }, [errors]);

  // 设置单个字段的触摸状态
  const setFieldTouched = useCallback((field: keyof T, isTouched: boolean = true) => {
    setTouched(prevTouched => ({
      ...prevTouched,
      [field]: isTouched,
    }));
  }, []);

  // 设置单个字段的错误
  const setFieldError = useCallback((field: keyof T, error: string | undefined) => {
    setErrors(prevErrors => ({
      ...prevErrors,
      [field]: error,
    }));
  }, []);

  // 重置表单
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // 处理表单提交
  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // 验证所有字段
    const isValid = validateForm();
    
    // 标记所有字段为已触摸
    const touchedFields = Object.keys(values).reduce((acc, key) => {
      acc[key as keyof T] = true;
      return acc;
    }, {} as Record<keyof T, boolean>);
    
    setTouched(touchedFields);
    
    if (isValid && onSubmit) {
      setIsSubmitting(true);
      
      try {
        await onSubmit(values);
        if (resetAfterSubmit) {
          resetForm();
        }
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [values, validateForm, onSubmit, resetAfterSubmit, resetForm]);

  // 批量设置值
  const setFormValues = useCallback((newValues: Partial<T>) => {
    setValues(prevValues => ({
      ...prevValues,
      ...newValues,
    }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    resetForm,
    validateForm,
    setValues: setFormValues,
  };
}

export default useForm;