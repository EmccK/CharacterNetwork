/**
 * 书籍服务 - 与微信读书API交互获取书籍信息
 */
import { storage } from '../storage';
import { BookInfo, InsertBookInfo } from '@shared/schema';

// 统一的微信读书API URL
export const WEREAD_API_URL = 'https://weread.qq.com/web/search/global';

interface WereadBookInfo {
  bookId: string;
  title: string;
  author: string;
  translator?: string;
  cover: string;
  payType: number;
  type: number;
  soldout: number;
  newRating: number;
  newRatingCount: number;
  intro?: string;  // 新增字段：书籍介绍
  publisher?: string;  // 新增字段：出版社
  newRatingDetail?: {
    title: string;
  };
}

/**
 * 从微信读书API搜索书籍
 * @param query 搜索查询，例如：标题、作者等
 * @returns 书籍搜索结果
 */
export async function searchBooksFromAPI(query: string): Promise<WereadBookInfo[]> {
  try {
    // 对查询参数进行URL编码
    // 在后端中可以直接访问微信读书API，不会有CORS问题
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(`${WEREAD_API_URL}?keyword=${encodedQuery}`);

    if (!response.ok) {
      throw new Error(`微信读书API错误: ${response.status}`);
    }

    const data = await response.json();
    const books: WereadBookInfo[] = [];
    
    // 直接处理新的books数组
    if (data.books && data.books.length > 0) {
      for (const book of data.books) {
        if (book.bookInfo) {
          books.push(book.bookInfo);
        }
      }
    }
    
    return books;
  } catch (error) {
    console.error('搜索书籍时出错:', error);
    throw error;
  }
}

/**
 * 转换微信读书API返回的数据为我们的数据模型
 * @param bookData 微信读书API返回的书籍数据
 * @returns 转换后的书籍信息，符合我们的数据模型
 */
export function convertToBookInfo(bookData: WereadBookInfo): InsertBookInfo {
  // 创建类别数组
  const categories: string[] = [];
  if (bookData.newRatingDetail && bookData.newRatingDetail.title) {
    categories.push(bookData.newRatingDetail.title);
  }

  return {
    externalId: bookData.bookId,
    title: bookData.title || '',
    author: bookData.author || '',
    description: bookData.intro || '',  // 使用新API返回的intro字段
    coverImage: bookData.cover ? bookData.cover.replace('/s_', '/t6_') : '',
    publishedDate: '',
    publisher: bookData.publisher || '',  // 使用新API返回的publisher字段
    isbn: '',
    pageCount: 0,
    categories,
    language: 'zh',
  };
}

/**
 * 根据查询字符串搜索书籍，先查询数据库，如果没有则调用外部API
 * @param query 搜索查询
 * @returns 搜索结果
 */
export async function searchBooks(query: string): Promise<BookInfo[]> {
  // 先从数据库中查询匹配的书籍
  const dbResults = await storage.searchBookInfos(query);
  
  // 如果数据库中有足够的结果，直接返回
  if (dbResults.length >= 5) {
    return dbResults;
  }
  
  // 否则，调用外部API获取更多结果
  const apiResults = await searchBooksFromAPI(query);
  
  // 将API结果转换为我们的数据模型
  const convertedResults = apiResults.map(convertToBookInfo);
  
  // 筛选出数据库中不存在的书籍
  const externalIds = dbResults.map(book => book.externalId);
  const newBooks = convertedResults.filter(book => !externalIds.includes(book.externalId));
  
  // 将额外的微信读书特有字段添加到结果中
  const enhancedNewBooks = newBooks.map((book, index) => {
    const apiBook = apiResults[index];
    return {
      ...book,
      rating: apiBook.newRating,
      ratingCount: apiBook.newRatingCount,
      payType: apiBook.payType
    } as unknown as BookInfo;
  });

  // 返回结果（数据库结果优先）
  return [...dbResults, ...enhancedNewBooks];
}

/**
 * 根据外部ID获取书籍信息，如果数据库中不存在则从微信读书API获取并保存
 * @param externalId 外部API的书籍ID，可能是字符串或数字
 * @returns 书籍信息
 */
export async function getOrFetchBookInfo(externalId: string | number): Promise<BookInfo | null> {
  // 统一处理外部ID为字符串类型
  if (externalId === null || externalId === undefined) {
    console.error('获取书籍信息失败: 外部ID为空');
    return null;
  }
  
  // 将任何类型都转换为字符串
  const idString = String(externalId).trim();
  
  if (!idString) {
    console.error('获取书籍信息失败: 外部ID转换后为空字符串');
    return null;
  }
  
  console.log(`获取书籍信息, 外部ID: "${idString}", 原始类型: ${typeof externalId}`);
  
  // 先从数据库中查询
  const existingBook = await storage.getBookInfoByExternalId(idString);
  
  if (existingBook) {
    console.log(`书籍信息已存在于数据库, ID: ${existingBook.id}`);
    return existingBook;
  }
  
  // 直接使用搜索API查找特定书籍
  try {
    console.log(`从微信读书API获取书籍信息: ${idString}`);
    const response = await fetch(`${WEREAD_API_URL}?keyword=${encodeURIComponent(idString)}`);

    if (!response.ok) {
      console.error(`微信读书API错误: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    // 从搜索结果中找到匹配的书籍
    let bookDetails = null;
    if (data.books && data.books.length > 0) {
      for (const book of data.books) {
        if (book.bookInfo && String(book.bookInfo.bookId) === idString) {
          // 使用字符串比较确保类型一致
          bookDetails = book.bookInfo;
          console.log(`在API结果中找到匹配的书籍: ${book.bookInfo.title}`);
          break;
        }
      }
    }
    
    if (!bookDetails) {
      console.log(`未在API结果中找到匹配的书籍 ID: ${idString}`);
      return null;
    }
    
    // 转换并保存到数据库
    const bookInfo = convertToBookInfo(bookDetails);
    console.log(`准备将书籍信息保存到数据库: ${bookInfo.title}, 外部ID: ${bookInfo.externalId}`);
    return await storage.createBookInfo(bookInfo);
  } catch (error) {
    console.error('获取书籍信息时出错:', error);
    return null;
  }
}