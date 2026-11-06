import { MainLayout } from "@/components/layout/MainLayout";
import { JobBoardBrowser } from "@/components/jobs/JobBoardBrowser";

export default function Worker_JobBoard() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black md:text-4xl">Job board</h1>
        <p className="mt-2 text-sm text-muted-foreground">Browse job requests posted by customers.</p>
        <div className="mt-6">
          <JobBoardBrowser />
        </div>
      </div>
    </MainLayout>
  );
}
