interface Props {
  positive: number;
}

export default function SentimentProgress({
  positive,
}: Props) {
  return (
    <div>

      <div className="flex justify-between text-sm">

        <span>Positive Reviews</span>

        <span>{positive}%</span>

      </div>

      <div className="mt-2 h-2 rounded-full bg-gray-200">

        <div
          className="h-2 rounded-full bg-emerald-500"
          style={{
            width: `${positive}%`,
          }}
        />

      </div>

    </div>
  );
}