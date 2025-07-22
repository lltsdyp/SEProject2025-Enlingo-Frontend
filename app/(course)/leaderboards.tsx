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
import { useTheme } from "@/context/theme";
import { router } from "expo-router";
import { contentApiClient } from "@/api";

// =========================
// 🔧 类型定义
// =========================

interface QuizItem {
  id: number;
  question: string; // 中文翻译
  options: string[]; // 四个英文单词选项
  correctAnswer: string; // 正确的英文单词
  type: "meaning";
}

type QuizStatus = "loading" | "ready" | "answering" | "showingResult" | "completed";

interface QuizState {
  quizData: QuizItem[];
  currentIndex: number;
  selectedOption: string | null;
  score: number;
  status: QuizStatus;
  error: string | null;
  retryCount: number;
}

type QuizAction =
  | { type: "GENERATE_START" }
  | { type: "GENERATE_SUCCESS"; data: QuizItem[] }
  | { type: "GENERATE_FAILURE"; error: string }
  | { type: "SELECT_OPTION"; option: string }
  | { type: "SHOW_RESULT" }
  | { type: "NEXT_QUESTION" }
  | { type: "RESTART_QUIZ" };

const initialQuizState: QuizState = {
  quizData: [],
  currentIndex: 0,
  selectedOption: null,
  score: 0,
  status: "loading",
  error: null,
  retryCount: 0,
};

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "GENERATE_START":
      return {
        ...state,
        status: "loading",
        error: null,
      };
    case "GENERATE_SUCCESS":
      return {
        ...state,
        quizData: action.data,
        status: "ready",
        retryCount: 0,
      };
    case "GENERATE_FAILURE":
      return {
        ...state,
        status: "loading", // 保持加载状态以便重试
        error: action.error,
        retryCount: state.retryCount + 1,
      };
    case "SELECT_OPTION":
      return {
        ...state,
        selectedOption: action.option,
        status: "showingResult",
      };
    case "SHOW_RESULT":
      return {
        ...state,
        score: state.selectedOption === state.quizData[state.currentIndex]?.correctAnswer ? state.score + 1 : state.score,
      };
    case "NEXT_QUESTION":
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.quizData.length) {
        return {
          ...state,
          status: "completed",
        };
      }
      return {
        ...state,
        currentIndex: nextIndex,
        selectedOption: null,
        status: "ready",
      };
    case "RESTART_QUIZ":
      return {
        ...initialQuizState,
        status: "loading",
      };
    default:
      return state;
  }
}

// =========================
// 🎣 自定义 Hook：题目生成器
// =========================

function useQuizGenerator() {
  const generateQuizData = useCallback(async (): Promise<QuizItem[]> => {
    console.log("🎯 开始生成题目数据...");
    try {
      // 获取四个随机单词
      const wordsResponse = await contentApiClient.wordlistRandomwordGet();
      const wordsData = wordsResponse.data;
      const words = [wordsData.word1, wordsData.word2, wordsData.word3, wordsData.word4];
      console.log("📝 获取到的随机单词:", words);

      if (!words || words.length < 4) {
        throw new Error("获取的单词数量不足");
      }

      // 为每个单词获取翻译
      const translationsPromises = words.map((word: string) => {
        console.log("🔍 正在获取单词翻译:", word);
        return contentApiClient.wordlistTranslateGet(word);
      });
      const translationsResponses = await Promise.all(translationsPromises);
      const translations = translationsResponses.map(
        (response: any) => response.data.simple_trans
      );
      console.log("🔤 获取到的翻译:", translations);

      // 生成10道题目
      const quiz: QuizItem[] = [];
      for (let i = 0; i < 10; i++) {
        const correctIndex = Math.floor(Math.random() * words.length);
        const correctWord = words[correctIndex];
        const correctTranslation = translations[correctIndex];

        const wrongOptions = words.filter((_, index) => index !== correctIndex);
        const options = [correctWord, ...wrongOptions].sort(() => Math.random() - 0.5);

        quiz.push({
          id: i,
          question: correctTranslation,
          options: options,
          correctAnswer: correctWord,
          type: "meaning",
        });
      }

      console.log("✅ 成功生成题目数据，共", quiz.length, "道题");
      return quiz;
    } catch (error: unknown) {
      console.error("❌ 生成题目失败:", error);
      const errorMessage =
        error instanceof Error ? error.message : "获取题目数据失败";
      throw new Error(errorMessage);
    }
  }, []);

  return { generateQuizData };
}

