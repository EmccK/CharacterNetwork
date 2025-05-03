/**
 * API 类型定义
 * 
 * 这个文件包含所有API请求和响应的类型定义
 */

import {
  Novel, Character, Relationship, RelationshipType, NovelGenre, BookInfo,
  User
} from './schema';

/**
 * 通用API响应结构
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errorCode?: string;
  details?: any;
}

/**
 * 通用错误响应
 */
export interface ApiError {
  success: false;
  message: string;
  errorCode?: string;
  details?: any;
}

/**
 * 通用分页请求参数
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * 通用分页响应
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 登录请求
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  user: Omit<User, 'password'>;
}

/**
 * 注册请求
 */
export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
}

/**
 * 注册响应
 */
export interface RegisterResponse {
  user: Omit<User, 'password'>;
}

/**
 * 修改密码请求
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * 小说相关
 */

/**
 * 获取小说列表请求
 */
export interface GetNovelsRequest extends PaginationParams {
  userId?: number;
  genre?: string;
  status?: string;
  search?: string;
}

/**
 * 获取小说列表响应
 */
export interface GetNovelsResponse {
  novels: Novel[];
}

/**
 * 获取小说详情响应
 */
export interface GetNovelResponse {
  novel: Novel;
}

/**
 * 创建小说请求
 * 注意：这个需要使用FormData，因为涉及文件上传
 */
export interface CreateNovelFormData {
  title: string;
  description?: string;
  genre?: string;
  status?: string;
  coverImage?: File;
  coverImageUrl?: string;
  userId: number;
  bookInfoId?: number;
}

/**
 * 创建小说响应
 */
export interface CreateNovelResponse {
  novel: Novel;
}

/**
 * 更新小说请求
 * 注意：这个需要使用FormData，因为可能涉及文件上传
 */
export interface UpdateNovelFormData {
  title?: string;
  description?: string;
  genre?: string;
  status?: string;
  coverImage?: File;
  coverImageUrl?: string;
}

/**
 * 更新小说响应
 */
export interface UpdateNovelResponse {
  novel: Novel;
}

/**
 * 角色相关
 */

/**
 * 获取角色列表请求
 */
export interface GetCharactersRequest extends PaginationParams {
  novelId: number;
  search?: string;
}

/**
 * 获取角色列表响应
 */
export interface GetCharactersResponse {
  characters: Character[];
}

/**
 * 获取角色详情响应
 */
export interface GetCharacterResponse {
  character: Character;
}

/**
 * 创建角色请求
 * 注意：这个需要使用FormData，因为涉及文件上传
 */
export interface CreateCharacterFormData {
  name: string;
  description?: string;
  novelId: number;
  avatar?: File;
  avatarUrl?: string;
  age?: number;
  gender?: string;
  role?: string;
}

/**
 * 创建角色响应
 */
export interface CreateCharacterResponse {
  character: Character;
}

/**
 * 更新角色请求
 * 注意：这个需要使用FormData，因为可能涉及文件上传
 */
export interface UpdateCharacterFormData {
  name?: string;
  description?: string;
  novelId?: number;
  avatar?: File;
  avatarUrl?: string;
  age?: number;
  gender?: string;
  role?: string;
}

/**
 * 更新角色响应
 */
export interface UpdateCharacterResponse {
  character: Character;
}

/**
 * 关系相关
 */

/**
 * 获取关系列表请求
 */
export interface GetRelationshipsRequest extends PaginationParams {
  novelId: number;
  characterId?: number;
  typeId?: number;
}

/**
 * 获取关系列表响应
 */
export interface GetRelationshipsResponse {
  relationships: Relationship[];
}

/**
 * 获取关系详情响应
 */
export interface GetRelationshipResponse {
  relationship: Relationship;
}

/**
 * 创建关系请求
 */
export interface CreateRelationshipRequest {
  sourceId: number;
  targetId: number;
  typeId: number;
  novelId: number;
  description?: string;
  strength?: number;
}

/**
 * 创建关系响应
 */
export interface CreateRelationshipResponse {
  relationship: Relationship;
}

/**
 * 更新关系请求
 */
export interface UpdateRelationshipRequest {
  sourceId?: number;
  targetId?: number;
  typeId?: number;
  description?: string;
  strength?: number;
}

/**
 * 更新关系响应
 */
export interface UpdateRelationshipResponse {
  relationship: Relationship;
}

/**
 * 关系类型相关
 */

/**
 * 获取关系类型列表请求
 */
export interface GetRelationshipTypesRequest extends PaginationParams {
  userId: number;
}

/**
 * 获取关系类型列表响应
 */
export interface GetRelationshipTypesResponse {
  relationshipTypes: RelationshipType[];
}

/**
 * 获取关系类型详情响应
 */
export interface GetRelationshipTypeResponse {
  relationshipType: RelationshipType;
}

/**
 * 创建关系类型请求
 */
export interface CreateRelationshipTypeRequest {
  name: string;
  color: string;
  userId: number;
}

/**
 * 创建关系类型响应
 */
export interface CreateRelationshipTypeResponse {
  relationshipType: RelationshipType;
}

/**
 * 更新关系类型请求
 */
export interface UpdateRelationshipTypeRequest {
  name?: string;
  color?: string;
}

/**
 * 更新关系类型响应
 */
export interface UpdateRelationshipTypeResponse {
  relationshipType: RelationshipType;
}

/**
 * 小说类型相关
 */

/**
 * 获取小说类型列表请求
 */
export interface GetNovelGenresRequest extends PaginationParams {
  userId?: number;
  isPublic?: boolean;
}

/**
 * 获取小说类型列表响应
 */
export interface GetNovelGenresResponse {
  genres: NovelGenre[];
}

/**
 * 获取小说类型详情响应
 */
export interface GetNovelGenreResponse {
  genre: NovelGenre;
}

/**
 * 创建小说类型请求
 */
export interface CreateNovelGenreRequest {
  name: string;
  description?: string;
  userId: number;
  isPublic?: boolean;
}

/**
 * 创建小说类型响应
 */
export interface CreateNovelGenreResponse {
  genre: NovelGenre;
}

/**
 * 更新小说类型请求
 */
export interface UpdateNovelGenreRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

/**
 * 更新小说类型响应
 */
export interface UpdateNovelGenreResponse {
  genre: NovelGenre;
}

/**
 * 书籍信息相关
 */

/**
 * 获取书籍信息列表请求
 */
export interface GetBookInfosRequest extends PaginationParams {
  search?: string;
}

/**
 * 获取书籍信息列表响应
 */
export interface GetBookInfosResponse {
  bookInfos: BookInfo[];
}

/**
 * 获取书籍信息详情响应
 */
export interface GetBookInfoResponse {
  bookInfo: BookInfo;
}

/**
 * 搜索外部书籍请求
 */
export interface SearchExternalBooksRequest {
  query: string;
  maxResults?: number;
}

/**
 * 搜索外部书籍响应
 */
export interface SearchExternalBooksResponse {
  items: BookInfo[];
  totalItems: number;
}

/**
 * 从外部书籍创建小说请求
 */
export interface CreateNovelFromBookRequest {
  externalId: string;
  status?: string;
}

/**
 * 系统统计信息
 */
export interface SystemStats {
  userCount: number;
  novelCount: number;
  characterCount: number;
  relationshipCount: number;
  genreCount: number;
}