#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Postman Collection 合并脚本
用于将分模块生成的Postman Collection片段合并为完整的Collection文件

作者: AI Assistant
版本: 1.0.0
日期: 2024-01-15
"""

import json
import os
import sys
from datetime import datetime
from typing import Dict, List, Any

class PostmanCollectionMerger:
    """Postman Collection 合并器"""
    
    def __init__(self, collections_dir: str = "postman-collections"):
        """
        初始化合并器
        
        Args:
            collections_dir: 包含模块片段的目录路径
        """
        self.collections_dir = collections_dir
        self.modules = []
        
    def load_module_files(self) -> List[str]:
        """
        加载所有模块文件
        
        Returns:
            模块文件路径列表，按文件名排序
        """
        if not os.path.exists(self.collections_dir):
            raise FileNotFoundError(f"目录不存在: {self.collections_dir}")
        
        module_files = []
        for filename in os.listdir(self.collections_dir):
            if filename.endswith('.json') and filename.startswith(('01-', '02-', '03-', '04-', '05-', '06-', '07-', '08-', '09-', '10-', '11-')):
                module_files.append(os.path.join(self.collections_dir, filename))
        
        # 按文件名排序确保正确的加载顺序
        module_files.sort()
        return module_files
    
    def load_module(self, file_path: str) -> Dict[str, Any]:
        """
        加载单个模块文件
        
        Args:
            file_path: 模块文件路径
            
        Returns:
            模块数据字典
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                module_data = json.load(f)
            
            print(f"✓ 已加载模块: {module_data['module_info']['name']}")
            return module_data
        except Exception as e:
            print(f"✗ 加载模块失败 {file_path}: {e}")
            return None
    
    def create_collection_info(self) -> Dict[str, Any]:
        """
        创建Collection的基本信息
        
        Returns:
            Collection info 字典
        """
        return {
            "name": "CharacterNetwork API Collection",
            "description": """## CharacterNetwork API文档

### 项目概述
- **版本**: v1.0.0
- **基础URL**: {{base_url}}
- **认证方式**: Session-based Authentication (Passport.js)
- **技术栈**: Express.js + TypeScript + PostgreSQL + Drizzle ORM

### 核心功能
- 用户认证和会话管理
- 小说信息管理和分类
- 角色信息管理和关系建立
- 外部书籍信息检索和缓存
- 时间线事件和笔记管理
- 管理员系统管理功能

### 使用说明
1. **环境变量设置**:
   - `base_url`: API服务器地址 (默认: http://localhost:5001)
   - `username`: 测试用户名
   - `password`: 测试密码

2. **认证流程**:
   - 首先调用注册或登录接口
   - 系统会自动设置会话Cookie
   - 后续请求会自动携带认证信息

3. **测试顺序**:
   - 建议按模块顺序进行测试
   - 先完成用户认证
   - 再进行业务功能测试

### 开发者信息
- **维护团队**: CharacterNetwork开发团队
- **联系方式**: support@characternetwork.com
- **文档更新**: """ + datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        }
    
    def create_global_variables(self) -> List[Dict[str, Any]]:
        """
        创建全局变量
        
        Returns:
            变量列表
        """
        return [
            {
                "key": "base_url",
                "value": "http://localhost:5001",
                "description": "API服务器基础URL，根据环境切换（开发/测试/生产）"
            },
            {
                "key": "api_version",
                "value": "v1",
                "description": "API版本号"
            },
            {
                "key": "timeout",
                "value": "10000",
                "description": "请求超时时间(毫秒)"
            }
        ]
    
    def create_global_events(self) -> List[Dict[str, Any]]:
        """
        创建全局事件脚本
        
        Returns:
            事件列表
        """
        return [
            {
                "listen": "prerequest",
                "script": {
                    "exec": [
                        "// 全局预请求脚本",
                        "// 设置请求时间戳",
                        "pm.globals.set('request_timestamp', new Date().getTime());",
                        "",
                        "// 检查基础URL设置",
                        "if (!pm.environment.get('base_url') && !pm.globals.get('base_url')) {",
                        "    console.log('警告：未设置base_url，使用默认值');",
                        "    pm.globals.set('base_url', 'http://localhost:5001');",
                        "}",
                        "",
                        "// 设置通用请求头",
                        "pm.request.headers.add({",
                        "    key: 'User-Agent',",
                        "    value: 'CharacterNetwork-Postman-Collection/1.0.0'",
                        "});"
                    ],
                    "type": "text/javascript"
                }
            },
            {
                "listen": "test",
                "script": {
                    "exec": [
                        "// 全局测试脚本",
                        "// 记录API调用日志",
                        "const requestTime = pm.globals.get('request_timestamp');",
                        "const responseTime = new Date().getTime();",
                        "const duration = responseTime - parseInt(requestTime);",
                        "",
                        "console.log(`API调用: ${pm.request.method} ${pm.request.url} - ${pm.response.code} (${duration}ms)`);",
                        "",
                        "// 通用响应验证",
                        "pm.test('响应Content-Type验证', function () {",
                        "    const contentType = pm.response.headers.get('Content-Type');",
                        "    if (contentType) {",
                        "        pm.expect(contentType).to.include('application/json');",
                        "    }",
                        "});",
                        "",
                        "// 错误响应统一处理",
                        "if (pm.response.code >= 400) {",
                        "    pm.test('错误响应包含message字段', function () {",
                        "        try {",
                        "            const jsonData = pm.response.json();",
                        "            pm.expect(jsonData).to.have.property('message');",
                        "        } catch (e) {",
                        "            console.log('响应不是有效的JSON格式');",
                        "        }",
                        "    });",
                        "}"
                    ],
                    "type": "text/javascript"
                }
            }
        ]
    
    def merge_collections(self) -> Dict[str, Any]:
        """
        合并所有模块为完整的Collection
        
        Returns:
            完整的Postman Collection
        """
        print("开始合并Postman Collection模块...")
        
        # 加载所有模块文件
        module_files = self.load_module_files()
        if not module_files:
            raise ValueError("未找到任何模块文件")
        
        print(f"找到 {len(module_files)} 个模块文件")
        
        # 加载模块数据
        modules = []
        for file_path in module_files:
            module_data = self.load_module(file_path)
            if module_data:
                modules.append(module_data)
        
        if not modules:
            raise ValueError("没有成功加载任何模块")
        
        # 创建完整的Collection结构
        collection = {
            "info": self.create_collection_info(),
            "item": [],
            "event": self.create_global_events(),
            "variable": self.create_global_variables()
        }
        
        # 合并所有模块的item
        for module in modules:
            if 'folder' in module and 'item' in module['folder']:
                collection['item'].append(module['folder'])
        
        print(f"✓ 成功合并 {len(modules)} 个模块")
        return collection
    
    def save_collection(self, collection: Dict[str, Any], output_path: str = "CharacterNetwork-API-Collection.json"):
        """
        保存合并后的Collection到文件
        
        Args:
            collection: 完整的Collection数据
            output_path: 输出文件路径
        """
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(collection, f, ensure_ascii=False, indent=2)
            
            print(f"✓ Collection已保存到: {output_path}")
            
            # 输出统计信息
            total_requests = 0
            for item in collection['item']:
                if 'item' in item:
                    total_requests += len(item['item'])
            
            print(f"✓ 统计信息:")
            print(f"  - 模块数量: {len(collection['item'])}")
            print(f"  - 接口总数: {total_requests}")
            print(f"  - 全局变量: {len(collection['variable'])}")
            print(f"  - 全局事件: {len(collection['event'])}")
            
        except Exception as e:
            print(f"✗ 保存Collection失败: {e}")
            raise

def main():
    """主函数"""
    print("=" * 60)
    print("CharacterNetwork Postman Collection 合并工具")
    print("=" * 60)
    
    try:
        # 创建合并器实例
        merger = PostmanCollectionMerger()
        
        # 合并Collection
        collection = merger.merge_collections()
        
        # 保存到文件
        merger.save_collection(collection)
        
        print("\n" + "=" * 60)
        print("✓ Collection合并完成！")
        print("✓ 可以直接导入到Postman中使用")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ 合并失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
