import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-sm font-bold uppercase tracking-wider text-primary">404</p>
        <h1 className="mt-3 text-3xl font-black">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        <Button asChild className="mt-6 bg-primary hover:bg-primary-dark"><Link to="/">Go home</Link></Button>
      </div>
    </MainLayout>
  );
}
