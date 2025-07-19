import { Text } from "@/components/themed";
import {
  ExerciseItemProps,
  ExerciseItemVariant as ExerciseItemType,
  FlashCardExercise,
  RetellingExercise,
  TranslateExercise,
  VideoExercise,
} from "@/types/course";

import { FlashCardItem } from "./flash-card-item";
import { TranslateItem } from "./translate-item";
import { VideoItem } from "./video-item";
import { DefaultApiFactory } from "@/api/apis/default-api";
import { apiClient } from "@/api";
import { RetellingItem } from "./retelling-item";

// import {}
const api = DefaultApiFactory();
interface Props extends ExerciseItemProps {
  exerciseItem: ExerciseItemType;
}

export default function ExerciseItems({
  exerciseItem,
  onContinue,
  onResult,
}: Props) {
  console.info("item structure:", exerciseItem);
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
  } else if (exerciseItem.type == "retelling") {
    return (
      <RetellingItem
        exercise={exerciseItem as RetellingExercise}
        onResult={onResult}
        onContinue={onContinue}
        onRetellingSubmit={function (recording: File | { uri: string; name: string; type: string; }): Promise<boolean> {
          return Promise.resolve(true);
        }} />
    )
  }
  else {
    return <Text>Unknown exercise</Text>;
  }
}
