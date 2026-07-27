import type { WellnessCheckIn } from "@/types";

export const CHECK_IN_SCALE = [
  { value: 1, label: "Heavy" },
  { value: 2, label: "Low" },
  { value: 3, label: "Okay" },
  { value: 4, label: "Good" },
  { value: 5, label: "Strong" },
] as const;

export type CheckInDimension = "mental" | "physical" | "emotional";

export const DIMENSION_META: Record<
  CheckInDimension,
  { label: string; prompt: string }
> = {
  mental: {
    label: "Mental",
    prompt: "Clear-headed, focused, not overloaded?",
  },
  physical: {
    label: "Physical",
    prompt: "Energy, sleep, how the body feels?",
  },
  emotional: {
    label: "Emotional",
    prompt: "Settled, connected, able to feel?",
  },
};

function labelFor(score: number) {
  return CHECK_IN_SCALE.find((s) => s.value === score)?.label ?? "Okay";
}

function lowestDimension(checkIn: Pick<WellnessCheckIn, CheckInDimension>) {
  const entries: { key: CheckInDimension; value: number }[] = [
    { key: "mental", value: checkIn.mental },
    { key: "physical", value: checkIn.physical },
    { key: "emotional", value: checkIn.emotional },
  ];
  entries.sort((a, b) => a.value - b.value);
  return entries[0];
}

function average(checkIn: Pick<WellnessCheckIn, CheckInDimension>) {
  return (checkIn.mental + checkIn.physical + checkIn.emotional) / 3;
}

/** Short, human insight for a check-in — for partner view or self reflection. */
export function insightForCheckIn(
  checkIn: WellnessCheckIn,
  previous?: WellnessCheckIn | null,
  subjectName?: string
): string {
  const who = subjectName ? subjectName.split(" ")[0] : "They";
  const avg = average(checkIn);
  const low = lowestDimension(checkIn);
  const ranked = (
    [
      { key: "mental" as const, value: checkIn.mental },
      { key: "physical" as const, value: checkIn.physical },
      { key: "emotional" as const, value: checkIn.emotional },
    ] satisfies { key: CheckInDimension; value: number }[]
  ).slice().sort((a, b) => b.value - a.value);
  const high = ranked[0];

  const parts: string[] = [];

  if (avg >= 4.3) {
    parts.push(`${who} looks steady across mental, physical, and emotional right now.`);
  } else if (avg <= 2.3) {
    parts.push(
      `${who} is carrying a lot — a soft check-in conversation could mean a lot today.`
    );
  } else if (low.value <= 2 && high.value - low.value >= 2) {
    parts.push(
      `${DIMENSION_META[low.key].label} is the tender spot (${labelFor(low.value).toLowerCase()}), while ${DIMENSION_META[high.key].label.toLowerCase()} is holding up better.`
    );
  } else if (low.value <= 2) {
    parts.push(
      `${DIMENSION_META[low.key].label} energy looks like what needs the most care right now.`
    );
  } else {
    parts.push(
      `Overall ${labelFor(Math.round(avg)).toLowerCase()} — ${DIMENSION_META[low.key].label.toLowerCase()} is the quietest signal to watch.`
    );
  }

  if (previous) {
    const deltas: { key: CheckInDimension; delta: number }[] = [
      { key: "mental", delta: checkIn.mental - previous.mental },
      { key: "physical", delta: checkIn.physical - previous.physical },
      { key: "emotional", delta: checkIn.emotional - previous.emotional },
    ];
    const up = deltas.filter((d) => d.delta >= 2).map((d) => DIMENSION_META[d.key].label);
    const down = deltas.filter((d) => d.delta <= -2).map((d) => DIMENSION_META[d.key].label);
    if (up.length) {
      parts.push(`${up.join(" & ")} improved since the last check-in.`);
    } else if (down.length) {
      parts.push(`${down.join(" & ")} dipped since the last check-in.`);
    }
  }

  return parts.join(" ");
}

export function scoreTone(score: number): "sage" | "clay" | "amber" | "neutral" {
  if (score >= 4) return "sage";
  if (score === 3) return "neutral";
  if (score === 2) return "amber";
  return "clay";
}
