import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from './button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

interface EntityOption {
  value: string | number;
  label: string;
  description?: string;
  avatar?: string;
  color?: string;
  disabled?: boolean;
}

interface EntitySelectorProps {
  options: EntityOption[];
  selectedValues: (string | number)[];
  onChange: (values: (string | number)[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  multiple?: boolean;
  showBadges?: boolean;
  maxHeight?: string;
}

/**
 * 通用实体选择器组件，用于选择一个或多个实体
 */
export const EntitySelector: React.FC<EntitySelectorProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = '选择...',
  emptyMessage = '没有找到结果',
  searchPlaceholder = '搜索...',
  disabled = false,
  className = '',
  multiple = false,
  showBadges = true,
  maxHeight = '15rem'
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const commandRef = useRef<HTMLDivElement>(null);

  // 清除搜索
  useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  // 过滤选项
  const filteredOptions = search.length > 0
    ? options.filter(option => 
        option.label.toLowerCase().includes(search.toLowerCase()) ||
        option.description?.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  // 处理选择
  const handleSelect = (value: string | number) => {
    if (multiple) {
      // 多选模式
      if (selectedValues.includes(value)) {
        onChange(selectedValues.filter(v => v !== value));
      } else {
        onChange([...selectedValues, value]);
      }
    } else {
      // 单选模式
      onChange([value]);
      setOpen(false);
    }
  };

  // 移除选择
  const handleRemove = (value: string | number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange(selectedValues.filter(v => v !== value));
  };

  // 清除所有选择
  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  // 获取选中项的标签
  const getSelectedLabels = () => {
    return selectedValues.map(value => {
      const option = options.find(opt => opt.value === value);
      return option ? option.label : String(value);
    });
  };

  // 获取选中项
  const getSelectedOptions = () => {
    return options.filter(option => selectedValues.includes(option.value));
  };

  // 渲染单选按钮内容
  const renderSingleValueContent = () => {
    if (selectedValues.length === 0) {
      return <span className="text-muted-foreground">{placeholder}</span>;
    }

    const selectedOption = options.find(option => option.value === selectedValues[0]);
    if (!selectedOption) return <span className="text-muted-foreground">{placeholder}</span>;

    return (
      <div className="flex items-center gap-2 text-foreground">
        {selectedOption.avatar && (
          <img 
            src={selectedOption.avatar} 
            alt={selectedOption.label} 
            className="w-5 h-5 rounded-full object-cover"
          />
        )}
        {selectedOption.color && (
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: selectedOption.color }}
          />
        )}
        <span>{selectedOption.label}</span>
      </div>
    );
  };

  // 渲染多选按钮内容
  const renderMultipleValueContent = () => {
    if (selectedValues.length === 0) {
      return <span className="text-muted-foreground">{placeholder}</span>;
    }

    // 如果不显示标签，就只显示计数
    if (!showBadges) {
      return <span>已选择 {selectedValues.length} 项</span>;
    }

    // 只显示前2个选择项以避免过长
    const selectedOptions = getSelectedOptions().slice(0, 2);
    const remainingCount = selectedValues.length - selectedOptions.length;

    return (
      <div className="flex items-center gap-1 flex-wrap">
        {selectedOptions.map(option => (
          <Badge key={option.value} variant="secondary" className="pl-1.5 text-xs">
            {option.label}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 ml-1 hover:bg-muted"
              onClick={(e) => handleRemove(option.value, e)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        {remainingCount > 0 && (
          <Badge variant="secondary">
            +{remainingCount}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between min-h-10", className)}
        >
          <div className="flex-1 text-left truncate">
            {multiple ? renderMultipleValueContent() : renderSingleValueContent()}
          </div>
          <div className="flex shrink-0 items-center">
            {multiple && selectedValues.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 mr-1 hover:bg-muted"
                onClick={handleClearAll}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full max-w-[var(--radix-popover-trigger-width)]" align="start">
        <Command ref={commandRef} className="max-h-full">
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup className={`max-h-[${maxHeight}] overflow-auto`}>
            {filteredOptions.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value.toString()}
                onSelect={() => handleSelect(option.value)}
                disabled={option.disabled}
                className={cn(
                  option.disabled && "cursor-not-allowed opacity-60",
                  "flex items-center gap-2"
                )}
              >
                <div className="flex items-center gap-2 flex-1">
                  {option.avatar && (
                    <img 
                      src={option.avatar} 
                      alt={option.label} 
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  )}
                  {option.color && (
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    )}
                  </div>
                </div>
                <Check
                  className={cn(
                    "h-4 w-4 opacity-0 transition-opacity",
                    selectedValues.includes(option.value) && "opacity-100"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
