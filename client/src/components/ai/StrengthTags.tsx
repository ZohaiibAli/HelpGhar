interface Props {
  strengths: string[];
}

export default function StrengthTags({
  strengths,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2">

      {strengths.map((item) => (
        <span
          key={item}
          className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700"
        >
          {item}
        </span>
      ))}

    </div>
  );
}