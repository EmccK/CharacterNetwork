import { Request, Response, NextFunction } from "express";
import { WEREAD_API_URL } from "../services/bookService";

/**
 * 代理微信读书搜索API
 * 将客户端的搜索请求转发到微信读书API，并返回处理后的结果
 */
export const proxyWereadSearch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const keyword = req.query.keyword as string;
    if (!keyword || keyword.trim().length === 0) {
      return res.status(400).json({ message: "搜索关键词不能为空" });
    }

    console.log(`代理搜索请求: ${keyword}`);
    const response = await fetch(
      `${WEREAD_API_URL}?keyword=${encodeURIComponent(keyword)}`
    );

    if (!response.ok) {
      console.error(`微信读书API响应错误: ${response.status}`);
      return res
        .status(response.status)
        .json({ message: `微信读书API错误: ${response.status}` });
    }

    // 检查内容类型，确保是JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error(`微信读书API返回非JSON响应: ${contentType}`);
      // 尝试读取响应文本
      const text = await response.text();
      console.error(`响应内容: ${text.substring(0, 200)}...`);
      return res.status(500).json({ 
        message: "微信读书API返回非JSON响应",
        contentType: contentType || "未知"
      });
    }

    const data = await response.json();
    console.log(
      `搜索结果: ${data.books ? data.books.length : 0} 本书籍`
    );
    res.json(data);
  } catch (error) {
    console.error("代理搜索出错:", error);
    next(error);
  }
};
