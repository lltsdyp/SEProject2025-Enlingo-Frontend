import { Text } from "@/components/themed";
import {
  ExerciseItemProps,
  ExerciseItemVariant as ExerciseItemType,
  FlashCardExercise,
  TranslateExercise,
  VideoExercise,
} from "@/types/course";

import { FlashCardItem } from "./flash-card-item";
import { TranslateItem } from "./translate-item";
import { VideoItem } from "./video-item";
import { DefaultApiFactory } from "@/api/apis/default-api"; 
import { apiClient } from "@/api";
// import {}
const api = DefaultApiFactory();
interface Props extends ExerciseItemProps {
  exerciseItem: ExerciseItemType;
}

export  default  function ExerciseItems({
  exerciseItem,
  onContinue,
  onResult,
}: Props) {
  console.info("item structure:",exerciseItem);
  if (exerciseItem.type === "flashCard") {
    return (
      <FlashCardItem
        exercise={exerciseItem as FlashCardExercise}
        onResult={onResult}
        onContinue={onContinue}
      />
    );
  } else if (exerciseItem.type === "translate") {
    return (
      <TranslateItem
        exercise={exerciseItem as TranslateExercise}
        onResult={onResult}
        onContinue={onContinue}
      />
    );
  } else if (exerciseItem.type === "video") {
    return (
      <VideoItem
        exercise={exerciseItem as VideoExercise}
        onTranslateRequest={async (text) => {
          await apiClient.wordlistAddPost(text.trim());
          // TODO
          console.log(`需要翻译: "${text}"`);
        }}
        onResult={onResult}
        onContinue={onContinue}
      />
    )
  } else {
    return <Text>Unknown exercise</Text>;
  }
}
