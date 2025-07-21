import { View, ViewProps } from "react-native";

// 卡片容器
export function Card(props: ViewProps) {
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: "#fff",
          borderRadius: 12,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 4,
          elevation: 3,
          marginBottom: 16,
          overflow: "hidden", // 防止子元素溢出圆角
        },
        props.style,
      ]}
    >
      {props.children}
    </View>
  );
}

// 卡片内容区域
export function CardContent(props: ViewProps) {
  return (
    <View
      {...props}
      style={[
        {
          padding: 16,
        },
        props.style,
      ]}
    >
      {props.children}
    </View>
  );
}
