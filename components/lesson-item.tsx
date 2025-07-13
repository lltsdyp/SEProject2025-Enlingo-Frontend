import React, { useState } from "react";
import { router } from "expo-router";
import {
  Pressable,
  PressableProps,
  StyleSheet, // 引入 StyleSheet for LessonItem's own styles
} from "react-native";
import Popover from "react-native-popover-view/dist/Popover"; // 确保导入路径正确

import { Icon } from "@/components/icons";
import { Text, View } from "@/components/themed";
// import { Button } from "@/components/ui/button"; // 不再需要，已移入 LessonPopoverContent
import { layouts } from "@/constants/layouts";
import { useTheme } from "@/context/theme";
// 导入新的 Popover 内容组件
import { PopoverItem } from './popover-item'; // 确保路径正确

import { CourseProgression, ExerciseSet } from "@/types/course"; // 确保导入 ExerciseSet


interface LessonItemProps extends PressableProps {
  circleRadius: number;
  isCurrentLesson: boolean;
  isFinishedLesson: boolean;
  index: number;
  lessonDescription: string;
  totalExercise: number;
  exerciseSetId: number; // <-- 新增，从 Learn 或 ChapterDisplay 传递
  courseProgression: CourseProgression;
}

export function LessonItem({
  isCurrentLesson,
  isFinishedLesson,
  circleRadius,
  index,
  lessonDescription,
  totalExercise,
  exerciseSetId, // 接收新的 prop
  courseProgression,
  ...props
}: LessonItemProps) {
  const {
    background,
    primary,
    primaryForeground,
    mutedForeground,
    muted,
  } = useTheme();
  const [isVisiable, setIsVisiable] = useState(false);
  const openPopover = () => setIsVisiable(true);
  const closePopover = () => setIsVisiable(false);

  return (
    <Popover
      isVisible={isVisiable}
      onRequestClose={closePopover}
      popoverStyle={{
        borderRadius: layouts.padding,
        backgroundColor: background, 
      }}
      backgroundStyle={{
        backgroundColor: 'black',
        opacity: 0.5,
      }}
      from={
        <Pressable onPress={openPopover} {...props}>
          <View
            style={{
              padding: layouts.padding / 2,
              width: circleRadius * 2,
              aspectRatio: 1,
            }}
          >
            <View
              style={[ // 使用 StyleSheet 定义的样式
                styles.circle,
                {
                  backgroundColor:
                    isCurrentLesson || isFinishedLesson || index === 0
                      ? primary
                      : mutedForeground,
                },
              ]}
            >
              {isCurrentLesson ? (
                <Icon name="star" size={32} color={primaryForeground} />
              ) : isFinishedLesson ? (
                <Icon name="check" size={32} color={primaryForeground} />
              ) : index === 0 ? (
                <Icon name="skip" size={32} color={primaryForeground} />
              ) : (
                <Icon name="lock" size={32} color={muted} />
              )}
            </View>
          </View>
        </Pressable>
      }
    >
      {/* 渲染新的 Popover 内容组件 */}
      <PopoverItem
        exerciseSetId={exerciseSetId} // 传递 exerciseSet ID
        lessonDescription={lessonDescription}
        totalExercise={totalExercise}
        isCurrentLesson={isCurrentLesson}
        isFinishedLesson={isFinishedLesson}
        courseProgression={courseProgression}
        closePopover={closePopover}
      />
    </Popover>
  );
}

// --- Styles for LessonItem ---
const styles = StyleSheet.create({
  circle: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
});