// =========================
// 🖼️ 动画控制器
// =========================

function useQuizAnimation() {
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
            outputRange: [-Dimensions.get("window").width, 0],
          }),
        },
      ],
    }),
    [slideAnim]
  );

  const scaleStyle = useMemo(
    () => ({ transform: [{ scale: scaleAnim }] }),
    [scaleAnim]
  );

  return {
    slideAnim,
    scaleAnim,
    animateSlideOut,
    resetSlide,
    animateButtonPress,
    slideStyle,
    scaleStyle,
  };
}

// =========================
// 🧱 子组件：顶部进度条
// =========================

const ProgressBar = React.memo<{
  progress: number;
  current: number;
  total: number;
  score: number;
}>(({ progress, current, total, score }) => {
  const { border, accent, mutedForeground } = useTheme();

  return (
    <View style={styles.progressContainer}>
      <View style={[styles.progressBarBg, { borderColor: border }]}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${progress}%`, backgroundColor: accent },
          ]}
        />
      </View>
      <View style={styles.counterRow}>
        <Text style={[styles.counterText, { color: mutedForeground }]}>
          {current} / {total}
        </Text>
        <Text style={[styles.scoreText, { color: accent }]}>
          得分: {score}
        </Text>
      </View>
    </View>
  );
});

// =========================
// 🧱 子组件：问题卡片
// =========================

const QuestionCard = React.memo<{
  question: string;
  animationStyle: any;
}>(({ question, animationStyle }) => {
  const { foreground, background, border } = useTheme();
  const fontSize = Dimensions.get("window").width > 768 ? 32 : 16;

  return (
    <Animated.View
      style={[
        styles.questionCard,
        { backgroundColor: background, borderColor: border },
        animationStyle,
      ]}
    >
      <RNText style={[styles.instructionText, { color: useTheme().mutedForeground }]}>
        请选择下面中文的正确英文翻译：
      </RNText>
      <RNText style={[styles.questionText, { color: foreground, fontSize }]}>
        {question}
      </RNText>
    </Animated.View>
  );
});

// =========================
// 🧱 子组件：答案选项
// =========================

const OptionButton = React.memo<{
  option: string;
  isSelected: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  onPress: () => void;
  disabled: boolean;
}>(({ option, isSelected, isCorrect, isWrong, onPress, disabled }) => {
  const { background, border, mutedForeground } = useTheme();
  const fontSize = Dimensions.get("window").width > 768 ? 16 : 13;

  const getOptionStyle = useMemo(() => {
    let bg = background;
    let bd = border;
    let sc = "#000";
    let shadowOpacity = 0.1;
    let elevation = 4;

    if (isCorrect) {
      bg = "#f0fdf4";
      bd = "#22c55e";
      sc = "#22c55e";
      shadowOpacity = 0.15;
    } else if (isWrong && isSelected) {
      bg = "#fef2f2";
      bd = "#ef4444";
      sc = "#ef4444";
      shadowOpacity = 0.15;
    }

    return {
      backgroundColor: bg,
      borderColor: bd,
      shadowColor: sc,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity,
      shadowRadius: 8,
      elevation,
    };
  }, [background, border, isCorrect, isWrong, isSelected]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.optionBase,
        getOptionStyle,
        {
          borderWidth: 2,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <RNText
        style={[
          styles.optionText,
          {
            color: isCorrect
              ? "#16a34a"
              : isWrong && isSelected
              ? "#dc2626"
              : mutedForeground,
            fontSize,
          },
        ]}
      >
        {option}
      </RNText>
    </Pressable>
  );
});

// =========================
// 🧱 子组件：结果展示
// =========================

const ResultDisplay = React.memo<{
  isCorrect: boolean;
  correctAnswer: string;
}>(({ isCorrect, correctAnswer }) => {
  const { accent, mutedForeground } = useTheme();

  return (
    <View style={styles.resultContainer}>
      <Text style={[styles.resultText, { color: isCorrect ? "#16a34a" : "#dc2626" }]}>
        {isCorrect ? "🎉 正确！" : "❌ 答错了"}
      </Text>
      {!isCorrect && (
        <Text style={[styles.correctAnswerText, { color: accent }]}>
          正确答案是: {correctAnswer}
        </Text>
      )}
    </View>
  );
});

// =========================
// 🧱 子组件：提示文本
// =========================

const TipText = React.memo<{ showResult: boolean }>(({ showResult }) => {
  const { mutedForeground } = useTheme();

  return (
    <Text style={[styles.tipText, { color: mutedForeground }]}>
      {showResult ? "2秒后自动跳转到下一题" : "选择你认为正确的答案"}
    </Text>
  );
});

// =========================
// 🧩 主组件
// =========================

export default function VocabularyQuizExample() {
  const { foreground, mutedForeground, border, accent, background } = useTheme();
  const [state, dispatch] = useReducer(quizReducer, initialQuizState);
  const { generateQuizData } = useQuizGenerator();
  const {
    slideAnim,
    scaleAnim,
    animateSlideOut,
    resetSlide,
    animateButtonPress,
    slideStyle,
    scaleStyle,
  } = useQuizAnimation();

  const { quizData, currentIndex, selectedOption, score, status, error, retryCount } = state;
  const currentQuiz = quizData[currentIndex];

  // 初始化和刷新题目
  const refreshQuizData = useCallback(async () => {
    console.log("🔄 刷新题目数据...");
    dispatch({ type: "GENERATE_START" });

    try {
      const quiz = await generateQuizData();
      dispatch({ type: "GENERATE_SUCCESS", data: quiz });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "未知错误";
      dispatch({ type: "GENERATE_FAILURE", error: message });
    }
  }, [generateQuizData]);

  // 第一次加载
  useEffect(() => {
    refreshQuizData();
  }, [refreshQuizData]);

  // 处理选项选择
  const handleSelectOption = useCallback(
    (option: string) => {
      if (status !== "ready") return;

      console.log("👆 用户选择答案:", option);
      animateButtonPress();
      dispatch({ type: "SELECT_OPTION", option });

      const isCorrect = option === currentQuiz?.correctAnswer;
      if (isCorrect) {
        console.log("✅ 答案正确!");
      } else {
        console.log("❌ 答案错误, 正确答案是:", currentQuiz?.correctAnswer);
      }

      // 显示结果，2秒后进入下一题
      setTimeout(() => {
        dispatch({ type: "SHOW_RESULT" });
        animateSlideOut(() => {
          dispatch({ type: "NEXT_QUESTION" });
          resetSlide();
        });
      }, 2000);
    },
    [
      status,
      currentQuiz,
      animateButtonPress,
      animateSlideOut,
      resetSlide,
    ]
  );

  // 重新开始测试
  const restartQuiz = useCallback(() => {
    console.log("🔁 用户选择重新开始测试");
    refreshQuizData();
  }, [refreshQuizData]);

  // 计算进度
  const progress = useMemo(
    () => ((currentIndex + 1) / Math.max(quizData.length, 1)) * 100,
    [currentIndex, quizData.length]
  );

  // =========================
  // 🖨️ 渲染逻辑
  // =========================

  if (status === "loading" && error === null) {
    return (
      <View style={[styles.flexCenter, { backgroundColor: background }]}>
        <Text style={{ color: foreground, fontSize: 16 }}>
          正在加载题目...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.flexCenter,
          styles.errorContainer,
          { backgroundColor: background },
        ]}
      >
        <Text
          style={{
            color: "#dc2626",
            fontSize: 16,
            textAlign: "center",
            marginBottom: layouts.padding * 2,
          }}
        >
          {error}
        </Text>
        <Pressable
          onPress={refreshQuizData}
          style={({ pressed }) => [
            styles.reloadBtn,
            pressed && styles.pressedBtn,
          ]}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>重新加载</Text>
        </Pressable>
        {retryCount > 0 && (
          <Text
            style={[
              styles.smallText,
              { color: mutedForeground, marginTop: layouts.padding },
            ]}
          >
            已尝试 {retryCount} 次
          </Text>
        )}
      </View>
    );
  }

  if (quizData.length === 0) {
    return (
      <View style={[styles.flexCenter, { backgroundColor: background }]}>
        <Text style={{ color: mutedForeground }}>未生成测试题目</Text>
        <Pressable
          onPress={refreshQuizData}
          style={({ pressed }) => [
            styles.reloadBtn,
            pressed && styles.pressedBtn,
          ]}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>重新加载</Text>
        </Pressable>
      </View>
    );
  }

  const isCorrect = selectedOption === currentQuiz?.correctAnswer;
  const showResult = status === "showingResult";

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      {/* 顶部进度条 */}
      <ProgressBar
        progress={progress}
        current={currentIndex + 1}
        total={quizData.length}
        score={score}
      />

      {/* 主要内容区域 */}
      <View style={styles.content}>
        {/* 问题卡片 */}
        <QuestionCard question={currentQuiz.question} animationStyle={slideStyle} />

        {/* 选项列表 */}
        <Animated.View style={[styles.optionsContainer, scaleStyle]}>
          {currentQuiz.options.map((option, index) => (
            <OptionButton
              key={index}
              option={option}
              isSelected={selectedOption === option}
              isCorrect={option === currentQuiz.correctAnswer}
              isWrong={option !== currentQuiz.correctAnswer && selectedOption === option}
              onPress={() => handleSelectOption(option)}
              disabled={showResult}
            />
          ))}
        </Animated.View>

        {/* 结果显示 */}
        {showResult && (
          <ResultDisplay
            isCorrect={isCorrect}
            correctAnswer={currentQuiz.correctAnswer}
          />
        )}

        {/* 提示文字 */}
        <TipText showResult={showResult} />
      </View>
    </View>
  );
}

// =========================
// 🎨 样式表
// =========================

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
  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: layouts.padding,
  },
  counterText: {
    fontSize: 14,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    paddingHorizontal: layouts.padding * 2,
  },
  questionCard: {
    borderRadius: layouts.padding * 2,
    paddingVertical: layouts.padding * 1,
    paddingHorizontal: layouts.padding * 3,
    marginBottom: layouts.padding * 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  instructionText: {
    fontSize: 16,
    marginBottom: layouts.padding,
    textAlign: "center",
  },
  questionText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  optionsContainer: {
    gap: layouts.padding * 0.7,
  },
  optionBase: {
    paddingVertical: layouts.padding * 1,
    paddingHorizontal: layouts.padding * 1,
    borderRadius: layouts.padding,
    minHeight: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    fontWeight: "600",
    textAlign: "center",
  },
  resultContainer: {
    marginTop: layouts.padding * 3,
    alignItems: "center",
  },
  resultText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  correctAnswerText: {
    fontSize: 14,
    marginTop: layouts.padding / 2,
    textAlign: "center",
  },
  tipText: {
    textAlign: "center",
    fontSize: 14,
    marginTop: layouts.padding * 4,
    fontStyle: "italic",
  },
  reloadBtn: {
    backgroundColor: "rgb(64, 145, 255)",
    paddingHorizontal: layouts.padding * 2,
    paddingVertical: layouts.padding,
    borderRadius: layouts.padding,
  },
  pressedBtn: {
    opacity: 0.8,
  },
  smallText: {
    fontSize: 12,
  },
});