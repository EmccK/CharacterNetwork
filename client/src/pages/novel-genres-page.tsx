import NovelGenreList from "@/components/novel-genre/novel-genre-list";

export default function NovelGenresPage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <NovelGenreList />
      </main>
    </div>
  );
}