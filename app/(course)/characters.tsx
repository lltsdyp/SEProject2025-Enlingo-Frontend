import React, { useState, useEffect, useCallback } from "react";
import { Pressable, View, Animated, Dimensions, StyleSheet } from "react-native";

import { Text } from "@/components/themed";
import { layouts } from "@/constants/layouts";
import { useCourse } from "@/context/course";
import { useTheme } from "@/context/theme";
import { router } from "expo-router";

const { width } = Dimensions.get('window');

import { contentApiClient } from "@/api";

export default function VocabularyPractice() {
  const { courseId } = useCourse();
  const { foreground, mutedForeground, border, accent, background } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(1));
  
  // 状态管理
  const [words, setWords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [nextWord, setNextWord] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // 新增：循环复习相关状态
  const [completedRounds, setCompletedRounds] = useState(0);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [allWordsLoaded, setAllWordsLoaded] = useState(false);
  
  // 新增：删除单词相关状态
  const [isDeleting, setIsDeleting] = useState(false);

  // 删除单词的函数
  const deleteWord = useCallback(async (word: string) => {
    try {
      setIsDeleting(true);
      console.log('🗑️ 开始删除生词:', word);
      
      await contentApiClient.wordlistDeletePost(word);
      
      console.log('✅ 生词删除成功:', word);
      
      // 从本地状态中移除该单词
      setWords(prevWords => {
        const newWords = prevWords.filter(w => w !== word);
        console.log('📝 更新后剩余单词数:', newWords.length);
        return newWords;
      });
      
    } catch (error: unknown) {
      console.error('❌ 删除生词失败:', error);
      
      // 可以在这里添加错误提示，比如toast或者临时状态
      const errorMessage = error instanceof Error ? error.message : '删除失败';
      console.error('❌ 删除错误详情:', errorMessage);
      
      // 你可以根据需要添加用户错误反馈
      // setError(`删除失败: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  }, []);

  // 获取生词列表的函数
  const fetchWords = useCallback(async (before?: string, append: boolean = false) => {
    try {
      console.log('🔄 开始获取生词列表...', { before, append, retryCount });
      
      if (!append) {
        setLoading(true);
        setError(null); // 清除之前的错误
      }
      setIsLoadingMore(true);
      
      // 修复：确保before参数正确传递，如果是undefined则不传递该参数
      const response = await contentApiClient.wordlistGetGet(2, before || undefined);

      
      console.log('✅ API 响应成功:', {
        status: response.status,
        data: response.data,
        listLength: response.data?.list?.length,
      });
      
      if (append) {
        setWords(prevWords => {
          const newWords = [...prevWords, ...response.data.list];
          console.log('📝 追加后总单词数:', newWords.length);
          return newWords;
        });
      } else {
        setWords(response.data.list || []);
      }
      
      setHasNextPage(response.data.hasNextPage);
      setNextWord(response.data.nextWord ?? undefined);
      setRetryCount(0); // 成功后重置重试计数
      
      // 检查是否已加载完所有单词
      if (!response.data.hasNextPage) {
        setAllWordsLoaded(true);
      }
      
    } catch (error: unknown) {
      console.error('❌ 获取生词列表失败:', error);
      
      const errorMessage = error instanceof Error ? error.message : '网络错误';
      setError(errorMessage);
      
      // 如果是初始加载失败，增加重试计数
      if (!append) {
        setRetryCount(prev => prev + 1);
      }
      
      if (error instanceof Error) {
        console.error('❌ 错误详情:', {
          message: error.message,
          name: error.name,
        });
      }
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('❌ HTTP 错误详情:', {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
        });
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [retryCount]);

  // 手动重试函数
  const handleRetry = useCallback(() => {
    console.log('🔄 手动重试加载');
    fetchWords();
  }, [fetchWords]);

  // 重新开始复习函数
  const restartReview = useCallback(() => {
    console.log('🔄 重新开始复习');
    setCurrentIndex(0);
    setCompletedRounds(prev => prev + 1);
    setShowRestartDialog(false);
    slideAnim.setValue(0);
  }, [slideAnim]);

  // 初始加载
  useEffect(() => {
    console.log('🚀 组件初始化，准备获取生词列表');
    fetchWords();
  }, [fetchWords]);

  // 自动重试机制 - 仅在有错误且重试次数少于3次时触发
  useEffect(() => {
    if (error && retryCount < 3 && retryCount > 0) {
      console.log(`⏰ 将在5秒后自动重试 (第${retryCount}次)`);
      const timer = setTimeout(() => {
        fetchWords();
      }, 5000); // 5秒后重试

      return () => clearTimeout(timer);
    }
  }, [error, retryCount, fetchWords]);

  // 检查是否需要加载更多单词
  useEffect(() => {
    if (words.length > 0 && 
        currentIndex >= words.length - 5 && 
        hasNextPage && 
        !isLoadingMore &&
        nextWord) { // 确保nextWord存在
      fetchWords(nextWord, true);
    }
  }, [currentIndex, words.length, hasNextPage, nextWord, isLoadingMore, fetchWords]);

  // 检查是否因删除单词导致需要调整currentIndex
  useEffect(() => {
    if (words.length > 0 && currentIndex >= words.length) {
      // 如果当前索引超出范围，调整到最后一个单词
      setCurrentIndex(words.length - 1);
    }
  }, [words.length, currentIndex]);

  // 加载中状态
  if (loading && words.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: foreground }}>加载中...</Text>
        {retryCount > 0 && (
          <Text style={{ marginTop: 8, fontSize: 12, color: mutedForeground }}>
            重试中... ({retryCount}/3)
          </Text>
        )}
      </View>
    );
  }

  // 错误状态
  if (error && words.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 }}>
        <Text style={{ color: foreground, textAlign: 'center', marginBottom: 16 }}>
          加载失败
        </Text>
        <Text style={{ color: mutedForeground, fontSize: 14, textAlign: 'center', marginBottom: 20 }}>
          {error}
        </Text>
        
        {retryCount < 3 ? (
          <>
            <Pressable
              onPress={handleRetry}
              style={({ pressed }) => ({
                backgroundColor: pressed ? accent : background,
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: border,
                marginBottom: 12,
              })}
            >
              <Text style={{ color: foreground, fontWeight: '600' }}>
                手动重试
              </Text>
            </Pressable>
            
            <Text style={{ fontSize: 12, color: mutedForeground, textAlign: 'center' }}>
              {retryCount > 0 ? `自动重试中... (${retryCount}/3)` : '或等待自动重试'}
            </Text>
          </>
        ) : (
          <>
            <Pressable
              onPress={handleRetry}
              style={({ pressed }) => ({
                backgroundColor: pressed ? accent : background,
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: border,
                marginBottom: 12,
              })}
            >
              <Text style={{ color: foreground, fontWeight: '600' }}>
                重新尝试
              </Text>
            </Pressable>
            
            <Text style={{ fontSize: 12, color: mutedForeground, textAlign: 'center' }}>
              已达到最大重试次数
            </Text>
          </>
        )}
      </View>
    );
  }

  // 没有单词数据但没有错误
  if (words.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: foreground, marginBottom: 16 }}>暂无生词数据</Text>
        <Pressable
          onPress={handleRetry}
          style={({ pressed }) => ({
            backgroundColor: pressed ? accent : background,
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: border,
          })}
        >
          <Text style={{ color: foreground, fontWeight: '600' }}>
            刷新
          </Text>
        </Pressable>
      </View>
    );
  }

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  // 重新开始确认对话框 - 修改z-index使其在所有内容之上
  if (showRestartDialog) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: background,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0, // 确保在最上层
      }}>
        {/* 背景遮罩 */}
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
          }}
        />
        
        {/* 对话框 */}
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: layouts.padding * 2,
            zIndex: 10000,
          }}
        >
          <View
            style={{
              backgroundColor: background,
              borderRadius: layouts.padding * 2,
              padding: layouts.padding * 3,
              minWidth: width * 0.8,
              maxWidth: 400,
              borderWidth: 1,
              borderColor: border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 15,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: foreground,
                textAlign: 'center',
                marginBottom: layouts.padding * 2,
              }}
            >
              🎉 恭喜完成复习！
            </Text>
            
            <Text
              style={{
                fontSize: 16,
                color: foreground,
                textAlign: 'center',
                marginBottom: layouts.padding,
                lineHeight: 24,
              }}
            >
              你已经完成了所有 {words.length} 个单词的复习
            </Text>
            
            {completedRounds > 0 && (
              <Text
                style={{
                  fontSize: 14,
                  color: mutedForeground,
                  textAlign: 'center',
                  marginBottom: layouts.padding * 2,
                }}
              >
                这是第 {completedRounds + 1} 轮复习
              </Text>
            )}
            
            <Text
              style={{
                fontSize: 14,
                color: mutedForeground,
                textAlign: 'center',
                marginBottom: layouts.padding * 3,
              }}
            >
              继续练习还是回到学习页面？
            </Text>
            
            {/* 按钮组 */}
            <View
              style={{
                flexDirection: 'row',
                gap: layouts.padding,
                justifyContent: 'center',
              }}
            >
              <Pressable
                onPress={() => router.push("/learn")}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? border : background,
                  paddingVertical: layouts.padding * 1.5,
                  paddingHorizontal: layouts.padding * 2,
                  borderRadius: layouts.padding,
                  borderWidth: 1,
                  borderColor: border,
                  flex: 1,
                  maxWidth: 120,
                })}
              >
                <Text
                  style={{
                    color: mutedForeground,
                    fontWeight: '600',
                    textAlign: 'center',
                    fontSize: 14,
                  }}
                >
                  返回学习
                </Text>
              </Pressable>
              
              <Pressable
                onPress={restartReview}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? '#3b82f6' : accent,
                  paddingVertical: layouts.padding * 1.5,
                  paddingHorizontal: layouts.padding * 2,
                  borderRadius: layouts.padding,
                  flex: 1,
                  maxWidth: 120,
                  shadowColor: accent,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                })}
              >
                <Text
                  style={{
                    color: 'white',
                    fontWeight: '700',
                    textAlign: 'center',
                    fontSize: 14,
                  }}
                >
                  再来一轮
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // 点击认识或不认识，切换下一词或跳回主页
  const onAnswer = async (isKnown: boolean) => {
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

    // 如果点击"认识"，调用删除API
    if (isKnown && currentWord && !isDeleting) {
      await deleteWord(currentWord);
    }

    // 添加滑动切换动画
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // 检查删除后是否还有单词
      const remainingWords = isKnown ? words.filter(w => w !== currentWord) : words;
      
      if (currentIndex < remainingWords.length - 1) {
        setCurrentIndex(currentIndex + 1);
        slideAnim.setValue(0);
      } else {
        // 到达最后一个单词
        if (hasNextPage && !isLoadingMore && nextWord) {
          // 还有更多单词需要加载
          fetchWords(nextWord, true).then(() => {
            setCurrentIndex(currentIndex + 1);
            slideAnim.setValue(0);
          });
        } else if (allWordsLoaded || !hasNextPage || remainingWords.length <= 1) {
          // 所有单词都已复习完，显示重新开始对话框
          setShowRestartDialog(true);
        } else {
          // 兜底：回到学习页面
          router.push("/learn");
        }
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
      <View style={{ alignItems: 'center', marginTop: layouts.padding }}>
        <Text
          style={{
            textAlign: 'center',
            color: mutedForeground,
            fontSize: 14,
            marginBottom: 4,
          }}
        >
          {currentIndex + 1} / {words.length}{hasNextPage ? '+' : ''}
        </Text>
        
        {/* 显示轮数信息 */}
        {completedRounds > 0 && (
          <Text
            style={{
              textAlign: 'center',
              color: accent,
              fontSize: 12,
              fontWeight: '600',
            }}
          >
            第 {completedRounds + 1} 轮复习
          </Text>
        )}
      </View>

      {/* 主要内容区域 */}
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: layouts.padding * 2,
          marginTop: layouts.padding * 2,
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
          disabled={isDeleting}
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#ef4444' : '#fef2f2',
            paddingVertical: layouts.padding * 1.5,
            paddingHorizontal: layouts.padding * 3,
            borderRadius: layouts.padding,
            flex: 1,
            maxWidth: 160,
            minHeight: 48,
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
            gap: 6,
            opacity: isDeleting ? 0.6 : 1,
          })}
        >
          <Text
            style={{
              color: '#dc2626',
              fontWeight: '700',
              fontSize: width > 768 ? 16 : 12,
              textAlign: 'center',
            }}
          >
            遗忘
          </Text>
        </Pressable>

        {/* 认识按钮 */}
        <Pressable
          onPress={() => onAnswer(true)}
          disabled={isDeleting}
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#22c55e' : '#f0fdf4',
            paddingVertical: layouts.padding * 1.5,
            paddingHorizontal: layouts.padding * 3,
            borderRadius: layouts.padding,
            flex: 1,
            maxWidth: 140,
            minHeight: 48,
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
            opacity: isDeleting ? 0.6 : 1,
          })}
        >
          <Text
            style={{
              color: '#16a34a',
              fontWeight: '700',
              fontSize: width > 768 ? 16 : 12,
              textAlign: 'center',
            }}
          >
            {isDeleting ? '处理中...' : '认识'}
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
        
        {/* 删除提示文本 */}
        <Text
          style={{
            textAlign: 'center',
            color: mutedForeground,
            fontSize: 12,
            marginTop: layouts.padding,
          }}
        >
          选择"认识"将从生词本中移除该单词
        </Text>
        
        {/* 加载更多提示 */}
        {isLoadingMore && (
          <Text
            style={{
              textAlign: 'center',
              color: mutedForeground,
              fontSize: 12,
              marginTop: layouts.padding,
            }}
          >
            正在加载更多单词...
          </Text>
        )}
      </View>
    </View>
  );
}