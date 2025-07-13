import React, { createContext, useContext, useEffect, useState } from "react";
import { Dimensions } from "react-native"; // 保持顶层导入

import { isWeb } from "@/lib/utils";

type Breakpoints = "sm" | "md" | "lg" | "xl" | "2xl";

const BreakpointsContext = createContext<Breakpoints | undefined>(undefined);

export function useBreakpoint() {
  const context = useContext(BreakpointsContext);
  if (!context) {
    throw new Error("useBreakpoint must be used within a BreakpointsProvider");
  }
  return context;
}

interface Props {
  children: React.ReactNode;
}

function useDevice() {
  const breakpoints = [
    { name: "sm", maxWidth: 640 },
    { name: "md", maxWidth: 768 },
    { name: "lg", maxWidth: 1024 },
    { name: "xl", maxWidth: 1280 },
    { name: "2xl", maxWidth: 1536 },
  ] as const; // 使用 as const 获得更强的类型推断

  const getActiveBreakpoint = () => {
    const screenWidth = isWeb()
      ? window.innerWidth
      : Dimensions.get("window").width;

    // find 返回的可能是 undefined，所以需要一个默认值
    const matchingBreakpoint = breakpoints.find(
      (breakpoint) => screenWidth <= breakpoint.maxWidth
    );
    return matchingBreakpoint
      ? matchingBreakpoint.name
      : breakpoints[breakpoints.length - 1].name;
  };

  const [activeBreakpoint, setActiveBreakpoint] = useState<Breakpoints>(
    getActiveBreakpoint()
  );

  useEffect(() => {
    const handleResize = () => {
      setActiveBreakpoint(getActiveBreakpoint());
    };

    if (isWeb()) {
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    } else {
      // --- 这是关键的修改 ---
      // 1. 使用 addEventListener 返回的订阅对象
      const subscription = Dimensions.addEventListener("change", handleResize);
      
      // 2. 在清理函数中调用 .remove() 方法
      return () => {
        subscription.remove();
      };
      // ----------------------
    }
  }, []); // 依赖项数组应该为空，以确保监听器只在挂载时添加一次

  return activeBreakpoint;
}

export function BreakpointsProvider({ children }: Props) {
  const breakpoint = useDevice();

  return (
    <BreakpointsContext.Provider value={breakpoint}>
      {children}
    </BreakpointsContext.Provider>
  );
}