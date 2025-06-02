#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
快速合并脚本 - 用于快速合并Postman Collection模块
简化版本，适用于日常开发使用

使用方法:
python quick_merge.py
"""

import json
import os
import glob
from datetime import datetime

def quick_merge():
    """快速合并所有模块文件"""
    
    # 查找所有模块文件
    module_files = sorted(glob.glob("postman-collections/*.json"))
    
    if not module_files:
        print("❌ 未找到模块文件")
        return
    
    print(f"🔍 找到 {len(module_files)} 个模块文件")
    
    # 基础Collection结构
    collection = {
        "info": {
            "name": "CharacterNetwork API Collection",
            "description": f"## CharacterNetwork API文档\n\n**生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n### 快速开始\n1. 设置环境变量 `base_url`\n2. 先运行认证接口\n3. 按模块顺序测试\n\n### 技术栈\n- Express.js + TypeScript\n- PostgreSQL + Drizzle ORM\n- Session认证机制",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        "item": [],
        "variable": [
            {
                "key": "base_url",
                "value": "http://localhost:5001",
                "description": "API服务器地址"
            }
        ]
    }
    
    # 合并模块
    for file_path in module_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                module = json.load(f)
            
            if 'folder' in module:
                collection['item'].append(module['folder'])
                print(f"✅ {module['module_info']['name']}")
        except Exception as e:
            print(f"❌ 加载失败 {file_path}: {e}")
    
    # 保存结果
    output_file = "CharacterNetwork-API-Collection.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(collection, f, ensure_ascii=False, indent=2)
    
    # 统计信息
    total_apis = sum(len(item.get('item', [])) for item in collection['item'])
    
    print(f"\n🎉 合并完成!")
    print(f"📁 模块数量: {len(collection['item'])}")
    print(f"🔗 API总数: {total_apis}")
    print(f"💾 输出文件: {output_file}")

if __name__ == "__main__":
    quick_merge()
