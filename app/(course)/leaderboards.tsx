import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Pressable, View, Animated, Dimensions } from "react-native";
import { Text } from "@/components/themed";
import { layouts } from "@/constants/layouts";
import { useTheme } from "@/context/theme";
import { router } from "expo-router";

const { width } = Dimensions.get('window');

interface QuizItem {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  type: 'meaning';
}

const meanings: { [key: string]: string } = {
  "你好": "hello",
  "谢谢": "thank you",
  "再见": "goodbye",
  "对不起": "sorry",
  "没关系": "no problem",
  "请": "please",
  "不客气": "you're welcome",
  "早上好": "good morning",
  "晚上好": "good evening",
  "吃饭": "eat meal"
};

const sampleWords = ["你好", "谢谢", "再见", "对不起", "没关系", "请", "不客气", "早上好", "晚上好", "吃饭"];

export default function VocabularyQuizExample() {
  const { foreground, mutedForeground, border, accent, background } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(1));
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizData, setQuizData] = useState<QuizItem[]>([]);

  const generateQuizData = useCallback((words: string[]): QuizItem[] => {
    const quiz: QuizItem[] = [];

    words.forEach((word, index) => {
      if (meanings[word]) {
        const correctAnswer = meanings[word];
        const otherMeanings = Object.values(meanings).filter(m => m !== correctAnswer);
        const wrongOptions: string[] = [];

        while (wrongOptions.length < 3 && otherMeanings.length > 0) {
          const idx = Math.floor(Math.random() * otherMeanings.length);
          wrongOptions.push(otherMeanings.splice(idx, 1)[0]);
        }

        const options = [correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);

        quiz.push({ id: index, question: word, options, correctAnswer, type: 'meaning' });
      }
    });

    return quiz.slice(0, 10);
  }, []);

  useEffect(() => {
    const quiz = generateQuizData(sampleWords);
    setQuizData(quiz);
  }, [generateQuizData]);

  const onSelectOption = useCallback((option: string) => {
    if (showResult) return;
    setSelectedOption(option);
    setShowResult(true);

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    if (quizData[currentIndex] && option === quizData[currentIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }

    setTimeout(() => {
      goToNext();
    }, 2000);
  }, [showResult, currentIndex, quizData, scaleAnim]);

  const goToNext = useCallback(() => {
    Animated.timing(slideAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start(() => {
      if (currentIndex < quizData.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setShowResult(false);
        slideAnim.setValue(0);
      } else {
        router.push("/learn");
      }
    });
  }, [currentIndex, quizData.length, slideAnim]);

  const getOptionStyle = useCallback((option: string) => {
    const currentQuiz = quizData[currentIndex];
    if (!currentQuiz || !showResult) return { backgroundColor: background, borderColor: border, shadowColor: '#000' };
    if (option === currentQuiz.correctAnswer) return { backgroundColor: '#f0fdf4', borderColor: '#22c55e', shadowColor: '#22c55e' };
    if (option === selectedOption) return { backgroundColor: '#fef2f2', borderColor: '#ef4444', shadowColor: '#ef4444' };
    return { backgroundColor: background, borderColor: border, shadowColor: '#000' };
  }, [showResult, selectedOption, currentIndex, quizData, background, border]);

  const getOptionTextColor = useCallback((option: string) => {
    const currentQuiz = quizData[currentIndex];
    if (!currentQuiz || !showResult) return foreground;
    if (option === currentQuiz.correctAnswer) return '#16a34a';
    if (option === selectedOption) return '#dc2626';
    return mutedForeground;
  }, [showResult, selectedOption, currentIndex, quizData, foreground, mutedForeground]);

  if (quizData.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>未生成测试题目</Text>
      </View>
    );
  }

  const currentQuiz = quizData[currentIndex];
  const progress = ((currentIndex + 1) / quizData.length) * 100;
  const slideTransform = { transform: [{ translateX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -width] }) }] };

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      <View style={{ marginTop: layouts.padding * 6, marginHorizontal: layouts.padding * 2, height: 4, backgroundColor: border, borderRadius: 2, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${progress}%`, backgroundColor: accent, borderRadius: 2 }} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: layouts.padding * 2, marginTop: layouts.padding, marginBottom: layouts.padding * 4 }}>
        <Text style={{ color: mutedForeground, fontSize: 14 }}>{currentIndex + 1} / {quizData.length}</Text>
        <Text style={{ color: accent, fontSize: 14, fontWeight: 'bold' }}>得分: {score}</Text>
      </View>

      <View style={{ flex: 1, paddingHorizontal: layouts.padding * 2 }}>
        <Animated.View style={[{ backgroundColor: background, borderRadius: layouts.padding * 2, paddingVertical: layouts.padding * 1, paddingHorizontal: layouts.padding * 3, marginBottom: layouts.padding * 2, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, borderWidth: 1, borderColor: border, alignItems: 'center' }, slideTransform]}>
          <Text style={{ fontSize: 16, color: mutedForeground, marginBottom: layouts.padding, textAlign: 'center' }}>请选择下面词语的正确含义：</Text>
          <Text style={{ fontSize: width > 768 ? 32 : 16, fontWeight: 'bold', color: foreground, textAlign: 'center', letterSpacing: 0.5 }}>{currentQuiz.question}</Text>
        </Animated.View>

        <Animated.View style={[{ gap: layouts.padding * 0.7 }, { transform: [{ scale: scaleAnim }] }]}>
          {currentQuiz.options.map((option, index) => (
            <Pressable key={index} onPress={() => onSelectOption(option)} disabled={showResult} style={({ pressed }) => ({ ...getOptionStyle(option), paddingVertical: layouts.padding * 1, paddingHorizontal: layouts.padding * 1, borderRadius: layouts.padding, minHeight: 30, shadowOffset: { width: 0, height: 4 }, shadowOpacity: pressed ? 0.3 : 0.1, shadowRadius: 8, elevation: pressed ? 8 : 4, borderWidth: 2, transform: [{ scale: pressed ? 0.98 : 1 }], alignItems: 'center', justifyContent: 'center' })}>
              <Text style={{ color: getOptionTextColor(option), fontWeight: '600', fontSize: width > 768 ? 16 : 13, textAlign: 'center' }}>{option}</Text>
            </Pressable>
          ))}
        </Animated.View>

        {showResult && (
          <View style={{ marginTop: layouts.padding * 3, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: selectedOption === currentQuiz.correctAnswer ? '#16a34a' : '#dc2626', textAlign: 'center' }}>
              {selectedOption === currentQuiz.correctAnswer ? '正确！' : '答错了'}
            </Text>
            {selectedOption !== currentQuiz.correctAnswer && (
              <Text style={{ fontSize: 14, color: mutedForeground, marginTop: layouts.padding / 2, textAlign: 'center' }}>正确答案是: {currentQuiz.correctAnswer}</Text>
            )}
          </View>
        )}

        <Text style={{ textAlign: 'center', color: mutedForeground, fontSize: 14, marginTop: layouts.padding * 4, fontStyle: 'italic' }}>
          {showResult ? '2秒后自动跳转到下一题' : '选择你认为正确的答案'}
        </Text>
      </View>
    </View>
  );
}
