import ExerciseScreen from "@/components/exercise/screens/exercise";
import { Metadata } from "@/components/metadata";
import { getExercise } from "@/content/courses/data";
import { useCourse } from "@/context/course";
import { useLocalSearchParams } from "expo-router";

export default function Lesson() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  console.log("exerciseId:", exerciseId);
  const { courseId, courseProgress } = useCourse();
  if (!courseId) return null;

  const exercise = getExercise(courseProgress);
  if (!exercise) return null;

  return (
    <>
      <Metadata
        title="Lesson"
        description="Learn a new lesson every day to keep your streak."
      />
      <ExerciseScreen exerciseId={exerciseId===undefined?exercise:{id: parseInt(exerciseId,10)}} increaseProgress={exerciseId===undefined} />
    </>
  );
}
