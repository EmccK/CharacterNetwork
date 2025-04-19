import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import NovelGenreList from "@/components/novel-genre/novel-genre-list";

export default function NovelGenresPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="小说类型管理" />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          <NovelGenreList />
        </main>
      </div>
    </div>
  );
}