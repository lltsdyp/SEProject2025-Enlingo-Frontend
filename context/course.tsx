import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";

import { validLanguages } from "@/config/language";
import { DEFAULT_COURSE_PROGRESS } from "@/constants/default";
import {
  COURSE_PROGRESS_STORAGE_KEY,
  CURRENT_COURSE_ID_STORAGE_KEY,
} from "@/constants/storage-key";
import { getLocalData, setLocalData } from "@/lib/local-storage";
import { SupportedLanguageCode } from "@/types";
import { CourseProgression } from "@/types/course";

// 1. 更新 Context 类型定义，包含加载和错误状态
type CourseContextType = {
  courseId: SupportedLanguageCode | null;
  setCourseId: (id: SupportedLanguageCode | null) => void;
  courseProgress: CourseProgression;
  setCourseProgress: Dispatch<SetStateAction<CourseProgression>>;
  isLoading: boolean;
  isError: boolean;
};

// 2. 创建 Context 并提供一个包含加载状态的默认值
const CourseContext = createContext<CourseContextType | undefined>(undefined);

// 3. 封装 useCourse Hook，并添加必要的错误检查
export const useCourse = () => {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error("useCourse must be used within a CourseProvider");
  }
  return context;
};

// 验证函数（保留你的原始逻辑）
const isValidCourseProgress = (
  parsedCourseProgress: any
): parsedCourseProgress is CourseProgression => {
  return (
    parsedCourseProgress &&
    typeof parsedCourseProgress === "object" &&
    "sectionIdx" in parsedCourseProgress &&
    "chapterIdx" in parsedCourseProgress &&
    "lessonIdx" in parsedCourseProgress &&
    "exerciseIdx" in parsedCourseProgress &&
    typeof parsedCourseProgress.sectionIdx === "number" &&
    typeof parsedCourseProgress.chapterIdx === "number" &&
    typeof parsedCourseProgress.lessonIdx === "number" &&
    typeof parsedCourseProgress.exerciseIdx === "number"
  );
};

interface Props {
  children: React.ReactNode;
}

// 4. 重构后的 CourseProvider 组件
export function CourseProvider({ children }: Props) {
  const [courseId, setCourseIdInternal] = useState<SupportedLanguageCode | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgression>(
    DEFAULT_COURSE_PROGRESS
  );
  
  // 使用统一的加载和错误状态
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Effect 1: 主初始化 Effect
  // 只在应用启动时运行一次，负责从本地存储加载初始的 courseId。
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const storedCourseId = await getLocalData(CURRENT_COURSE_ID_STORAGE_KEY);
        if (storedCourseId && validLanguages.includes(storedCourseId as SupportedLanguageCode)) {
          setCourseIdInternal(storedCourseId as SupportedLanguageCode);
        }
        // 如果没有存储的ID，courseId 保持 null，这是正常情况
      } catch (e) {
        console.error("Error initializing course:", e);
        setIsError(true);
      } finally {
        // 初始化流程结束，无论成功与否，都设置 isLoading 为 false
        setIsLoading(false);
      }
    };
    initialize();
  }, []); // 空依赖数组确保只运行一次

  // Effect 2: 处理 courseId 变化的 Effect
  // 当 courseId 被设置或改变时（无论是初始化加载还是用户手动切换），执行此操作。
  useEffect(() => {
    // 如果 courseId 变为 null (例如用户退出课程)，则不执行任何操作
    if (!courseId) {
      return;
    }

    const handleCourseChange = async () => {
      // 更新本地存储中的当前课程ID
      await setLocalData(CURRENT_COURSE_ID_STORAGE_KEY, courseId);
      
      // 加载该课程的进度
      const progressKey = COURSE_PROGRESS_STORAGE_KEY(courseId);
      const storedProgress = await getLocalData(progressKey);
      
      if (storedProgress) {
        try {
          const parsedProgress = JSON.parse(storedProgress);
          if (isValidCourseProgress(parsedProgress)) {
            setCourseProgress(parsedProgress);
          } else {
            // 如果存储的进度无效，则重置为默认值
            setCourseProgress(DEFAULT_COURSE_PROGRESS);
          }
        } catch (e) {
          console.error("Failed to parse course progress, resetting.", e);
          setCourseProgress(DEFAULT_COURSE_PROGRESS);
        }
      } else {
        // 如果没有存储的进度，则使用默认值
        setCourseProgress(DEFAULT_COURSE_PROGRESS);
      }
    };

    handleCourseChange();
  }, [courseId]); // 依赖于 courseId 的变化

  // Effect 3: 处理课程进度变化的 Effect
  // 当 courseProgress 状态更新时，将其保存到本地存储。
  useEffect(() => {
    // 如果没有选定课程，或者正在初始化，则不保存进度
    if (!courseId || isLoading) return;

    const progressKey = COURSE_PROGRESS_STORAGE_KEY(courseId);
    setLocalData(progressKey, JSON.stringify(courseProgress));
  }, [courseProgress, courseId, isLoading]); // 依赖于进度的变化

  // 外部用于设置课程ID的函数
  const setCourseId = (id: SupportedLanguageCode | null) => {
    setCourseIdInternal(id);
  };

  // 5. 构建要传递给子组件的 Context 值
  const courseContextValue: CourseContextType = {
    courseId,
    setCourseId,
    courseProgress,
    setCourseProgress,
    isLoading, // 提供加载状态
    isError,   // 提供错误状态
  };

  return (
    <CourseContext.Provider value={courseContextValue}>
      {/* 直接渲染 children，让子组件自己处理加载状态 */}
      {children}
    </CourseContext.Provider>
  );
}