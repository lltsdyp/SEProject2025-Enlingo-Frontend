// src/components/LessonPopoverContent.tsx
import React from 'react';
import { ActivityIndicator, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useQuery, useQueries } from '@tanstack/react-query';
import { router } from 'expo-router';

// 导入你的工具和 Service
import { Button } from '@/components/ui/button'; // 确保 Button 路径正确
import { layouts } from '@/constants/layouts';
import { useTheme } from '@/context/theme'; // 导入 useTheme
import { useLanguageCode } from '@/context/language'; // 导入 useLanguageCode
import { getExerciseSetById } from '@/api'; // 导入 API 函数
import { CourseProgression, ExerciseSet, Lesson } from '@/types/course'; // 导入类型

// 定义 Popover 内容组件的 Props 接口
interface PopoverItemProps {
  exerciseSetId: number; // 接收 ExerciseSet 的 ID
  lessonDescription: string;
  totalExercise: number;
  isCurrentLesson: boolean;
  isFinishedLesson: boolean;
  courseProgression: CourseProgression;
  closePopover: () => void; // 传递关闭 Popover 的回调
}

// 这是一个独立的 React 组件，可以在其顶层安全地调用 Hooks
export const PopoverItem: React.FC<PopoverItemProps> = ({
  exerciseSetId,
  lessonDescription,
  totalExercise,
  isCurrentLesson,
  isFinishedLesson,
  courseProgression,
  closePopover,
}) => {
  // --- Hooks (在组件顶层调用) ---
  const { foreground, mutedForeground, muted, border, background } = useTheme(); // 从 useTheme 获取主题颜色
  const { languageCode } = useLanguageCode(); // 从 useLanguageCode 获取语言代码

  // 1. Hook 调用：根据 exerciseSetId 加载 ExerciseSet 数据
  const {
    data: currentExercise,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ExerciseSet>({
    queryKey: ['exerciseSet', exerciseSetId],
    queryFn: () => getExerciseSetById(exerciseSetId), // 假设 getExerciseSetById 存在
    enabled: true, // 组件挂载后就尝试加载
  });

  const isNotFinishedLesson = !isFinishedLesson && !isCurrentLesson;

  // --- 渲染加载/错误状态 ---
  if (isLoading) {
    return (
      <View style={[styles.popoverContent, styles.centerContent]}>
        <ActivityIndicator size="small" color={foreground} />
        <Text style={styles.statusText}>正在加载练习...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.popoverContent, styles.centerContent]}>
        <Text style={styles.errorText}>加载失败，请检查网络。</Text>
        <Text style={styles.errorDetails}>{error instanceof Error ? error.message : '未知错误'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentExercise) { // 数据加载成功但为空
    return (
      <View style={[styles.popoverContent, styles.centerContent]}>
        <Text style={styles.statusText}>未找到练习。</Text>
      </View>
    );
  }

  const {
    sectionIdx: sectionIdx,
    chapterIdx: chapterIdx,
    lessonIdx: lessonIdx, // 从 courseProgression 获取 lessonIdx
    // exerciseIdx: currentProgressionexerciseIdx, // 避免与 currentExercise.id 混淆
  } = courseProgression;

  return (
    <View
      style={[
        styles.popoverContent,
        {
          borderWidth: layouts.borderWidth, // 从 layouts 获取
          borderColor: border, // 从 useTheme 获取
        }
      ]}
    >
      <View
        style={styles.popoverHeader}
      >
        <Text
          style={[styles.popoverTitle, { color: isNotFinishedLesson ? mutedForeground : foreground }]}
        >
          {lessonDescription}
        </Text>
        {isCurrentLesson && (
          <View
            style={[styles.difficultyBadge, { backgroundColor: muted }]}
          >
            <Text
              style={[styles.difficultyText, { color: mutedForeground }]}
            >
              {currentExercise.difficulty}
            </Text>
          </View>
        )}
      </View>
      <Text style={{ color: mutedForeground }}>
        {isFinishedLesson
          ? "Prove your proficiency with Legendary"
          : isNotFinishedLesson
          ? "Complete all levels above to unlock this!"
          : `Exercise ${currentExercise.id} of ${totalExercise}`} {/* 使用 currentExercise.id */}
      </Text>
      <Button
        onPress={() => {
          closePopover();
          // 注意：router.push 中的 lessonIdx 和 exerciseIdx 需要是真实的 ID，而不是索引
          // 这里的 lessonIdx 应该是 courseProgression.lessonIdx
          // exerciseIdx 应该是当前获取到的 currentExercise.id
          if (isFinishedLesson) {
            router.push(
              `/pratice/${sectionIdx}/${chapterIdx}/${lessonIdx}/${currentExercise.id}` // 使用 currentExercise.id
            );
          } else {
            router.push("/lesson"); // 如果不完成，导航到通用课程页
          }
        }}
        disabled={isNotFinishedLesson}
      >
        {isFinishedLesson
          ? `Pratice +${currentExercise.xp / 2} xp`
          : isNotFinishedLesson
          ? "Locked"
          : `Start +${currentExercise.xp} xp`}
      </Button>
    </View>
  );
};

// --- Styles for LessonPopoverContent ---
const styles = StyleSheet.create({
  popoverContent: {
    padding: layouts.padding,
    borderRadius: layouts.padding,
    width: 300,
    gap: layouts.padding,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 100,
  },
  popoverHeader: {
    flexDirection: "row",
    gap: layouts.padding,
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
  },
  popoverTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  difficultyBadge: {
    paddingVertical: layouts.padding / 2,
    paddingHorizontal: layouts.padding,
    borderRadius: layouts.padding / 2,
  },
  difficultyText: {
    textTransform: "uppercase",
    fontWeight: "bold",
    fontSize: 12,
  },
  statusText: {
    marginTop: layouts.padding,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    color: 'red',
    fontWeight: 'bold',
  },
  errorDetails: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  retryButton: {
    marginTop: layouts.padding,
    backgroundColor: '#007AFF',
    paddingVertical: layouts.padding / 2,
    paddingHorizontal: layouts.padding,
    borderRadius: layouts.padding / 4,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});