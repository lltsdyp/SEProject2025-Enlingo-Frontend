import React, {
  useState,
  useEffect,
  useCallback,
  useReducer,
  useMemo,
} from "react";
import {
  Pressable,
  View,
  Animated,
  Dimensions,
  StyleSheet,
  Text as RNText,
} from "react-native";
import { Text } from "@/components/themed";
import { layouts } from "@/constants/layouts";
import { useCourse } from "@/context/course";
import { useTheme } from "@/context/theme";
import { router } from "expo-router";
import { contentApiClient } from "@/api";

// =========================
// 🔧 类型定义
// =========================
interface WordState {
  words: string[];
  currentIndex: number;
  hasNextPage: boolean;
  nextWord: string | null;
  loading: boolean;
  error: string | null;
  retryCount: number;
  isLoadingMore: boolean;
  completedRounds: number;
  showRestartDialog: boolean;
  allWordsLoaded: boolean;
  isDeleting: boolean;
}
type WordAction =
  | { type: "FETCH_START"; initial?: boolean }
  | { type: "FETCH_SUCCESS"; data: { list: string[]; hasNextPage: boolean; nextWord: string | null }; append: boolean }
  | { type: "FETCH_FAILURE"; error: string }
  | { type: "DELETE_WORD"; word: string }
  | { type: "NEXT_WORD" }
  | { type: "RESTART_REVIEW" }
  | { type: "SHOW_RESTART_DIALOG" }
  | { type: "HIDE_RESTART_DIALOG" };

const initialState: WordState = {
  words: [],
  currentIndex: 0,
  hasNextPage: true,
  nextWord: null,
  loading: true,
  error: null,
  retryCount: 0,
  isLoadingMore: false,
  completedRounds: 0,
  showRestartDialog: false,
  allWordsLoaded: false,
  isDeleting: false,
};

function wordReducer(state: WordState, action: WordAction): WordState {
  switch (action.type) {
    case "FETCH_START":
      return {
        ...state,
        loading: action.initial !== false ? true : state.loading,
        isLoadingMore: true,
        error: null,
      };
    case "FETCH_SUCCESS":
      const newWords = action.append ? [...state.words, ...action.data.list] : action.data.list;
      const allLoaded = !action.data.hasNextPage;
      return {
        ...state,
        words: newWords,
        hasNextPage: action.data.hasNextPage,
        nextWord: action.data.nextWord,
        loading: false,
        isLoadingMore: false,
        retryCount: 0,
        allWordsLoaded: allLoaded,
      };
    case "FETCH_FAILURE":
      return {
        ...state,
        loading: false,
        isLoadingMore: false,
        error: action.error,
        retryCount: state.retryCount + 1,
      };
    case "DELETE_WORD":
      return {
        ...state,
        words: state.words.filter((w) => w !== action.word),
      };
    case "NEXT_WORD":
      return {
        ...state,
        currentIndex: Math.min(state.currentIndex + 1, state.words.length - 1),
      };
    case "RESTART_REVIEW":
      return {
        ...state,
        currentIndex: 0,
        completedRounds: state.completedRounds + 1,
        showRestartDialog: false,
      };
    case "SHOW_RESTART_DIALOG":
      return { ...state, showRestartDialog: true };
    case "HIDE_RESTART_DIALOG":
      return { ...state, showRestartDialog: false };
    default:
      return state;
  }
}

