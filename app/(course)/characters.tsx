// import { useState } from "react";
// import { Pressable, ScrollView } from "react-native";

// import { Text, View } from "@/components/themed";
// import { layouts } from "@/constants/layouts";
// import { courseContent } from "@/content/courses/data";
// import { useBreakpoint } from "@/context/breakpoints";
// import { useCourse } from "@/context/course";
// import { useTheme } from "@/context/theme";

// export default function Characters() {
//   const { courseId } = useCourse();
//   const breakpoint = useBreakpoint();
//   const { mutedForeground, border, foreground } = useTheme();
//   const [activeIndex, setActiveIndex] = useState(0);
//   const [containerWidth, setContainerWidth] = useState(0);

//   if (!courseId) return null;

//   const characters = courseContent.characters[courseId];

//   return (
//     <View style={{ flex: 1 }}>
//       <View
//         style={{
//           flexDirection: "row",
//         }}
//       >
//         {characters.map(({ role }, index) => (
//           <Pressable
//             key={index}
//             style={{
//               flex: 1,
//               paddingBottom: layouts.padding,
//               paddingTop:
//                 breakpoint === "sm"
//                   ? layouts.padding
//                   : breakpoint === "md"
//                   ? layouts.padding * 2
//                   : layouts.padding * 3,
//               borderBottomWidth: layouts.borderWidth,
//               borderBottomColor: activeIndex === index ? foreground : border,
//             }}
//             onPress={() => (activeIndex !== index ? setActiveIndex(index) : {})}
//           >
//             <Text
//               style={{
//                 fontSize: 16,
//                 fontWeight: "bold",
//                 color: activeIndex === index ? foreground : mutedForeground,
//                 textAlign: "center",
//                 textTransform: "uppercase",
//               }}
//             >
//               {role}
//             </Text>
//           </Pressable>
//         ))}
//       </View>
//       <ScrollView
//         onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
//         contentContainerStyle={{
//           flexDirection: "row",
//           flexWrap: "wrap",
//           padding: breakpoint === "sm" ? layouts.padding : layouts.padding * 2,
//           gap: breakpoint === "sm" ? layouts.padding / 2 : layouts.padding,
//           justifyContent: "center",
//         }}
//         showsVerticalScrollIndicator={false}
//       >
//         {characters[activeIndex].dialogueItems.map((item, index) => {
//           const size =
//             breakpoint === "sm"
//               ? (containerWidth -
//                   ((layouts.padding / 2) * 4 + layouts.padding * 2)) /
//                 5
//               : (containerWidth -
//                   (layouts.padding * 4 + layouts.padding * 2.0079 * 2)) /
//                 5;

//           return (
//             <Pressable
//               key={index}
//               style={{
//                 width: size,
//                 height: size,
//                 borderWidth: layouts.borderWidth,
//                 borderColor: border,
//                 borderRadius: layouts.padding,
//                 justifyContent: "center",
//                 alignItems: "center",
//               }}
//             >
//               <Text style={{ fontSize: 24, color: mutedForeground }}>
//                 {item}
//               </Text>
//             </Pressable>
//           );
//         })}
//       </ScrollView>
//     </View>
//   );
// }
import React, { useState } from "react";
import { Pressable, View } from "react-native";

import { Text } from "@/components/themed";
import { layouts } from "@/constants/layouts";
import { useCourseContent } from "@/content/courses/data";
import { useCourse } from "@/context/course";
import { useTheme } from "@/context/theme";
import { router } from "expo-router";

export default function VocabularyPractice() {
  const { courseId } = useCourse();
  const { foreground, mutedForeground, border, accent } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const courseContent = useCourseContent();
  if (!courseContent) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>加载中...</Text>
      </View>
    );
  }

  if (!courseId) return null;

  // 取当前课程的生词列表（假设只有一个角色的词库，直接用第0个）
  const words = courseContent.characters[courseId][0].dialogueItems;

  const currentWord = words[currentIndex];

  // 点击认识或不认识，切换下一词或跳回主页
  const onAnswer = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.push("/learn"); // 跳回主页
    }
  };

  return (
    <View
      style={{
        flex: 1,
        padding: layouts.padding * 2,
        justifyContent: "flex-start",
        alignItems: "center",
        marginTop: layouts.padding * 10, // 屏幕偏上
      }}
    >
      {/* 单词显示 */}
      <Text
        style={{
          fontSize: 48,
          fontWeight: "bold",
          color: foreground,
          marginBottom: layouts.padding * 6,
        }}
      >
        {currentWord}
      </Text>

      {/* 按钮容器 */}
      <View
        style={{
          flexDirection: "row",
          gap: layouts.padding * 2,
          width: "100%",
          justifyContent: "center",
        }}
      >
        <Pressable
          onPress={onAnswer}
          style={({ pressed }) => ({
            backgroundColor: pressed ? accent : border,
            paddingVertical: layouts.padding * 1.5,
            paddingHorizontal: layouts.padding * 4,
            borderRadius: layouts.padding,
          })}
        >
          <Text style={{ color: foreground, fontWeight: "600", fontSize: 18 }}>
            认识
          </Text>
        </Pressable>
        <Pressable
          onPress={onAnswer}
          style={({ pressed }) => ({
            backgroundColor: pressed ? accent : border,
            paddingVertical: layouts.padding * 1.5,
            paddingHorizontal: layouts.padding * 4,
            borderRadius: layouts.padding,
          })}
        >
          <Text style={{ color: foreground, fontWeight: "600", fontSize: 18 }}>
            不认识
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
