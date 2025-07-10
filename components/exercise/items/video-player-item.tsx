// components/InteractiveVideoPlayer.tsx
import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import Parser from 'srt-parser-2';

// ... Props 和类型定义 (与之前相同) ...
interface Props {
  videoSource: string;
  srtSource: string;
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

export function InteractiveVideoPlayer({
  videoSource,
  srtSource,
  onTranslateRequest,
  containerStyle,
  videoStyle,
  subtitleStyle
}: Props) {
  const videoRef = useRef<Video>(null);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<Subtitle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (srtSource) {
      const loadSubtitles = async () => {
        try {
          const parsedSubtitles = await fetchAndParseSrt(srtSource);
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
  }, [srtSource]);

  // 新的点击单词处理函数
  const handleWordPress = (word: string) => {
    const cleanedWord = word.trim().replace(/[.,!?;:"]$/, '');
    if (!cleanedWord) {
      return;
    }
    videoRef.current?.pauseAsync();
    onTranslateRequest(cleanedWord);
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded || !subtitles.length) {
      if (currentSubtitle) setCurrentSubtitle(null);
      return;
    }
    const currentTimeMs = status.positionMillis;
    const activeSubtitle = subtitles.find(sub => {
      const startTimeMs = parseSrtTime(sub.startTime);
      const endTimeMs = parseSrtTime(sub.endTime);
      return currentTimeMs >= startTimeMs && currentTimeMs <= endTimeMs;
    });
    if (activeSubtitle?.id !== currentSubtitle?.id) {
      setCurrentSubtitle(activeSubtitle || null);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Video
        ref={videoRef}
        source={{ uri: videoSource }}
        style={[styles.video, videoStyle]}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
      />

      <View style={styles.subtitleContainer}>
        {/* 这是修改后的字幕渲染逻辑 */}
        {currentSubtitle && (
          <Text style={[styles.subtitleText, subtitleStyle]}>
            {currentSubtitle.text.split(' ').map((word, index) => (
              <Text
                key={`${currentSubtitle.id}-${index}`}
                onPress={() => handleWordPress(word)}
                // 你甚至可以给可点击的单词添加一个不同的样式，以提示用户
                // style={styles.clickableWord}
              >
                {word + ' '}
              </Text>
            ))}
          </Text>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    </View>
  );
}

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

        // --- 调试代码 ---
    borderWidth: 2,
    borderColor: 'red', // 容器的边框是红色的
  },
  video: {
    ...StyleSheet.absoluteFillObject,
        // --- 调试代码 ---
    borderWidth: 2,
    borderColor: 'lime', // 视频组件的边框是绿色的
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