// =========================
// 🎣 自定义 Hook：获取生词列表
// =========================
function useFetchWords(
  courseId: string | null,
  dispatch: React.Dispatch<WordAction>
) {
  const fetchWords = useCallback(
    async (before?: string, append = false) => {
      dispatch({ type: "FETCH_START", initial: !append });
      try {
        console.log("🔄 开始获取生词列表...", { before, append });
        const response = await contentApiClient.wordlistGetGet(2, before || undefined);
        console.log("✅ API 响应成功:", {
          status: response.status,
          count: response.data?.list?.length,
          hasNextPage: response.data?.hasNextPage,
        });
        dispatch({
          type: "FETCH_SUCCESS",
          data: {
            list: response.data.list || [],
            hasNextPage: response.data.hasNextPage,
            nextWord: response.data.nextWord ?? null,
          },
          append,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "网络错误";
        console.error("❌ 获取失败:", message, error);
        dispatch({ type: "FETCH_FAILURE", error: message });
      }
    },
    [dispatch]
  );
  return fetchWords;
}

// =========================
// 🖼️ 动画控制器
// =========================
function useCardAnimation() {
  const slideAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(1);
  const animateSlideOut = useCallback((callback: () => void) => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(callback);
  }, [slideAnim]);
  const resetSlide = useCallback(() => {
    slideAnim.setValue(0);
  }, [slideAnim]);
  const animateButtonPress = useCallback(() => {
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
  }, [scaleAnim]);
  const slideStyle = useMemo(
    () => ({
      transform: [
        {
          translateX: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -Dimensions.get("window").width],
          }),
        },
      ],
    }),
    [slideAnim]
  );
  return {
    slideAnim,
    scaleAnim,
    animateSlideOut,
    resetSlide,
    animateButtonPress,
    slideStyle,
  };
}

// =========================
// 🧱 子组件：顶部进度条
// =========================
const ProgressBar = React.memo<{
  progress: number;
  rounds: number;
}>(({ progress, rounds }) => {
  const { border, accent, mutedForeground } = useTheme();
  return (
    <View style={styles.progressContainer}>
      <View style={[styles.progressBarBg, { borderColor: border }]}>
        <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: accent }]} />
      </View>
      <Text style={[styles.progressText, { color: mutedForeground }]}>
        {Math.floor(progress)}%
      </Text>
      {rounds > 0 && (
        <Text style={[styles.roundText, { color: accent }]}>
          第 {rounds + 1} 轮复习
        </Text>
      )}
    </View>
  );
});

// =========================
// 🧱 子组件：单词卡片
// =========================
const WordCard = React.memo<{
  word: string;
  animationStyle: any;
}>(({ word, animationStyle }) => {
  const { foreground, background, border } = useTheme();
  const fontSize = Dimensions.get("window").width > 768 ? 36 : 28;
  return (
    <Animated.View style={[styles.card, { borderColor: border, backgroundColor: background }, animationStyle]}>
      <RNText style={[styles.wordText, { color: foreground, fontSize }]}>
        {word}
      </RNText>
    </Animated.View>
  );
});

// =========================
// 🧱 子组件：操作按钮组
// =========================
const ActionButtons = React.memo<{
  onAnswer: (known: boolean) => void;
  disabled: boolean;
  scaleAnim: Animated.Value;
}>(({ onAnswer, disabled, scaleAnim }) => {
  const { accent, border, mutedForeground } = useTheme();
  const buttonScale = scaleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.95] });
  return (
    <Animated.View style={[styles.buttonGroup, { transform: [{ scale: buttonScale }] }]}>
      {/* 不认识 */}
      <Pressable
        onPress={() => onAnswer(false)}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          styles.unknownButton,
          pressed && styles.pressedUnknown,
          disabled && styles.disabledButton,
        ]}
      >
        <Text style={styles.unknownText}>遗忘</Text>
      </Pressable>
      {/* 认识 */}
      <Pressable
        onPress={() => onAnswer(true)}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          styles.knownButton,
          pressed && styles.pressedKnown,
          disabled && styles.disabledButton,
        ]}
      >
        <Text style={styles.knownText}>{disabled ? "处理中..." : "认识"}</Text>
      </Pressable>
    </Animated.View>
  );
});

