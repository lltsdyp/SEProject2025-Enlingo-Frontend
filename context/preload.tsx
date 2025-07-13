// src/context/PreloadProvider.tsx

import { useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSections } from "@/api";
import { useLanguageCode } from "./language"; // 假设你导出了一个 useLanguageCode hook

interface PreloadProviderProps {
  children: ReactNode;
}

/**
 * 这个 Provider 不提供任何 context value，
 * 它的唯一目的是在应用启动时触发数据预加载的副作用。
 */
export function PreloadProvider({ children }: PreloadProviderProps) {
  const queryClient = useQueryClient();
  const { languageCode } = useLanguageCode(); // 动态获取语言

  useEffect(() => {
    async function preloadAllData() {
      // 确保我们有语言代码后再加载
      if (!languageCode) {
        return;
      }
      
      try {
        console.log(`[PreloadProvider] 开始预加载数据，语言: ${languageCode}`);

        // 使用 queryClient.prefetchQuery，它和 fetchQuery 类似，
        // 但如果数据已存在，它不会像 fetchQuery 那样重新获取（除非数据已失效）。
        // 这对于预加载场景更合适。
        await queryClient.prefetchQuery({
          queryKey: ['sections', languageCode],
          queryFn: () => getSections(languageCode),
        });

        console.log(`[PreloadProvider] Sections (语言: ${languageCode}) 预加载完成.`);
      } catch (e: any) {
        console.error("[PreloadProvider] 数据预加载失败:", e);
      }
    }

    preloadAllData();

    // 依赖项是 languageCode，当语言切换时，会自动重新预加载新语言的数据
  }, [languageCode, queryClient]);

  // 这个 Provider 只是一个逻辑包装器，直接渲染子组件
  return <>{children}</>;
}