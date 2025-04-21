import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { BookInfo } from '@shared/schema';
import BookSearch from '@/components/books/BookSearch';
import BookDetail from '@/components/books/BookDetail';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, HomeIcon, PlusIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';

const ImportBookPage = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedBook, setSelectedBook] = useState<BookInfo | null>(null);
  const [setSearchQuery, setSetSearchQuery] = useState<(query: string) => string | null>(null);

  // 确保用户已登录
  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleSelectBook = (book: BookInfo) => {
    setSelectedBook(book);
  };

  const handleBackToSearch = () => {
    setSelectedBook(null);
  };
  
  // 设置搜索外部接口
  const setExternalSearchQueryRef = useCallback((fn: (query: string) => string) => {
    setSetSearchQuery(() => fn);
  }, []);
  
  // 处理点击关键词
  const handleSuggestionClick = (suggestion: string) => {
    if (setSearchQuery) {
      setSearchQuery(suggestion);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">导入书籍</h1>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            <HomeIcon className="h-4 w-4 mr-2" />
            主页
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/novels')}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            返回小说列表
          </Button>
        </div>
      </div>

      <Card className="p-6">
        {!selectedBook ? (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">搜索并导入书籍</h2>
              <p className="text-gray-600 text-sm mb-4">
                通过搜索外部书籍信息来快速创建小说。您可以搜索书名、作者或ISBN。
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {['长安的荔枝', '三体', '活着', '围城', '平凡的世界'].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
            <BookSearch onSelectBook={handleSelectBook} setExternalSearchQuery={setExternalSearchQueryRef} />
          </>
        ) : (
          <BookDetail book={selectedBook} onBack={handleBackToSearch} />
        )}
      </Card>

      <div className="mt-6 flex justify-center">
        <Button variant="outline" onClick={() => navigate('/novels/new')}>
          <PlusIcon className="h-4 w-4 mr-2" />
          不需要导入，直接创建空白小说
        </Button>
      </div>
    </div>
  );
};

export default ImportBookPage;
