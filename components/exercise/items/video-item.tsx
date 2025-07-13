// components/InteractiveVideoPlayer.tsx
import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import Parser from "srt-parser-2";
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
  onContinue: () => void;
  onResult: (success: boolean) => void;
}

interface Subtitle {
  id: string;
  startTime: string;
  endTime: string;
  text: string;
}

// 新增：单词释义组件
function WordDefinitionBox({ 
  word, 
  isVisible, 
  onClose 
}: { 
  word: string; 
  isVisible: boolean; 
  onClose: () => void; 
}) {
  if (!isVisible) return null;

  const boxStyle: React.CSSProperties = {
    position: "absolute",
    bottom: "100%",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    color: "white",
    padding: "16px 20px",
    borderRadius: 12,
    marginBottom: 16,
    minWidth: 200,
    maxWidth: 300,
    textAlign: "center",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    zIndex: 1001,
  };

  const closeButtonStyle: React.CSSProperties = {
    position: "absolute",
    top: "8px",
    right: "12px",
    background: "none",
    border: "none",
    color: "white",
    fontSize: "18px",
    cursor: "pointer",
    padding: "0",
    lineHeight: 1,
  };

  const definitionStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "8px",
    color: "#4A9EFF",
  };

  const wordStyle: React.CSSProperties = {
    fontSize: "14px",
    opacity: 0.8,
  };

  return (
    <div style={boxStyle}>
      <button 
        style={closeButtonStyle}
        onClick={onClose}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "0.7";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
      >
        ×
      </button>
      <div style={definitionStyle}>释义：{word}</div>
      <div style={wordStyle}>点击单词查看释义</div>
    </div>
  );
}

