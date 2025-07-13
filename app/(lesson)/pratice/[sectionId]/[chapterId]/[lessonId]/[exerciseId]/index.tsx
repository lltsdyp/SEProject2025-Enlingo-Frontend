import { useLocalSearchParams } from "expo-router";

import ExerciseScreen from "@/components/exercise/screens/exercise";
import { Metadata } from "@/components/metadata";
import { getExercise } from "@/content/courses/data";

export default function Practice() {
  const { sectionIdx, chapterIdx, lessonIdx, exerciseIdx } = useLocalSearchParams();

  const toNumber = (value: any) =>
    typeof value === "string" ? Number(value) : -1;

  const exercise = getExercise({
    sectionIdx: toNumber(sectionIdx),
    chapterIdx: toNumber(chapterIdx),
    lessonIdx: toNumber(lessonIdx),
    exerciseIdx: toNumber(exerciseIdx),
  });
  if (!exercise) return null;

  return (
    <>
      <Metadata
        title="Pratice"
        description="Pratice a lesson every day to keep your streak."
      />
      <ExerciseScreen exerciseId={exercise} increaseProgress={false} />
    </>
  );
}
