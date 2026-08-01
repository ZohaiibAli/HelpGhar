import { useEffect, useState } from "react";
import { WorkerCard } from "@/components/workers/WorkerCard";
import { authHeaders, handleAuthFailure } from "@/lib/session";
import type { Worker } from "@/types";


const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000";


export default function RecommendedWorkers() {

  const [workers, setWorkers] = useState<Worker[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    fetchWorkers();

  }, []);

  async function fetchWorkers() {

    try {

      const res = await fetch(

        `${API_BASE}/recommendations/my-workers`,

        {

          headers: authHeaders()

        }

      );

      // A silently-swallowed background fetch is exactly how a dead session
      // stays invisible -- bail out and let the session module log out.
      if (handleAuthFailure(res)) return;

      const data = await res.json();

      if (data.success) {

        setWorkers(data.workers);

      }

    }

    catch (err) {

      console.error(err);

    }

    finally {

      setLoading(false);

    }

  }

  if (loading)

    return (

      <div className="mt-8">

        <h2 className="text-xl font-bold">

          Recommended Workers

        </h2>

        <p className="text-sm text-muted-foreground">

          Loading recommendations...

        </p>

      </div>

    );

  return (

    <div className="mt-8">

      <div className="flex justify-between items-center mb-5">

        <div>

          <h2 className="text-2xl font-bold">

            Recommended For You

          </h2>

          <p className="text-sm text-muted-foreground">

            Ranked by HelpGhar AI

          </p>

        </div>

      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        {workers.slice(0,4).map((worker,index)=>(

          <WorkerCard

            key={worker.id}

            worker={worker}

            index={index}

          />

        ))}

      </div>

    </div>

  );

}