// =========================
// 🧱 子组件：重新开始对话框 (修复版)
// =========================
const RestartDialog = React.memo<{
  visible: boolean;
  totalCount: number;
  completedRounds: number;
  onReturn: () => void;
  onRestart: () => void;
}>(({ visible, totalCount, completedRounds, onReturn, onRestart }) => {
  const { background, foreground, mutedForeground, accent, border } = useTheme();

  // 使用 useState 和 useEffect 来监听屏幕尺寸变化
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const onChange = ({ window }: { window: { width: number; height: number } }) => {
      setScreenWidth(window.width);
    };

    const subscription = Dimensions.addEventListener('change', onChange);
    
    // 清理函数
    return () => {
      subscription.remove();
    };
  }, []);

  if (!visible) return null;

  // 根据当前屏幕宽度计算样式
  const isLargeScreen = screenWidth > 768;
  const titleSize = isLargeScreen ? 20 : 16;
  const bodySize = isLargeScreen ? 16 : 14;
  const smallSize = isLargeScreen ? 14 : 12;
  const btnTextSize = isLargeScreen ? 14 : 13;
  const padding = layouts.padding;
  const gap = isLargeScreen ? padding : padding * 0.8;
  const btnPaddingVertical = padding * 1.2;
  const btnPaddingHorizontal = padding * 1.5;

  return (
    <View style={styles.dialogOverlay}>
      <View style={styles.dialogContainer}>
        <View style={[styles.dialogBox, { backgroundColor: background, borderColor: border }]}>
          <Text style={[styles.dialogTitle, { color: foreground, fontSize: titleSize, marginBottom: padding * 1.2 }]}>
            🎉 恭喜完成复习！
          </Text>
          <Text style={[styles.dialogBody, { color: foreground, fontSize: bodySize, marginBottom: padding * 0.8 }]}>
            你已经完成了所有 {totalCount} 个单词的复习
          </Text>
          {completedRounds > 0 && (
            <Text style={[styles.dialogSmall, { color: mutedForeground, fontSize: smallSize, marginBottom: padding * 0.6 }]}>
              这是第 {completedRounds + 1} 轮复习
            </Text>
          )}
          <Text style={[styles.dialogSmall, { color: mutedForeground, fontSize: smallSize, marginBottom: padding * 1.2 }]}>
            继续练习还是回到学习页面？
          </Text>
          <View style={[styles.buttonRow, { gap, marginTop: padding * 1.2 }]}>
            <Pressable
              onPress={onReturn}
              style={({ pressed }) => [
                styles.smallBtn,
                { paddingVertical: btnPaddingVertical, paddingHorizontal: btnPaddingHorizontal },
                pressed && styles.smallBtnPressed
              ]}
            >
              <Text style={[styles.smallBtnText, { color: mutedForeground, fontSize: btnTextSize }]}>返回学习</Text>
            </Pressable>
            <Pressable
              onPress={onRestart}
              style={({ pressed }) => [
                styles.primaryBtn,
                { paddingVertical: btnPaddingVertical, paddingHorizontal: btnPaddingHorizontal },
                pressed && styles.primaryBtnPressed
              ]}
            >
              <Text style={[styles.primaryBtnText, { fontSize: btnTextSize }]}>再来一轮</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
});

