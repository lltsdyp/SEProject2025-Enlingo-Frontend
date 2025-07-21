import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Profile() {
  return (
    <div style={{ flex: 1, backgroundColor: "#f8fafc", fontFamily: "system-ui, sans-serif", minHeight: "100vh" }}>
      {/* 背景装饰 */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 200,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      />
      
      <div style={{ flex: 1, padding: 20, paddingTop: 60, position: "relative" }}>
        {/* 用户信息卡片 */}
        <Card style={{ 
          marginBottom: 24, 
          borderRadius: 16,
          borderWidth: 0
        }}>
          <CardContent style={{ 
            display: "flex",
            flexDirection: "column",
            alignItems: "center", 
            paddingTop: 40,
            paddingBottom: 40,
            paddingLeft: 24,
            paddingRight: 24,
            position: "relative"
          }}>
            {/* 头像 */}
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                marginBottom: 16,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 4,
                borderColor: "white",
                marginTop: -20
              }}
            >
              <span style={{ color: "white", fontSize: 48, fontWeight: "bold" }}>👤</span>
            </div>
            
            <h2 style={{ 
              fontSize: 28, 
              fontWeight: "700",
              color: "#1e293b",
              marginBottom: 4,
              margin: "0 0 4px 0"
            }}>
              无限边界
            </h2>
            
            <div style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 20,
              backgroundColor: "#f1f5f9",
              paddingLeft: 12,
              paddingRight: 12,
              paddingTop: 6,
              paddingBottom: 6,
              borderRadius: 20
            }}>
              <span style={{ marginRight: 8, fontSize: 16 }}>📧</span>
              <span style={{ color: "#64748b", fontSize: 14 }}>user@example.com</span>
            </div>
            
            <Button style={{ 
              backgroundColor: "#667eea",
              borderRadius: 25,
              paddingLeft: 24,
              paddingRight: 24,
              paddingTop: 12,
              paddingBottom: 12,
              borderWidth: 0
            }}>
              <span style={{ marginRight: 8, fontSize: 16 }}>✏️</span>
              <span style={{ color: "white", fontWeight: "600" }}>编辑资料</span>
            </Button>
          </CardContent>
        </Card>

        {/* 个人简介 */}
        <Card style={{ 
          marginBottom: 20,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#e2e8f0"
        }}>
          <CardContent style={{ padding: 24 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 16
            }}>
              <div style={{
                width: 4,
                height: 20,
                backgroundColor: "#667eea",
                borderRadius: 2,
                marginRight: 12
              }} />
              <h3 style={{ 
                fontSize: 18, 
                fontWeight: "700",
                color: "#1e293b",
                margin: 0
              }}>
                个人简介
              </h3>
            </div>
            <p style={{ 
              color: "#475569",
              lineHeight: "24px",
              fontSize: 15,
              margin: 0
            }}>
              喜欢编程、热爱学习，致力于打造优质的前端体验，享受解决问题的过程。探索技术的边界，创造无限可能。
            </p>
          </CardContent>
        </Card>

        {/* 联系方式 */}
        <Card style={{ 
          marginBottom: 32,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#e2e8f0"
        }}>
          <CardContent style={{ padding: 24 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 20
            }}>
              <div style={{
                width: 4,
                height: 20,
                backgroundColor: "#667eea",
                borderRadius: 2,
                marginRight: 12
              }} />
              <h3 style={{ 
                fontSize: 18, 
                fontWeight: "700",
                color: "#1e293b",
                margin: 0
              }}>
                联系方式
              </h3>
            </div>
            
            {/* 联系信息项 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ 
                display: "flex",
                alignItems: "center",
                paddingTop: 12,
                paddingBottom: 12,
                paddingLeft: 16,
                paddingRight: 16,
                backgroundColor: "#f8fafc",
                borderRadius: 12,
                marginBottom: 12
              }}>
                <span style={{ marginRight: 12, fontSize: 18 }}>📞</span>
                <span style={{ color: "#64748b", fontSize: 14, marginRight: 8 }}>电话：</span>
                <span style={{ color: "#1e293b", fontWeight: "500", fontSize: 14 }}>+86 123-456-7890</span>
              </div>
              
              <div style={{ 
                display: "flex",
                alignItems: "center",
                paddingTop: 12,
                paddingBottom: 12,
                paddingLeft: 16,
                paddingRight: 16,
                backgroundColor: "#f8fafc",
                borderRadius: 12,
                marginBottom: 12
              }}>
                <span style={{ marginRight: 12, fontSize: 18 }}>📍</span>
                <span style={{ color: "#64748b", fontSize: 14, marginRight: 8 }}>地址：</span>
                <span style={{ color: "#1e293b", fontWeight: "500", fontSize: 14 }}>上海市 浦东新区</span>
              </div>
              
              <div style={{ 
                display: "flex",
                alignItems: "center",
                paddingTop: 12,
                paddingBottom: 12,
                paddingLeft: 16,
                paddingRight: 16,
                backgroundColor: "#f8fafc",
                borderRadius: 12
              }}>
                <span style={{ marginRight: 12, fontSize: 18 }}>🌐</span>
                <span style={{ color: "#64748b", fontSize: 14, marginRight: 8 }}>网站：</span>
                <span style={{ 
                  color: "#667eea", 
                  fontWeight: "500", 
                  fontSize: 14,
                  textDecoration: "underline"
                }}>
                  myprofile.site
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 退出按钮 */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button 
            variant="ghost" 
            style={{ 
              width: 180,
              paddingTop: 12,
              paddingBottom: 12,
              borderRadius: 25,
              backgroundColor: "#fee2e2",
              borderWidth: 1,
              borderColor: "#fecaca"
            }}
          >
            <span style={{ marginRight: 8, fontSize: 16 }}>🚪</span>
            <span style={{ color: "#dc2626", fontWeight: "600" }}>退出登录</span>
          </Button>
        </div>
      </div>
    </div>
  );
}