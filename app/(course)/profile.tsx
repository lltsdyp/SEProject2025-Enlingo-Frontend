import { Text, View } from "@/components/themed";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Profile() {
  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "flex-start" }}>
      {/* 顶部用户信息 */}
      <Card>
        <CardContent style={{ alignItems: "center", paddingVertical: 24 }}>
          {/* 头像占位 */}
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: "#e2e8f0",
              marginBottom: 12,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#64748b", fontWeight: "bold" }}>头像</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>无限边界</Text>
          <Text style={{ color: "#64748b", marginTop: 4 }}>user@example.com</Text>
          <Button style={{ marginTop: 16 }}>编辑资料</Button>
        </CardContent>
      </Card>

      {/* 个人简介 */}
      <Card>
        <CardContent>
          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>个人简介</Text>
          <Text style={{ color: "#475569" }}>
            喜欢编程、热爱学习，致力于打造优质的前端体验，享受解决问题的过程。
          </Text>
        </CardContent>
      </Card>

      {/* 联系方式 */}
      <Card>
        <CardContent>
          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>联系方式</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ color: "#64748b" }}>电话：</Text>
            <Text>+86 123-456-7890</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ color: "#64748b" }}>地址：</Text>
            <Text>上海市 浦东新区</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#64748b" }}>个人网站：</Text>
            <Text>https://myprofile.site</Text>
          </View>
        </CardContent>
      </Card>

      {/* 退出按钮 */}
      <View style={{ marginTop: 24, alignItems: "center" }}>
        <Button variant="ghost" style={{ width: 160 }}>退出登录</Button>
      </View>
    </View>
  );
}
