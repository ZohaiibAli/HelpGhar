import MarketplaceScore from "./MarketplaceScore";
import ReputationBadge from "./ReputationBadge";
import SentimentProgress from "./SentimentProgress";
import StrengthTags from "./StrengthTags";

interface Props {
  worker: any;
}

export default function AIInsightsCard({
  worker,
}: Props) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <h3 className="mb-5 text-lg font-bold">
        Reputation summary
      </h3>

      <ReputationBadge
        label={worker.reputationLabel}
      />

      <div className="mt-5">

        <MarketplaceScore
          score={worker.marketplaceScore}
        />

      </div>

      <div className="mt-6">

        <SentimentProgress
          positive={
            worker.reviewSummary?.positivePercentage ??
            0
          }
        />

      </div>

      <p className="mt-6 text-sm leading-6 text-gray-600">

        {worker.aiSummary?.summary}

      </p>

      <div className="mt-6">

        <StrengthTags
          strengths={
            worker.aiSummary?.strengths ?? []
          }
        />

      </div>

    </div>
  );
}