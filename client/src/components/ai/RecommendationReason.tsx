interface Props {

    score: number;

    content: number;

    collaborative: number;

}

export default function RecommendationReason({

    score,

    content,

    collaborative

}: Props) {

    return (

        <div className="rounded-xl bg-blue-50 p-3 mt-3">

            <p className="font-semibold text-blue-700">

                AI Match {score.toFixed(0)}%

            </p>

            <p className="text-xs text-gray-600 mt-1">

                Profile Match {content.toFixed(0)}%

            </p>

            <p className="text-xs text-gray-600">

                Similar Customers {collaborative.toFixed(0)}%

            </p>

        </div>

    )

}