import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { MasonryFlashList, ListRenderItemInfo } from "@shopify/flash-list"; 
import { Image } from 'expo-image';

// --- 定义数据类型 (这是修复问题的核心步骤) ---
interface RecommendVideo {
  id: string;
  title: string;
  cover: string;
  height: number;
  eid: number;
}

interface ApiResponse {
  data: RecommendVideo[];
  count: number;
  hasNextPage: boolean;
  nextCursor: string | null;
}

// --- 你的视频数据 ---
// 明确告诉 TypeScript，这个数组里的每一项都符合 QuestVideo 类型
const recommendedVideos: RecommendVideo[] = [
  {
    id: "1",
    title: "Unit 1 Intro - A Great Start",
    cover: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    // 为了瀑布流效果，我们可以给每个卡片一个不同的高度，模拟真实场景
    // 在真实应用中，这个高度可能由图片宽高比决定
    height: 220, 
    eid:1
  },
  {
    id: "2",
    title: "Unit 2 Basics - Learn the Fundamentals of Everything and More",
    cover: "https://img.youtube.com/vi/oHg5SJYRHA0/hqdefault.jpg",
    height: 280,
    eid:1
  },
  {
    id: "3",
    title: "Unit 3 Advanced Topics",
    cover: "https://img.youtube.com/vi/ZZ5LpwO-An4/hqdefault.jpg",
    height: 240,
    eid:1
  },
  // 为了更好地展示瀑布流效果，我为你多加几条数据
  {
    id: "4",
    title: "Reviewing Previous Concepts",
    cover: "https://img.youtube.com/vi/3tmd-ClpJxA/hqdefault.jpg",
    height: 260,
    eid:1
  },
  {
    id: "5",
    title: "Special Guest Lecture: The Future of Tech",
    cover: "https://img.youtube.com/vi/jNQXAC9IVRw/hqdefault.jpg",
    height: 230,
    eid:1
  },
  {
    id: "6",
    title: "Final Project Guidelines",
    cover: "https://img.youtube.com/vi/C0DPdy98e4c/hqdefault.jpg",
    height: 270,
    eid:1
  },
];


// --- 卡片组件定义 ---
// 明确告诉 TypeScript，item prop 的类型是 QuestVideo
const QuestCard = ({ item }: { item: RecommendVideo }) => {
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


// --- Quests 屏幕主组件 ---
export default function Quests() {
  
  // --- 为 renderItem 函数定义类型 ---
  // 这是最规范的做法
  const renderQuestItem = ({ item }: ListRenderItemInfo<RecommendVideo>) => (
    <QuestCard item={item} />
  );

  return (
    <View style={styles.container}>
      <MasonryFlashList
        data={recommendedVideos}
        keyExtractor={(item: RecommendVideo) => item.id} // 也可以在这里给 item 加类型
        numColumns={2}
        renderItem={renderQuestItem} // <--- 关键修改 2: 使用带类型的函数
        estimatedItemSize={250}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
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
});