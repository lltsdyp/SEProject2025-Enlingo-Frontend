import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { MasonryFlashList, ListRenderItemInfo } from "@shopify/flash-list";
import { Image } from 'expo-image';
import { RecommendVideoResponse, RecommendVideoFetchResponse } from '@/api/models';
import { contentApiClient } from '@/api';
import { useCourse } from '@/context/course';

// 卡片组件保持不变
const QuestCard = ({ item }: { item: RecommendVideoResponse }) => {
  return (
    <Pressable style={[styles.cardContainer, { height: item.height }]}>
      <Image
        source={{ uri: item.cover }}
        style={styles.thumbnail}
        contentFit="cover"
        transition={300}
      />
      <View style={styles.titleOverlay}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      </View>
    </Pressable>
  );
};


// Quests 屏幕主组件
export default function Quests() {
  const [videos, setVideos] = useState<RecommendVideoResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const { courseProgress, setCourseProgress } = useCourse();


  // [下拉刷新] 1. 添加一个新的 state 用于控制刷新动画的显示
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 数据加载逻辑 loadVideos 保持不变
  const loadVideos = useCallback(async (isInitialLoad = false) => {
    // 防止在正在加载或没有更多数据时重复请求
    if (isLoading || (!isInitialLoad && !hasNextPage)) {
      return;
    }

    setIsLoading(true);

    try {
      const beforeCursor = nextCursor && !isInitialLoad ? parseInt(nextCursor, 10) : undefined;

      if (nextCursor && !isInitialLoad && isNaN(beforeCursor as number)) {
        console.error("无效的游标格式:", nextCursor);
        setIsLoading(false);
        return;
      }
      const statusStr=`${courseProgress.sectionIdx}-${courseProgress.chapterIdx}-${courseProgress.lessonIdx}-${courseProgress.exerciseIdx}`;

      // 如果是初始加载或刷新，游标应该为 undefined
      const cursorForAPI = isInitialLoad ? undefined : beforeCursor;
      const response = await contentApiClient.recommendGetGet(2, undefined, cursorForAPI,statusStr);
      const apiData: RecommendVideoFetchResponse = response.data;

      if (apiData.data) {
        setVideos(prevVideos => isInitialLoad ? apiData.data! : [...prevVideos, ...apiData.data!]);
        setHasNextPage(apiData.hasNextPage);
        setNextCursor(apiData.nextCursor || null);
      }
    } catch (error) {
      console.error("获取推荐视频失败:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasNextPage, nextCursor]);

  // 组件首次加载时触发数据请求的 useEffect 保持不变
  useEffect(() => {
    loadVideos(true);
  }, []);

  // [下拉刷新] 2. 创建一个当用户下拉时触发的回调函数
  const onRefresh = useCallback(async () => {
    console.log("正在执行下拉刷新...");
    setIsRefreshing(true); // 开始刷新，显示刷新动画
    await loadVideos(true); // 调用加载函数，并传入 true 来重置数据
    setIsRefreshing(false); // 加载完成后，隐藏刷新动画
  }, []); // 使用空的依赖数组，因为该函数不依赖任何外部状态

  // renderItem 函数保持不变
  const renderQuestItem = ({ item }: ListRenderItemInfo<RecommendVideoResponse>) => (
    <QuestCard item={item} />
  );

  // 列表页脚组件
  const ListFooterComponent = () => {
    // 当加载更多（而不是刷新时）并且有视频数据时，显示底部的加载动画
    if (isLoading && !isRefreshing) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      );
    }
    // 当没有更多页面时，显示提示信息
    if (!hasNextPage && videos.length > 0) {
      return (
        <View style={styles.footer}>
          <Text>没有更多视频了</Text>
        </View>
      );
    }
    return null;
  };

  // 初始加载占位符保持不变
  if (isLoading && videos.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>正在加载推荐视频...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MasonryFlashList
        data={videos}
        keyExtractor={(item: RecommendVideoResponse) => item.id.toString()}
        numColumns={2}
        renderItem={renderQuestItem}
        estimatedItemSize={250}
        contentContainerStyle={styles.listContainer}
        // 实现无限滚动
        onEndReached={() => loadVideos()}
        onEndReachedThreshold={0.1}
        ListFooterComponent={ListFooterComponent}
        // [下拉刷新] 3. 将 state 和回调函数传递给列表组件
        onRefresh={onRefresh}
        refreshing={isRefreshing}
      />
    </View>
  );
}

// 样式表保持不变
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 5,
    paddingVertical: 10,
  },
  cardContainer: {
    margin: 5,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  thumbnail: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  title: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  }
});