// _layout.tsx (修改后)

import { useEffect } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";

import { StatusBar } from "@/components/status-bar";
import { BreakpointsProvider } from "@/context/breakpoints";
import { CourseProvider } from "@/context/course";
import { LanguageCodeProvider } from "@/context/language";
import { ProtectedRouteProvider } from "@/context/protected-route";
import { ThemeProvider } from "@/context/theme";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 导入我们新的 PreloadProvider
import { PreloadProvider } from "@/context/preload";

// 创建一个 client 实例 (仍然放在组件外部)
const queryClient = new QueryClient();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(guest)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // 移除了数据预加载的 useEffect

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  // 注意 Provider 的嵌套顺序
  return (
    <ThemeProvider>
      <BreakpointsProvider>
        <LanguageCodeProvider>
          <QueryClientProvider client={queryClient}>
            <PreloadProvider>
              <CourseProvider>
                <ProtectedRouteProvider>
                  {/* 将 PreloadProvider 放在这里 */}
                  <Stack screenOptions={{ headerShown: false }} />
                  <StatusBar />
                </ProtectedRouteProvider>
              </CourseProvider>
            </PreloadProvider>
          </QueryClientProvider>
        </LanguageCodeProvider>
      </BreakpointsProvider>
    </ThemeProvider>
  );
}