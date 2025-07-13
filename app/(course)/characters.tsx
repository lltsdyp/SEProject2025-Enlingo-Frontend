import React, { useState } from "react";
import { Pressable, View, Animated, Dimensions } from "react-native";

import { Text } from "@/components/themed";
import { layouts } from "@/constants/layouts";
import { useCourseContent } from "@/content/courses/data";
import { useCourse } from "@/context/course";
import { useTheme } from "@/context/theme";
import { router } from "expo-router";

const { width } = Dimensions.get('window');

export default function VocabularyPractice() {
  const { courseId } = useCourse();
  const { foreground, mutedForeground, border, accent, background } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(1));
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
  const progress = ((currentIndex + 1) / words.length) * 100;

  // 点击认识或不认识，切换下一词或跳回主页
  const onAnswer = (isKnown: boolean) => {
    // 这里可以根据isKnown的值做不同的处理，比如记录学习数据
    // console.log(`Word: ${currentWord}, Known: ${isKnown}`);
    
    // 添加按钮点击动画
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // 添加滑动切换动画
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1);
        slideAnim.setValue(0);
      } else {
        router.push("/learn"); // 跳回主页
      }
    });
  };

  const slideTransform = {
    transform: [
      {
        translateX: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -width],
        }),
      },
    ],
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: background,
      }}
    >
      {/* 顶部进度条 */}
      <View
        style={{
          marginTop: layouts.padding * 6,
          marginHorizontal: layouts.padding * 2,
          height: 4,
          backgroundColor: border,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: accent,
            borderRadius: 2,
          }}
        />
      </View>

      {/* 进度文本 */}
      <Text
        style={{
          textAlign: 'center',
          color: mutedForeground,
          fontSize: 14,
          marginTop: layouts.padding,
          marginBottom: layouts.padding * 4,
        }}
      >
        {currentIndex + 1} / {words.length}
      </Text>

      {/* 主要内容区域 */}
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: layouts.padding * 2,
        }}
      >
        {/* 单词卡片 */}
        <Animated.View
          style={[
            {
              backgroundColor: background,
              borderRadius: layouts.padding * 2,
              paddingVertical: layouts.padding * 4,
              paddingHorizontal: layouts.padding * 3,
              marginBottom: layouts.padding * 6,
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 8,
              },
              shadowOpacity: 0.1,
              shadowRadius: 20,
              elevation: 10,
              borderWidth: 1,
              borderColor: border,
              minWidth: width * 0.3,
              maxWidth: width * 0.5,
              alignItems: 'center',
            },
            slideTransform,
          ]}
        >
          <Text
            style={{
              fontSize: width > 768 ? 36 : 28,
              fontWeight: 'bold',
              color: foreground,
              textAlign: 'center',
              letterSpacing: 0.5,
            }}
          >
            {currentWord}
          </Text>
        </Animated.View>

        {/* 按钮容器 */}

    <Animated.View
    style={[
      {
        flexDirection: 'row',
        gap: layouts.padding * 2,
        width: '100%',
        justifyContent: 'center',
        paddingHorizontal: layouts.padding * 2,
        alignItems: 'center',
      },
      { transform: [{ scale: scaleAnim }] },
    ]}
    >
    {/* 不认识按钮 */}
    <Pressable
      onPress={() => onAnswer(false)}
      style={({ pressed }) => ({
        backgroundColor: pressed ? '#ef4444' : '#fef2f2',
        paddingVertical: layouts.padding * 1.5,
        paddingHorizontal: layouts.padding * 3,
        borderRadius: layouts.padding,
        flex: 1,
        maxWidth: 160,
        minHeight: 48, // 👈 强制等高
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: pressed ? 0.3 : 0.1,
        shadowRadius: 8,
        elevation: pressed ? 8 : 4,
        borderWidth: 1,
        borderColor: pressed ? '#ef4444' : '#fecaca',
        transform: [{ scale: pressed ? 0.98 : 1 }],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6, // 👈 emoji 和文字之间的距离
      })}
    >
      <Text
        style={{
          color: '#dc2626',
          fontWeight: '700',
          fontSize: width > 768 ? 16 : 9,
          textAlign: 'center',
        }}
      >
        
      </Text>
      <Text
        style={{
          color: '#dc2626',
          fontWeight: '700',
          fontSize: width > 768 ? 16 : 8,
          textAlign: 'center',
        }}
      >
        不认识
      </Text>
    </Pressable>

    {/* 认识按钮 */}
    <Pressable
      onPress={() => onAnswer(true)}
      style={({ pressed }) => ({
        backgroundColor: pressed ? '#22c55e' : '#f0fdf4',
        paddingVertical: layouts.padding * 1.5,
        paddingHorizontal: layouts.padding * 3,
        borderRadius: layouts.padding,
        flex: 1,
        maxWidth: 140,
        minHeight: 48, // 👈 强制等高
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: pressed ? 0.3 : 0.1,
        shadowRadius: 8,
        elevation: pressed ? 8 : 4,
        borderWidth: 1,
        borderColor: pressed ? '#22c55e' : '#bbf7d0',
        transform: [{ scale: pressed ? 0.98 : 1 }],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      })}
    >
      <Text
        style={{
          color: '#16a34a',
          fontWeight: '700',
          fontSize: width > 768 ? 16 : 9,
          textAlign: 'center',
        }}
      >
        
      </Text>
      <Text
        style={{
          color: '#16a34a',
          fontWeight: '700',
          fontSize: width > 768 ? 16 : 8,
          textAlign: 'center',
        }}
      >
        认识
      </Text>
    </Pressable>
    </Animated.View>

        {/* 底部提示文本 */}
        <Text
          style={{
            textAlign: 'center',
            color: mutedForeground,
            fontSize: 14,
            marginTop: layouts.padding * 4,
            fontStyle: 'italic',
          }}
        >
          诚实地选择你的熟悉程度
        </Text>
      </View>
    </View>
  );
}