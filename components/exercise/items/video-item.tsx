// components/InteractiveVideoPlayer.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import Parser from "srt-parser-2";
import { ExerciseItemProps, VideoExercise } from "@/types/course";
import { ExerciseItemEvent } from "./exercise-item-event";
import { Button } from "@/components/ui/button";
import { contentApiClient } from "@/api";

// Props 和类型定义
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

// 翻译状态接口
interface TranslationState {
  word: string;
  translation: string;
  isLoading: boolean;
  error: string | null;
}

// 单词释义组件
function WordDefinitionBox({ 
  translationState,
  isVisible, 
  onClose 
}: { 
  translationState: TranslationState;
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

  const wordStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "8px",
    color: "#4A9EFF",
  };

  const translationStyle: React.CSSProperties = {
    fontSize: "14px",
    opacity: 0.9,
    lineHeight: 1.4,
  };

  const loadingStyle: React.CSSProperties = {
    fontSize: "14px",
    opacity: 0.7,
    fontStyle: "italic",
  };

  const errorStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "#FF6B6B",
    opacity: 0.9,
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
      <div style={wordStyle}>{translationState.word}</div>
      {translationState.isLoading && (
        <div style={loadingStyle}>正在翻译...</div>
      )}
      {translationState.error && (
        <div style={errorStyle}>{translationState.error}</div>
      )}
      {!translationState.isLoading && !translationState.error && translationState.translation && (
        <div style={translationStyle}>{translationState.translation}</div>
      )}
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

  // 用于控制练习状态
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  
  // 翻译相关状态
  const [translationState, setTranslationState] = useState<TranslationState>({
    word: "",
    translation: "",
    isLoading: false,
    error: null,
  });
  const [showDefinition, setShowDefinition] = useState(false);

  // 翻译API调用函数
  const fetchTranslation = useCallback(async (word: string) => {
    setTranslationState(prev => ({
      ...prev,
      word,
      isLoading: true,
      error: null,
      translation: "",
    }));

    try {
      console.log("🔄 开始获取单词翻译...", { word });
      const response = await contentApiClient.wordlistTranslateGet(word);
      console.log("✅ 翻译API响应成功:", {
        status: response.status,
        simple_trans: response.data?.simple_trans,
      });

      setTranslationState(prev => ({
        ...prev,
        translation: response.data?.simple_trans || "暂无翻译",
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "翻译失败";
      console.error("❌ 获取翻译失败:", message, error);
      setTranslationState(prev => ({
        ...prev,
        error: "获取翻译失败",
        isLoading: false,
      }));
    }
  }, []);

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

  // 当 isSuccess 状态改变时，调用 onResult 回调
  useEffect(() => {
    if (isSuccess !== null) {
      onResult(isSuccess);
    }
  }, [isSuccess]);

  // 增强的单词点击处理函数
  const handleWordPress = useCallback(async (word: string) => {
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
    
    // 显示释义框
    setShowDefinition(true);
    
    // 调用原有的翻译请求（保持兼容性）
    onTranslateRequest(cleanedWord);
    
    // 调用新的翻译API
    await fetchTranslation(cleanedWord);
  }, [fetchTranslation, onTranslateRequest]);

  // 关闭释义框函数
  const handleCloseDefinition = useCallback(() => {
    setShowDefinition(false);
    setTranslationState({
      word: "",
      translation: "",
      isLoading: false,
      error: null,
    });
  }, []);

  // 当用户点击 "继续" 按钮时触发
  const onPressCheck = useCallback(() => {
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
  }, [handleCloseDefinition, onContinue]);

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

    // 检查视频是否播放完毕
    if (status.didJustFinish && isSuccess === null) {
      setIsSuccess(true);
    }
  };

  // --- Web端自定义渲染 ---
  if (Platform.OS === "web") {
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
                      handleWordPress(word);
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

        {/* 单词释义显示区域 */}
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
            translationState={translationState}
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
            Continue
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
      
      {/* React Native端的单词释义显示 */}
      {showDefinition && (
        <View style={styles.definitionContainer}>
          <View style={styles.definitionBox}>
            <Text style={styles.definitionWord}>{translationState.word}</Text>
            {translationState.isLoading && (
              <Text style={styles.loadingText}>正在翻译...</Text>
            )}
            {translationState.error && (
              <Text style={styles.errorDefinitionText}>{translationState.error}</Text>
            )}
            {!translationState.isLoading && !translationState.error && translationState.translation && (
              <Text style={styles.definitionText}>{translationState.translation}</Text>
            )}
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

// ------------------- 工具函数 -------------------

async function fetchAndParseSrt(url: string): Promise<Subtitle[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch SRT file: ${response.statusText}`);
  }
  const srtContent = await response.text();
  const parser = new Parser();
  return parser.fromSrt(srtContent);
}

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
  errorText: {
    color: "#ff4d4d",
    fontSize: 16,
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 8,
    borderRadius: 5,
  },
  // React Native端的单词释义样式
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
  definitionWord: {
    color: "#4A9EFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  definitionText: {
    color: "white",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 20,
  },
  loadingText: {
    color: "white",
    fontSize: 14,
    opacity: 0.7,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 12,
  },
  errorDefinitionText: {
    color: "#FF6B6B",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  closeButton: {
    minWidth: 60,
  },
});