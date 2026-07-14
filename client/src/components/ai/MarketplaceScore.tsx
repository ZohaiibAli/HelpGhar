interface Props {
  score: number;
}

export default function MarketplaceScore({ score }: Props) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <p className="text-xs text-gray-500">
        Marketplace Score
      </p>

      <h2 className="text-2xl font-bold text-emerald-600">
        {score.toFixed(1)}
      </h2>

      <p className="text-xs text-gray-500">
        out of 100
      </p>
    </div>
  );
}