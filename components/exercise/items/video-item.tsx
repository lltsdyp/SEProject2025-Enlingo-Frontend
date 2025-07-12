// components/InteractiveVideoPlayer.tsx
import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import Parser from 'srt-parser-2';
import { ExerciseItemProps, VideoExercise } from "@/types/course";
import { ExerciseItemEvent } from "./exercise-item-event";
import { Button } from "@/components/ui/button";

// ... Props 和类型定义 (与之前相同) ...
interface Props extends ExerciseItemProps {
  exercise: VideoExercise;
  onTranslateRequest: (text: string) => void;
  containerStyle?: object;
  videoStyle?: object;
  subtitleStyle?: object;
}

interface Subtitle {
  id: string;
  startTime: string;
  endTime: string;
  text: string;
}

// --- 组件实现 ---
export function VideoItem({
  exercise,
  onTranslateRequest,
  containerStyle,
  videoStyle,
  subtitleStyle,
  onContinue,
  onResult,
}: Props) {
  const videoRef = useRef<Video>(null);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<Subtitle | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 新增：用于控制练习状态，与 TranslateItem 保持一致
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

  // ---副作用 Hooks---

  // 加载字幕文件
  useEffect(() => {
    if (exercise.srt) {
      const loadSubtitles = async () => {
        try {
          const parsedSubtitles = await fetchAndParseSrt(exercise.srt);
          setSubtitles(parsedSubtitles);
          setError(null);
        } catch (err) {
          console.error("Failed to load or parse SRT file:", err);
          setError("Could not load subtitles.");
          setSubtitles([]);
        }
      };
      loadSubtitles();
    }
  }, [exercise.srt]);

  // 新增：当 isSuccess 状态改变时，调用 onResult 回调
  useEffect(() => {
    if (isSuccess !== null) {
      onResult(isSuccess);
    }
  }, [isSuccess]);


  // --- 事件处理函数 ---

  // 点击字幕单词时触发
  const handleWordPress = (word: string) => {
    const cleanedWord = word.trim().replace(/[.,!?;:"]$/, '');
    if (!cleanedWord) {
      return;
    }
    videoRef.current?.pauseAsync();
    onTranslateRequest(cleanedWord);
  };



  // 新增：当用户点击 "继续" 按钮时触发
  const onPressCheck = () => {
    // 重置状态
    setIsSuccess(null);
    // 将视频重置到开头
    videoRef.current?.setPositionAsync(0);
    // 通知父组件继续
    onContinue();
  };

  // 视频播放状态更新时触发
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (currentSubtitle) setCurrentSubtitle(null);
      return;
    }

    // 更新当前字幕
    const currentTimeMs = status.positionMillis;
    const activeSubtitle = subtitles.find(sub => {
      const startTimeMs = parseSrtTime(sub.startTime);
      const endTimeMs = parseSrtTime(sub.endTime);
      return currentTimeMs >= startTimeMs && currentTimeMs <= endTimeMs;
    });

    if (activeSubtitle?.id !== currentSubtitle?.id) {
      setCurrentSubtitle(activeSubtitle || null);
    }

    // 新增：检查视频是否播放完毕
    // 如果视频刚刚播放完，并且我们还没有设置结果，则将结果设为成功
    if (status.didJustFinish && isSuccess === null) {
      setIsSuccess(true);
    }
  };

  // --- 渲染逻辑 ---

  return (
    // 使用与 TranslateItem 相同的布局结构，以确保 UI 一致性
    <View style={{ flex: 1, justifyContent: 'space-between' }}>
      <View style={[styles.container, containerStyle]}>
        <Video
          ref={videoRef}
          source={{ uri: exercise.video.source.toString() }}
          style={[styles.video, videoStyle]}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        />
        <View style={styles.subtitleContainer}>
          {currentSubtitle && (
            <Text style={[styles.subtitleText, subtitleStyle]}>
              {currentSubtitle.text.split(' ').map((word, index) => (
                <Text
                  key={`${currentSubtitle.id}-${index}`}
                  onPress={() => handleWordPress(word)}
                >
                  {word + ' '}
                </Text>
              ))}
            </Text>
          )}
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      </View>

      {/* 
        统一的事件处理组件。
        因为此练习没有手动“检查”按钮，所以我们不传递 onPressCheck。
        当 isSuccess 不为 null 时，它会自动显示结果和“继续”按钮。
      */}
        <Button disabled={false} onPress={onPressCheck}>
          Check
        </Button>
    </View>
  );
}


// export function VideoExercise;

// ------------------- 工具函数 -------------------

/**
 * 从 URL 获取并解析 SRT 字幕文件。
 * @param {string} url - SRT 文件的 URL.
 * @returns {Promise<Subtitle[]>} - 解析后的字幕对象数组。
 */
async function fetchAndParseSrt(url: string): Promise<Subtitle[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch SRT file: ${response.statusText}`);
  }
  const srtContent = await response.text();
  const parser = new Parser();
  return parser.fromSrt(srtContent);
}

/**
 * 将 SRT 的时间字符串 'HH:mm:ss,SSS' 转换为毫秒。
 * @param {string} time - SRT 格式的时间字符串。
 * @returns {number} - 对应的毫秒数。
 */
function parseSrtTime(time: string): number {
  const parts = time.split(/[:,]/);
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(parts[2], 10);
  const milliseconds = parseInt(parts[3], 10);

  return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
}


// ------------------- 样式表 -------------------

const styles = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: 'black',
    borderRadius: 12, // 添加圆角以匹配你的设计
    overflow: 'hidden', // 确保子元素不会超出圆角边界
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  subtitleContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    alignItems: 'center',
    paddingBottom: 45, // 为原生控件留出更多空间
  },
  subtitleText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clickableWord: {
    // 我们可以给可点击的单词加上下划线，让用户知道这里可以点击
    // textDecorationLine: 'underline',
    // 也可以改变颜色，例如：
    // color: '#a0e0ff', 
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
    borderRadius: 5,
  }
});