// =========================
// 🧩 主组件
// =========================
export default function VocabularyPractice() {
  const { courseId } = useCourse();
  const { foreground, mutedForeground, border, accent, background } = useTheme();
  const [state, dispatch] = useReducer(wordReducer, initialState);
  const fetchWords = useFetchWords(courseId, dispatch);
  const { slideAnim, scaleAnim, animateSlideOut, resetSlide, animateButtonPress, slideStyle } = useCardAnimation();
  const { words, currentIndex, hasNextPage, nextWord, loading, error, retryCount, isLoadingMore, completedRounds, showRestartDialog, allWordsLoaded, isDeleting } = state;

  // 初始加载
  useEffect(() => {
    console.log("🚀 初始化词汇练习组件");
    fetchWords();
  }, [fetchWords]);

  // 自动重试机制
  useEffect(() => {
    if (error && retryCount < 3) {
      const timer = setTimeout(() => {
        console.log(`🔁 第 ${retryCount} 次自动重试`);
        fetchWords();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, retryCount, fetchWords]);

  // 预加载下一批单词
  useEffect(() => {
    if (
      words.length > 0 &&
      currentIndex >= words.length - 5 &&
      hasNextPage &&
      !isLoadingMore &&
      nextWord
    ) {
      fetchWords(nextWord, true);
    }
  }, [currentIndex, words.length, hasNextPage, nextWord, isLoadingMore, fetchWords]);

  // 删除后索引越界修正
  useEffect(() => {
    if (words.length <= currentIndex && words.length > 0) {
      dispatch({ type: "NEXT_WORD" });
    }
  }, [words.length, currentIndex]);

  // 处理回答
  const handleAnswer = useCallback(
    (isKnown: boolean) => {
      animateButtonPress();
      if (isKnown && currentIndex < words.length && !isDeleting) {
        const wordToDelete = words[currentIndex];
        console.log("🗑️ 删除单词:", wordToDelete);
        contentApiClient.wordlistDeletePost(wordToDelete).catch(console.error);
        dispatch({ type: "DELETE_WORD", word: wordToDelete });
      }
      animateSlideOut(() => {
        const remaining = words.filter((_, i) => i !== currentIndex);
        if (currentIndex < remaining.length - 1) {
          dispatch({ type: "NEXT_WORD" });
          resetSlide();
        } else {
          if (hasNextPage && nextWord && !allWordsLoaded) {
            fetchWords(nextWord, true).then(() => {
              dispatch({ type: "NEXT_WORD" });
              resetSlide();
            });
          } else {
            dispatch({ type: "SHOW_RESTART_DIALOG" });
          }
        }
      });
    },
    [
      animateSlideOut,
      animateButtonPress,
      resetSlide,
      currentIndex,
      words,
      hasNextPage,
      nextWord,
      allWordsLoaded,
      fetchWords,
      isDeleting,
    ]
  );

  const restartReview = useCallback(() => {
    console.log("🔁 用户选择重新开始复习");
    dispatch({ type: "RESTART_REVIEW" });
    resetSlide();
  }, [dispatch, resetSlide]);

  const manualRetry = useCallback(() => {
    console.log("🔄 用户手动重试");
    fetchWords();
  }, [fetchWords]);

  const progress = ((currentIndex + 1) / Math.max(words.length, 1)) * 100;

  // =========================
  // 🖨️ 渲染逻辑
  // =========================
  if (loading && words.length === 0) {
    return (
      <View style={[styles.flexCenter, { backgroundColor: background }]}>
        <Text style={{ color: foreground }}>加载中...</Text>
        {retryCount > 0 && (
          <Text style={[styles.smallText, { color: mutedForeground }]}>
            重试中... ({retryCount}/3)
          </Text>
        )}
      </View>
    );
  }

  if (error && words.length === 0) {
    return (
      <View style={[styles.flexCenter, styles.errorContainer, { backgroundColor: background }]}>
        <Text style={{ color: foreground, textAlign: 'center' }}>加载失败</Text>
        <Text style={[styles.smallText, { color: mutedForeground, marginVertical: 12 }]}>{error}</Text>
        <Pressable onPress={manualRetry} style={({ pressed }) => [styles.retryBtn, pressed && styles.pressedBtn]}>
          <Text style={{ color: foreground, fontWeight: '600' }}>
            {retryCount < 3 ? '手动重试' : '重新尝试'}
          </Text>
        </Pressable>
        <Text style={[styles.smallText, { color: mutedForeground, marginTop: 8 }]}>
          {retryCount < 3 ? `自动重试中... (${retryCount}/3)` : '已达到最大重试次数'}
        </Text>
      </View>
    );
  }

  if (words.length === 0) {
    return (
      <View style={styles.flexCenter}>
        <Text style={{ color: foreground, marginBottom: 16 }}>暂无生词数据</Text>
        <Pressable onPress={manualRetry} style={({ pressed }) => [styles.retryBtn, pressed && styles.pressedBtn]}>
          <Text style={{ color: foreground, fontWeight: '600' }}>刷新</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      {/* 进度条 */}
      <ProgressBar progress={progress} rounds={completedRounds} />
      {/* 主体内容 */}
      <View style={styles.content}>
        <WordCard word={words[currentIndex]} animationStyle={slideStyle} />
        <ActionButtons onAnswer={handleAnswer} disabled={isDeleting} scaleAnim={scaleAnim} />
        <Text style={[styles.tip, { color: mutedForeground }]}>诚实地选择你的熟悉程度</Text>
        <Text style={[styles.subTip, { color: mutedForeground }]}>选择"认识"将从生词本中移除该单词</Text>
        {isLoadingMore && <Text style={[styles.subTip, { color: mutedForeground }]}>正在加载更多单词...</Text>}
      </View>
      {/* 重启对话框 */}
      <RestartDialog
        visible={showRestartDialog}
        totalCount={words.length}
        completedRounds={completedRounds}
        onReturn={() => router.push("/learn")}
        onRestart={restartReview}
      />
    </View>
  );
}

// =========================
// 🎨 样式表 (简化版)
// =========================
// 移除了所有在 StyleSheet.create 中的动态值（如 Dimensions.get），仅保留基础结构和固定值。
// 所有依赖尺寸的样式都已移到 RestartDialog 组件内部作为内联样式。
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flexCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: layouts.padding * 2,
  },
  errorContainer: {
    padding: 20,
  },
  progressContainer: {
    marginTop: layouts.padding * 6,
    marginHorizontal: layouts.padding * 2,
    alignItems: "center",
  },
  progressBarBg: {
    height: 4,
    width: "100%",
    backgroundColor: "transparent",
    borderWidth: 0.5,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    marginTop: 4,
  },
  roundText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: layouts.padding * 2,
    marginTop: layouts.padding * 2,
  },
  card: {
    borderRadius: layouts.padding * 2,
    paddingVertical: layouts.padding * 4,
    paddingHorizontal: layouts.padding * 3,
    marginBottom: layouts.padding * 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    minWidth: 100,
    maxWidth: 300,
    alignItems: "center",
  },
  wordText: {
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: layouts.padding * 2,
    width: "100%",
    justifyContent: "center",
    paddingHorizontal: layouts.padding * 2,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: layouts.padding * 1.5,
    paddingHorizontal: layouts.padding * 3,
    borderRadius: layouts.padding,
    minHeight: 48,
    borderWidth: 1,
    flex: 1,
    maxWidth: 160,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  unknownButton: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    shadowColor: "#ef4444",
  },
  pressedUnknown: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
    shadowOpacity: 0.3,
    elevation: 8,
    transform: [{ scale: 0.98 }],
  },
  unknownText: {
    color: "#dc2626",
    fontWeight: "700",
  },
  knownButton: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    shadowColor: "#22c55e",
  },
  pressedKnown: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
    shadowOpacity: 0.3,
    elevation: 8,
    transform: [{ scale: 0.98 }],
  },
  knownText: {
    color: "#16a34a",
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.6,
  },
  tip: {
    textAlign: "center",
    fontSize: 14,
    marginTop: layouts.padding * 4,
    fontStyle: "italic",
  },
  subTip: {
    textAlign: "center",
    fontSize: 12,
    marginTop: layouts.padding,
  },
  retryBtn: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    marginBottom: 12,
  },
  pressedBtn: {
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  smallText: {
    fontSize: 12,
  },

  // Dialog Styles - 简化，只保留非尺寸相关的基础样式
  dialogOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialogContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dialogBox: {
    borderRadius: layouts.padding * 2,
    width: '85%',
    maxWidth: 340,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  dialogTitle: {
    fontWeight: "bold",
    textAlign: "center",
  },
  dialogBody: {
    textAlign: "center",
  },
  dialogSmall: {
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  smallBtn: {
    backgroundColor: "transparent",
    borderRadius: layouts.padding,
    borderWidth: 1,
    flex: 1,
  },
  smallBtnPressed: {
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  smallBtnText: {
    fontWeight: "600",
  },
  primaryBtn: {
    backgroundColor: "rgb(64, 145, 255)",
    borderRadius: layouts.padding,
    flex: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnPressed: {
    backgroundColor: "#3b82f6",
  },
  primaryBtnText: {
    color: "white",
    fontWeight: "700",
  },
});