import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Pressable, View, Animated, Dimensions } from "react-native";
import { Text } from "@/components/themed";
import { layouts } from "@/constants/layouts";
import { useTheme } from "@/context/theme";
import { router } from "expo-router";
import { contentApiClient } from "@/api";

const { width } = Dimensions.get('window');

interface QuizItem {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  type: 'meaning';
}

export default function VocabularyQuizExample() {
  const { foreground, mutedForeground, border, accent, background } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(1));
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizData, setQuizData] = useState<QuizItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateQuizData = useCallback(async (): Promise<QuizItem[]> => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🎯 开始生成题目数据...');
      
      // 获取四个随机单词
      const wordsResponse = await contentApiClient.wordlistRandomwordGet();
      const wordsData = wordsResponse.data;
      
      // 将API返回的对象转换为数组
      const words = [wordsData.word1, wordsData.word2, wordsData.word3, wordsData.word4];
      
      console.log('📝 获取到的随机单词:', words);
      
      if (!words || words.length < 4) {
        throw new Error('获取的单词数量不足');
      }

      // 为每个单词获取翻译
      const translationsPromises = words.map((word: string) => {
        console.log('🔍 正在获取单词翻译:', word);
        return contentApiClient.wordlistTranslateGet(word);
      });
      
      const translationsResponses = await Promise.all(translationsPromises);
      const translations = translationsResponses.map((response: any) => response.data.simple_trans);
      
      console.log('🔤 获取到的翻译:', translations);

      // 生成10道题目
      const quiz: QuizItem[] = [];
      
      for (let i = 0; i < 10; i++) {
        // 随机选择一个单词作为正确答案
        const correctIndex = Math.floor(Math.random() * words.length);
        const correctWord = words[correctIndex];
        const correctTranslation = translations[correctIndex];
        
        // 其他三个单词作为错误选项
        const wrongOptions = words.filter((_, index) => index !== correctIndex);
        
        // 随机排列选项
        const options = [correctWord, ...wrongOptions].sort(() => Math.random() - 0.5);
        
        quiz.push({
          id: i,
          question: correctTranslation, // 中文翻译作为题目
          options: options,             // 四个中文单词作为选项
          correctAnswer: correctWord,   // 正确的中文单词
          type: 'meaning'
        });
      }

      console.log('✅ 成功生成题目数据，共', quiz.length, '道题');
      return quiz;
    } catch (error: unknown) {
      console.error('❌ 生成题目失败:', error);
      
      const errorMessage = error instanceof Error ? error.message : '获取题目数据失败';
      console.error('❌ 错误详情:', errorMessage);
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshQuizData = useCallback(async () => {
    console.log('🔄 刷新题目数据...');
    const quiz = await generateQuizData();
    setQuizData(quiz);
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setShowResult(false);
    slideAnim.setValue(0);
  }, [generateQuizData, slideAnim]);

  useEffect(() => {
    refreshQuizData();
  }, [refreshQuizData]);

  const onSelectOption = useCallback((option: string) => {
    if (showResult) return;
    
    console.log('👆 用户选择答案:', option);
    setSelectedOption(option);
    setShowResult(true);

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    const isCorrect = quizData[currentIndex] && option === quizData[currentIndex].correctAnswer;
    if (isCorrect) {
      console.log('✅ 答案正确!');
      setScore(prev => prev + 1);
    } else {
      console.log('❌ 答案错误, 正确答案是:', quizData[currentIndex]?.correctAnswer);
    }

    setTimeout(() => {
      goToNext();
    }, 2000);
  }, [showResult, currentIndex, quizData, scaleAnim]);

  const goToNext = useCallback(() => {
    Animated.timing(slideAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start(() => {
      if (currentIndex < quizData.length - 1) {
        console.log('➡️ 进入下一题:', currentIndex + 2, '/', quizData.length);
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setShowResult(false);
        slideAnim.setValue(0);
      } else {
        console.log('🎉 测试完成! 最终得分:', score + (selectedOption === quizData[currentIndex]?.correctAnswer ? 1 : 0), '/', quizData.length);
        // 完成所有题目，可以选择重新开始或返回
        router.push("/learn");
      }
    });
  }, [currentIndex, quizData.length, slideAnim, score, selectedOption]);

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

  // 加载状态
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: background }}>
        <Text style={{ color: foreground, fontSize: 16 }}>正在加载题目...</Text>
      </View>
    );
  }

  // 错误状态
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: background, paddingHorizontal: layouts.padding * 2 }}>
        <Text style={{ color: '#dc2626', fontSize: 16, textAlign: 'center', marginBottom: layouts.padding * 2 }}>
          {error}
        </Text>
        <Pressable 
          onPress={refreshQuizData}
          style={{ backgroundColor: accent, paddingHorizontal: layouts.padding * 2, paddingVertical: layouts.padding, borderRadius: layouts.padding }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>重新加载</Text>
        </Pressable>
      </View>
    );
  }

  // 没有题目数据
  if (quizData.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: background }}>
        <Text style={{ color: mutedForeground }}>未生成测试题目</Text>
        <Pressable 
          onPress={refreshQuizData}
          style={{ backgroundColor: accent, paddingHorizontal: layouts.padding * 2, paddingVertical: layouts.padding, borderRadius: layouts.padding, marginTop: layouts.padding }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>重新加载</Text>
        </Pressable>
      </View>
    );
  }

  const currentQuiz = quizData[currentIndex];
  const progress = ((currentIndex + 1) / quizData.length) * 100;
  const slideTransform = { transform: [{ translateX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -width] }) }] };

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      {/* 进度条 */}
      <View style={{ marginTop: layouts.padding * 6, marginHorizontal: layouts.padding * 2, height: 4, backgroundColor: border, borderRadius: 2, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${progress}%`, backgroundColor: accent, borderRadius: 2 }} />
      </View>

      {/* 题目计数和得分 */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: layouts.padding * 2, marginTop: layouts.padding, marginBottom: layouts.padding * 4 }}>
        <Text style={{ color: mutedForeground, fontSize: 14 }}>{currentIndex + 1} / {quizData.length}</Text>
        <Text style={{ color: accent, fontSize: 14, fontWeight: 'bold' }}>得分: {score}</Text>
      </View>

      <View style={{ flex: 1, paddingHorizontal: layouts.padding * 2 }}>
        {/* 题目卡片 */}
        <Animated.View style={[{ backgroundColor: background, borderRadius: layouts.padding * 2, paddingVertical: layouts.padding * 1, paddingHorizontal: layouts.padding * 3, marginBottom: layouts.padding * 2, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, borderWidth: 1, borderColor: border, alignItems: 'center' }, slideTransform]}>
          <Text style={{ fontSize: 16, color: mutedForeground, marginBottom: layouts.padding, textAlign: 'center' }}>请选择下面英文的正确中文翻译：</Text>
          <Text style={{ fontSize: width > 768 ? 32 : 16, fontWeight: 'bold', color: foreground, textAlign: 'center', letterSpacing: 0.5 }}>{currentQuiz.question}</Text>
        </Animated.View>

        {/* 选项 */}
        <Animated.View style={[{ gap: layouts.padding * 0.7 }, { transform: [{ scale: scaleAnim }] }]}>
          {currentQuiz.options.map((option, index) => (
            <Pressable 
              key={index} 
              onPress={() => onSelectOption(option)} 
              disabled={showResult} 
              style={({ pressed }) => ({ 
                ...getOptionStyle(option), 
                paddingVertical: layouts.padding * 1, 
                paddingHorizontal: layouts.padding * 1, 
                borderRadius: layouts.padding, 
                minHeight: 30, 
                shadowOffset: { width: 0, height: 4 }, 
                shadowOpacity: pressed ? 0.3 : 0.1, 
                shadowRadius: 8, 
                elevation: pressed ? 8 : 4, 
                borderWidth: 2, 
                transform: [{ scale: pressed ? 0.98 : 1 }], 
                alignItems: 'center', 
                justifyContent: 'center' 
              })}
            >
              <Text style={{ color: getOptionTextColor(option), fontWeight: '600', fontSize: width > 768 ? 16 : 13, textAlign: 'center' }}>
                {option}
              </Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* 结果显示 */}
        {showResult && (
          <View style={{ marginTop: layouts.padding * 3, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: selectedOption === currentQuiz.correctAnswer ? '#16a34a' : '#dc2626', textAlign: 'center' }}>
              {selectedOption === currentQuiz.correctAnswer ? '正确！' : '答错了'}
            </Text>
            {selectedOption !== currentQuiz.correctAnswer && (
              <Text style={{ fontSize: 14, color: mutedForeground, marginTop: layouts.padding / 2, textAlign: 'center' }}>
                正确答案是: {currentQuiz.correctAnswer}
              </Text>
            )}
          </View>
        )}

        {/* 提示文字 */}
        <Text style={{ textAlign: 'center', color: mutedForeground, fontSize: 14, marginTop: layouts.padding * 4, fontStyle: 'italic' }}>
          {showResult ? '2秒后自动跳转到下一题' : '选择你认为正确的答案'}
        </Text>
      </View>
    </View>
  );
}