interface Props {
  label: string;
}

export default function ReputationBadge({ label }: Props) {
  const styles: Record<string, string> = {
    "Customer Favorite":
      "bg-emerald-100 text-emerald-700",

    "Highly Appreciated":
      "bg-green-100 text-green-700",

    "Trusted Professional":
      "bg-blue-100 text-blue-700",

    "Good Reputation":
      "bg-yellow-100 text-yellow-700",

    "Needs Improvement":
      "bg-red-100 text-red-700",

    "New Worker":
      "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        styles[label] || styles["New Worker"]
      }`}
    >
      ⭐ {label}
    </span>
  );
}