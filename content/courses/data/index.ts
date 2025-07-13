// src/content/courses/data.ts
import React, { useMemo } from 'react'; // 引入 useMemo
import { Course, CourseProgression, ExerciseSet, Section, Chapter, Lesson, LanguageCharacters, ExerciseSetId } from "@/types/course"; // 确保所有类型都导入
import { useQueryClient } from "@tanstack/react-query";
import { useLanguageCode } from '@/context/language';
import { characters } from '@/content/courses/data/characters';
import { getExerciseSetById } from '@/api'; // 引入 getExerciseSetById

import { useQuery } from '@tanstack/react-query';


export function useExercise(exerciseId: ExerciseSetId): { exercise: ExerciseSet, isLoading: boolean, isError: any } {
  const {
    data: exercise,
    isLoading,
    isError
  } = useQuery({
    // queryKey 必须是唯一的，并包含所有依赖项。
    // 当 exerciseId 变化时，TanStack Query 会自动重新获取数据。
    queryKey: ['exerciseSet', exerciseId],
    queryFn: () => getExerciseSetById(exerciseId.id),
    enabled: exerciseId !== null,
    staleTime: 5 * 60 * 1000, // 5 分钟内数据保持新鲜
    retry: 3,
  });
  return { exercise: exercise as ExerciseSet, isLoading, isError }
}

// --- 1. useCourseContent Hook：从缓存读取已组合的数据 ---
export function useCourseContent(): Course | null {
  const queryClient = useQueryClient();
  const { languageCode } = useLanguageCode();

  // 从缓存中获取已经通过 getSections 填充好的 sections (Chapter 和 Lesson 已填充)
  const sectionsData = queryClient.getQueryData<Section[]>(['sections', languageCode]);
  // 从缓存中获取 characters
  const charactersData = characters as LanguageCharacters;

  // 如果任何核心数据块缺失，则返回 null (表示数据未完全加载)
  if (!sectionsData || !characters) {
    return null;
  }

  // // Final Step: Populating Lesson.exercises (since it's still number[] in type)
  // // 收集所有 Lesson.exercises 中的 ExerciseSet IDs
  // const allExerciseSetIds = useMemo(() => { // 使用 useMemo 缓存这个 Set
  //   const ids = new Set<number>();
  //   sectionsData.forEach(section => {
  //     section.chapters.forEach(chapter => {
  //       chapter.lessons.forEach(lesson => {
  //         (lesson.exercises as number[]).forEach(id => ids.add(id)); // 遍历 Lesson.exercises (断言为 number[])
  //       });
  //     });
  //   });
  //   return ids;
  // }, [sectionsData]); // 依赖 sectionsData

  // // 获取所有 ExerciseSet 数据并存储在 Map 中，以便填充 Lesson.exercises
  // // 这些 ExerciseSet 必须在 RootLayoutContent 中被预加载到缓存中
  // const exerciseSetsMap = useMemo(() => { // 使用 useMemo 缓存这个 Map
  //   const map = new Map<number, ExerciseSet>();
  //   allExerciseSetIds.forEach(id => {
  //     const es = queryClient.getQueryData<ExerciseSet>(['exerciseSet', id]);
  //     if (es) map.set(id, es);
  //   });
  //   return map;
  // }, [allExerciseSetIds, queryClient]); // 依赖 allExerciseSetIds 和 queryClient


  // // 最终组合和填充 Lesson.exercises
  // const finalSections: Section[] = useMemo(() => { // 使用 useMemo 缓存最终的 sections 数组
  //   return sectionsData.map(section => {
  //     const finalChapters: Chapter[] = section.chapters.map(chapter => {
  //       const finalLessons: Lesson[] = chapter.lessons.map(lesson => {
  //         // 在这里进行 Lesson.exercises 的填充：从 number[] 变为 ExerciseSet[]
  //         const populatedExercises: ExerciseSet[] = (lesson.exercises as number[]).map(exerciseId => { // 类型断言为 number[]
  //           return exerciseSetsMap.get(exerciseId) || { id: exerciseId, xp: 0, difficulty: 'easy', items: [] }; // 默认值
  //         });
  //         // !!! 关键：Lesson.exercises 原始类型是 number[]，这里将 ExerciseSet[] 赋值给它
  //         // 所以必须使用 `as unknown as number[]` 强制类型转换
  //         return { ...lesson, exercises: populatedExercises as unknown as number[] };
  //       });
  //       return { ...chapter, lessons: finalLessons };
  //     });
  //     return { ...section, chapters: finalChapters };
  //   });
  // }, [sectionsData, exerciseSetsMap]); // 依赖 sectionsData 和 exerciseSetsMap


  return {
    sections: sectionsData,
    characters: charactersData,
  };
}


// --- 2. getExercise 函数：接收一个完整的 Course 对象 ---
// 这是一个普通的工具函数， Lesson.exercises 仍然需要类型断言
export function getExercise(
  { sectionId, chapterId, lessonId, exerciseId }: CourseProgression
): ExerciseSetId | null {
  const course = useCourseContent();
  if (!course) return null;
  const section = course.sections[sectionId];
  if (section) {
    const chapter = section.chapters[chapterId];
    if (chapter) {
      const lesson = chapter.lessons[lessonId];
      if (lesson && lesson.exercises.length > exerciseId) { // Lesson.exercises 仍然需要类型断言
        return { id: lesson.exercises[exerciseId] };
      }
    }
  }
  return null;
}


// --- 3. nextProgress 函数：接收一个完整的 Course 对象 ---
// 这是一个普通的工具函数， Lesson.exercises 仍然需要类型断言
export function nextProgress(
  course: Course, // 接收完整的 Course 对象
  current: CourseProgression
): CourseProgression | null {
  const { sectionId, chapterId, lessonId, exerciseId } = current;

  const section = course.sections[sectionId];
  if (!section) return null;
  const chapter = section.chapters[chapterId];
  if (!chapter) return null;
  const lesson = chapter.lessons[lessonId];
  if (!lesson) return null;

  const exercisesCount = lesson.exercises.length;
  const lessonsCount = chapter.lessons.length;
  const chaptersCount = section.chapters.length;
  const sectionsCount = course.sections.length;


  if (exerciseId < exercisesCount - 1) {
    return { ...current, exerciseId: exerciseId + 1 };
  } else if (lessonId < lessonsCount - 1) {
    return { ...current, lessonId: lessonId + 1, exerciseId: 0 };
  } else if (chapterId < chaptersCount - 1) {
    return { ...current, chapterId: chapterId + 1, lessonId: 0, exerciseId: 0 };
  } else if (sectionId < sectionsCount - 1) {
    return {
      ...current,
      sectionId: sectionId + 1,
      chapterId: 0,
      lessonId: 0,
      exerciseId: 0,
    };
  }

  return null;
}
