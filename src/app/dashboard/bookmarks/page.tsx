import DashboardLayout from "@/components/layout/dashboard-layout";
import { Bookmark } from "lucide-react";

export default function BookmarksPage() {
  return (
    <DashboardLayout>
      <div className="max-w-xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
            <Bookmark size={20} className="text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Saved</h1>
            <p className="text-xs text-muted-foreground">Your bookmarked jobs and posts</p>
          </div>
        </div>
        <div className="p-12 rounded-2xl border border-white/8 bg-white/3 text-center">
          <Bookmark size={32} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nothing saved yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Bookmark jobs and community posts to find them here.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
