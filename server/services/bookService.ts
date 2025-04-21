/**
 * 书籍服务 - 与微信读书API交互获取书籍信息
 */
import { storage } from '../storage';
import { BookInfo, InsertBookInfo } from '@shared/schema';

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
    const response = await fetch(`https://weread.qq.com/api/store/search?keyword=${encodedQuery}`);

    if (!response.ok) {
      throw new Error(`微信读书API错误: ${response.status}`);
    }

    const data = await response.json();
    const books: WereadBookInfo[] = [];
    
    // 只处理type为1的电子书结果
    for (const result of data.results || []) {
      if (result.type === 1 && result.books && result.books.length > 0) {
        // 提取书籍信息
        for (const book of result.books) {
          if (book.bookInfo) {
            books.push(book.bookInfo);
          }
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
 * 从微信读书API获取详细书籍信息
 * @param bookId 微信读书的bookId
 * @returns 详细的书籍信息
 */
export async function getBookDetailsFromAPI(bookId: string): Promise<WereadBookInfo | null> {
  try {
    // 先通过搜索API获取详细信息
    // 在后端中可以直接访问微信读书API，不会有CORS问题
    const response = await fetch(`https://weread.qq.com/api/store/search?keyword=${encodeURIComponent(bookId)}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`微信读书API错误: ${response.status}`);
    }

    const data = await response.json();
    
    // 遍历结果找到匹配的书籍
    for (const result of data.results || []) {
      if (result.type === 1 && result.books && result.books.length > 0) {
        for (const book of result.books) {
          if (book.bookInfo && book.bookInfo.bookId === bookId) {
            return book.bookInfo;
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('获取书籍详情时出错:', error);
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
    description: '',
    coverImage: bookData.cover ? bookData.cover.replace('/s_', '/t6_') : '',
    publishedDate: '',
    publisher: '',
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
    };
  });
  
  // 返回结果（数据库结果优先）
  return [...dbResults, ...enhancedNewBooks];
}

/**
 * 根据外部ID获取书籍信息，如果数据库中不存在则从API获取并保存
 * @param externalId 外部API的书籍ID
 * @returns 书籍信息
 */
export async function getOrFetchBookInfo(externalId: string): Promise<BookInfo | null> {
  // 先从数据库中查询
  const existingBook = await storage.getBookInfoByExternalId(externalId);
  
  if (existingBook) {
    return existingBook;
  }
  
  // 从API获取
  const bookDetails = await getBookDetailsFromAPI(externalId);
  
  if (!bookDetails) {
    return null;
  }
  
  // 转换并保存到数据库
  const bookInfo = convertToBookInfo(bookDetails);
  return await storage.createBookInfo(bookInfo);
}