export function VideoItem({
  exercise,
  onTranslateRequest,
  containerStyle,
  videoStyle,
  subtitleStyle,
  onContinue,
  onResult,
}: Props) {
  const videoRef = useRef<Video | HTMLVideoElement>(null);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<Subtitle | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 新增：用于控制练习状态，与 TranslateItem 保持一致
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  
  // 新增：单词释义状态
  const [selectedWord, setSelectedWord] = useState<string>("");
  const [showDefinition, setShowDefinition] = useState(false);

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

  // 修改：增强的单词点击处理函数
  const handleWordPress = (word: string) => {
    const cleanedWord = word.trim().replace(/[.,!?;:"]$/, "");
    if (!cleanedWord) {
      return;
    }
    
    // 暂停视频
    if (Platform.OS === "web") {
      (videoRef.current as HTMLVideoElement)?.pause();
    } else {
      (videoRef.current as Video)?.pauseAsync();
    }
    
    // 显示单词释义
    setSelectedWord(cleanedWord);
    setShowDefinition(true);
    
    // 调用原有的翻译请求
    onTranslateRequest(cleanedWord);
  };

  // 新增：关闭释义框函数
  const handleCloseDefinition = () => {
    setShowDefinition(false);
    setSelectedWord("");
  };


  // 新增：当用户点击 "继续" 按钮时触发
  const onPressCheck = () => {
    // 重置状态
    setIsSuccess(null);
    // 关闭释义框
    handleCloseDefinition();
    
    if (Platform.OS === "web") {
      (videoRef.current as HTMLVideoElement).currentTime = 0;
    } else {
      (videoRef.current as Video)?.setPositionAsync(0);
    }
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
    const activeSubtitle = subtitles.find((sub) => {
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

  // --- Web端自定义渲染 ---
  if (Platform.OS === "web") {
    // 视频容器样式
    const videoContainerStyle: React.CSSProperties = {
      position: "relative",
      width: 800,
      maxWidth: "100%",
      height: 0,
      paddingBottom: "45%",
      backgroundColor: "black",
      borderRadius: 12,
      overflow: "hidden",
      margin: "0 auto",
    };

    // 视频样式
    const videoStyleWeb: React.CSSProperties = {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      maxWidth: "100%",
      maxHeight: "100%",
      objectFit: "contain",
      outline: "none",
    };

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
        }}
      >
        <div style={videoContainerStyle}>
          <video
            ref={videoRef as any}
            src={(exercise.video.source as any).uri}
            style={videoStyleWeb}
            controls
            onTimeUpdate={(e) => {
              const currentTimeMs =
                ((e.currentTarget as HTMLVideoElement).currentTime || 0) * 1000;
              const activeSubtitle = subtitles.find((sub) => {
                const startTimeMs = parseSrtTime(sub.startTime);
                const endTimeMs = parseSrtTime(sub.endTime);
                return currentTimeMs >= startTimeMs && currentTimeMs <= endTimeMs;
              });
              if (activeSubtitle?.id !== currentSubtitle?.id) {
                setCurrentSubtitle(activeSubtitle || null);
              }
            }}
            onEnded={() => {
              if (isSuccess === null) setIsSuccess(true);
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 60,
              left: 0,
              right: 0,
              textAlign: "center",
              padding: "0 20px",
              zIndex: 1000,
              pointerEvents: "none",
            }}
          >
            {currentSubtitle && (
              <div
                style={{
                  color: "white",
                  fontSize: 18,
                  fontWeight: "bold",
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  display: "inline-block",
                  padding: "12px 16px",
                  borderRadius: 8,
                  pointerEvents: "auto",
                }}
              >
                {currentSubtitle.text.split(" ").map((word, index) => (
                  <span
                    key={`${currentSubtitle.id}-${index}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      try {
                        handleWordPress(word);
                        console.log("✅ handleWordPress 调用完成");
                      } catch (error) {
                        console.error("❌ handleWordPress 出错:", error);
                      }
                    }}
                    style={{ 
                      cursor: "pointer", 
                      marginRight: 6,
                      padding: "4px 2px",
                      display: "inline-block",
                      borderRadius: 4,
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {word}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 新增：单词释义显示区域 */}
        <div style={{ 
          position: "relative", 
          marginTop: 20, 
          textAlign: "center",
          minHeight: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <WordDefinitionBox
            word={selectedWord}
            isVisible={showDefinition}
            onClose={handleCloseDefinition}
          />
          
          <button
            onClick={onPressCheck}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007AFF",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            Check
          </button>
        </div>
      </div>
    );
  }

  // --- React Native端渲染 ---
  return (
    <View style={{ flex: 1, justifyContent: "space-between" }}>
      <View style={[styles.container, containerStyle]}>
        <Video
          ref={videoRef as any}
          source={exercise.video.source}
          style={[styles.video, videoStyle]}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        />
        <View style={styles.subtitleContainer}>
          {currentSubtitle && (
            <Text style={[styles.subtitleText, subtitleStyle]}>
              {currentSubtitle.text.split(" ").map((word, index) => (
                <Text
                  key={`${currentSubtitle.id}-${index}`}
                  onPress={() => handleWordPress(word)}
                >
                  {word + " "}
                </Text>
              ))}
            </Text>
          )}
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      </View>
      
      {/* 新增：React Native端的单词释义显示 */}
      {showDefinition && (
        <View style={styles.definitionContainer}>
          <View style={styles.definitionBox}>
            <Text style={styles.definitionTitle}>释义：{selectedWord}</Text>
            <Text style={styles.definitionHint}>点击单词查看释义</Text>
            <Button 
              disabled={false} 
              onPress={handleCloseDefinition}
              style={styles.closeButton}
            >
              关闭
            </Button>
          </View>
        </View>
      )}
      
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
    backgroundColor: "black",
    borderRadius: 12,
    overflow: "hidden",
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  subtitleContainer: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    alignItems: "center",
    paddingBottom: 45,
  },
  subtitleText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
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
    color: "#ff4d4d",
    fontSize: 16,
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 8,
    borderRadius: 5,
  },
  // 新增：React Native端的单词释义样式
  definitionContainer: {
    padding: 16,
    alignItems: "center",
  },
  definitionBox: {
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 200,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  definitionTitle: {
    color: "#4A9EFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  definitionHint: {
    color: "white",
    fontSize: 14,
    opacity: 0.8,
    textAlign: "center",
    marginBottom: 12,
  },
  closeButton: {
    minWidth: 60,
  },
});
