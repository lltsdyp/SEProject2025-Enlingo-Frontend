import { ThemeColors } from "@/types";

export const themeColors: ThemeColors = {
  light: {
    background: "rgb(245, 250, 255)",            // 极浅蓝，接近白色，清爽底色
    foreground: "rgb(30, 60, 90)",                // 比较浅的深蓝文字，柔和不刺眼
    primary: "rgb(64, 145, 255)",                  // 亮蓝色，现代感强，视觉冲击适中
    primaryForeground: "rgb(255, 255, 255)",      // 白色字，和primary对比明显
    secondary: "rgb(220, 235, 255)",               // 浅蓝灰，卡片和区域背景
    secondaryForeground: "rgb(50, 90, 150)",      // 中蓝色文字，和secondary搭配好看
    muted: "rgb(230, 240, 255)",                   // 非常浅的蓝灰，轻微衬托
    mutedForeground: "rgb(130, 150, 180)",        // 柔和中蓝灰文字
    accent: "rgb(79, 195, 255)",                   // 明亮蓝色，强调用色更鲜活
    accentForeground: "rgb(255, 255, 255)",       // 白字
    destructive: "rgb(255, 210, 210)",             // 柔和粉红，警告背景
    destructiveForeground: "rgb(200, 50, 50)",    // 红色警告字
    sucess: "rgb(200, 245, 165)",                   // 浅绿成功背景
    sucessForeground: "rgb(80, 160, 20)",          // 深绿字
    border: "rgb(190, 210, 240)",                  // 浅蓝边框，细致柔和
  },
  dark: {
    background: "rgb(10, 10, 10)",
    foreground: "rgb(250, 250, 250)",
    primary: "rgb(250, 250, 250)",
    primaryForeground: "rgb(23, 23, 23)",
    secondary: "rgb(38, 38, 38)",
    secondaryForeground: "rgb(250, 250, 250)",
    muted: "rgb(38, 38, 38)",
    mutedForeground: "rgb(163, 163, 163)",
    accent: "rgb(38, 38, 38)",
    accentForeground: "rgb(250, 250, 250)",
    destructive: "rgb(255,223, 224)",
    destructiveForeground: "rgb(225, 75, 75)",
    sucess: "rgb(215, 255, 184)",
    sucessForeground: "rgb(88, 204, 2)",
    border: "rgb(38, 38, 38)",
  },
};


export const colors = {
  transparent: "rgba(0, 0, 0, 0)",
};
