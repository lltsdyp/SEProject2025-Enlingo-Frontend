// src/content/courses/data.ts
import React, { useMemo } from 'react'; // 引入 useMemo
import { Course, CourseProgression, ExerciseSet, Section, Chapter, Lesson, LanguageCharacters, ExerciseSetId } from "@/types/course"; // 确保所有类型都导入
import { useQueryClient } from "@tanstack/react-query";
import { useLanguageCode } from '@/context/language';
import { characters } from '@/content/courses/data/characters';
import { getExerciseSetById, getSections } from '@/api'; // 引入 getExerciseSetById

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
  console.log("useExerciseData:",exercise);
  return { exercise: exercise as ExerciseSet, isLoading, isError }
}

// --- 1. useCourseContent Hook：从缓存读取已组合的数据 ---
// export function useCourseContent(): Course | null {
//   const queryClient = useQueryClient();
//   const { languageCode } = useLanguageCode();

//   // 从缓存中获取已经通过 getSections 填充好的 sections (Chapter 和 Lesson 已填充)
//   const sectionsData = queryClient.getQueryData<Section[]>(['sections', languageCode]);
//   // 从缓存中获取 characters
//   const charactersData = characters as LanguageCharacters;

//   // 如果任何核心数据块缺失，则返回 null (表示数据未完全加载)
//   if (!sectionsData || !characters) {
//     return null;
//   }
//   return {
//     sections: sectionsData,
//     characters: charactersData,
//   };
// }

export function useCourseContent() {
  const { languageCode } = useLanguageCode();

  // 使用 useQuery 来订阅 'sections' 数据。
  // 这是最核心的改动。
  const {
    data: sectionsData,
    isLoading: isSectionsLoading,
    isError: isSectionsError,
  } = useQuery({
    // queryKey: 查询的唯一标识符。它必须是一个数组。
    // 当 languageCode 改变时，React Query 会自动重新获取数据。
    queryKey: ['sections', languageCode],

    // queryFn: 获取数据的异步函数。
    // 它必须返回一个 Promise。
    queryFn: () => getSections(languageCode),

    // enabled: 一个非常有用的选项。
    // 只有当 languageCode 存在时，这个查询才会被激活。
    // 这可以防止在 languageCode 初始为空时发送无效的API请求。
    enabled: !!languageCode,
  });

  // 假设 characters 是静态导入的，我们直接使用它。
  // 如果 characters 也是异步的，你应该为它创建另一个 useQuery。
  const charactersData = characters as LanguageCharacters;

  // 判断最终的加载状态。
  // 在这个例子中，只有 sections 是异步的，所以加载状态取决于它。
  const isLoading = isSectionsLoading;

  // 判断最终的错误状态。
  const isError = isSectionsError;

  // 组合最终的数据。
  // 只有在加载完成、没有错误、并且两部分数据都存在的情况下，
  // 我们才认为 Course 数据是完整的。
  const course: Course | null =
    !isLoading && !isError && sectionsData && charactersData
      ? {
          sections: sectionsData,
          characters: charactersData,
        }
      : null;

  // 返回一个包含状态和最终数据的对象。
  // 这样，消费这个 Hook 的组件就可以知道当前处于什么状态。
  return {
    course,
    isLoading,
    isError,
  };
}

// --- 2. getExercise 函数：接收一个完整的 Course 对象 ---
// 这是一个普通的工具函数， Lesson.exercises 仍然需要类型断言
export function getExercise(
  { sectionIdx, chapterIdx, lessonIdx, exerciseIdx }: CourseProgression
): ExerciseSetId | null {
  const {course,isLoading,isError} = useCourseContent();
  if (!course) return null;
  const section = course.sections[sectionIdx];
  if (section) {
    const chapter = section.chapters[chapterIdx];
    if (chapter) {
      const lesson = chapter.lessons[lessonIdx];
      if (lesson && lesson.exercises.length > exerciseIdx) { // Lesson.exercises 仍然需要类型断言
        return { id: lesson.exercises[exerciseIdx] };
      }
    }
  }
  return null;
}

// 判断 a 是否在 b 前面
export function isProgressionBefore(a: CourseProgression, b: CourseProgression): "yes" | "no" | "same" {
  if (a.sectionIdx < b.sectionIdx) return "yes";
  if (a.sectionIdx > b.sectionIdx) return "no";

  if (a.chapterIdx < b.chapterIdx) return "yes";
  if (a.chapterIdx > b.chapterIdx) return "no";

  if (a.lessonIdx < b.lessonIdx) return "yes";
  if (a.lessonIdx > b.lessonIdx) return "no";

  if (a.exerciseIdx < b.exerciseIdx) return "yes";
  if (a.exerciseIdx> b.exerciseIdx) return "no";

  return "same";
}

// --- 3. nextProgress 函数：接收一个完整的 Course 对象 ---
// 这是一个普通的工具函数， Lesson.exercises 仍然需要类型断言
export function nextProgress(
  course: Course, // 接收完整的 Course 对象
  current: CourseProgression
): CourseProgression | null {
  const { sectionIdx, chapterIdx, lessonIdx, exerciseIdx } = current;

  const section = course.sections[sectionIdx];
  if (!section) return null;
  const chapter = section.chapters[chapterIdx];
  if (!chapter) return null;
  const lesson = chapter.lessons[lessonIdx];
  if (!lesson) return null;

  const exercisesCount = lesson.exercises.length;
  const lessonsCount = chapter.lessons.length;
  const chaptersCount = section.chapters.length;
  const sectionsCount = course.sections.length;


  if (exerciseIdx < exercisesCount - 1) {
    return { ...current, exerciseIdx: exerciseIdx + 1 };
  } else if (lessonIdx < lessonsCount - 1) {
    return { ...current, lessonIdx: lessonIdx + 1, exerciseIdx: 0 };
  } else if (chapterIdx < chaptersCount - 1) {
    return { ...current, chapterIdx: chapterIdx + 1, lessonIdx: 0, exerciseIdx: 0 };
  } else if (sectionIdx < sectionsCount - 1) {
    return {
      ...current,
      sectionIdx: sectionIdx + 1,
      chapterIdx: 0,
      lessonIdx: 0,
      exerciseIdx: 0,
    };
  }

  return null;
}
