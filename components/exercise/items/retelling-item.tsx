// components/RetellingItem.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Audio } from "expo-av";
import { ExerciseItemProps, RetellingExercise } from "@/types/course"; // 假设您的类型定义路径
import { Button } from "@/components/ui/button"; // 复用您的按钮组件
import { ExerciseItemEvent } from "./exercise-item-event";

// --- Props 和类型定义 ---

interface Props extends ExerciseItemProps {
  exercise: RetellingExercise;
  // 当录音完成并准备好发送到后端时调用
  // 对于Web，它是一个File对象；对于Native，它是一个包含URI的对象
  onRetellingSubmit: (
    recording: File | { uri: string; name: string; type: string }
  ) => Promise<boolean>; // 返回一个Promise，解析为布尔值表示成功或失败

  // 与VideoItem保持一致的回调
  onContinue: () => void;
  onResult: (success: boolean) => void;
}

// --- Web端专用的MediaRecorder引用 ---
// 我们用一个对象来包装，以便在React的refs中稳定引用
interface MediaRecorderRef {
  current: MediaRecorder | null;
}

/**
 * RetellingItem 组件
 *
 * 提供一个录音界面，让用户可以复述听到的内容。
 * - 点击按钮开始/停止录音。
 * - 录音结束后自动发送到后端进行评估。
 * - 根据后端的返回结果显示成功或失败状态。
 */
export function RetellingItem({
  onRetellingSubmit,
  onContinue,
  onResult,
}: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Refs ---
  // Expo AV (React Native) 的录音对象引用
  const recordingRef = useRef<Audio.Recording | null>(null);
  // Web API (Web) 的 MediaRecorder 引用
  const mediaRecorderRef = useRef<MediaRecorderRef>({ current: null });
  // 用于存储Web端录音数据块
  const audioChunksRef = useRef<Blob[]>([]);

  // 当 isSuccess 状态改变时，调用 onResult 回调
  useEffect(() => {
    if (isSuccess !== null) {
      onResult(isSuccess);
    }
  }, [isSuccess]);

  // --- 核心录音逻辑 ---

  const handleToggleRecording = async () => {
    // 如果正在录音，则停止
    if (isRecording) {
      await stopRecording();
    } else {
      // 否则，开始录音
      await startRecording();
    }
  };

  const startRecording = async () => {
    // 重置状态
    setIsSuccess(null);
    setError(null);
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      setError("无法访问麦克风。请检查您的设备权限。");
      console.error("Microphone permission not granted.");
      return;
    }

    setIsRecording(true);
    try {
      if (Platform.OS === "web") {
        // --- Web端录音逻辑 ---
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current.current = recorder;
        audioChunksRef.current = []; // 清空之前的数据块

        recorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        recorder.onstop = async () => {
          // 停止媒体流轨道，释放麦克风占用
          stream.getTracks().forEach((track) => track.stop());
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          const audioFile = new File([audioBlob], "retelling.webm", {
            type: "audio/webm",
          });
          await handleSendRecording(audioFile);
        };

        recorder.start();
      } else {
        // --- React Native端录音逻辑 ---
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recordingRef.current = recording;
        await recordingRef.current.startAsync();
      }
    } catch (err) {
      console.error("Failed to start recording", err);
      setError("启动录音失败。");
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    setIsRecording(false);
    setIsUploading(true); // 开始显示上传中状态

    try {
      if (Platform.OS === "web") {
        // --- Web端停止逻辑 ---
        mediaRecorderRef.current.current?.stop();
      } else {
        // --- React Native端停止逻辑 ---
        if (!recordingRef.current) return;
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        if (uri) {
          const recordingFile = {
            uri,
            name: `retelling-${Date.now()}.m4a`,
            type: "audio/m4a",
          };
          await handleSendRecording(recordingFile);
        }
        recordingRef.current = null;
      }
    } catch (err) {
      console.error("Failed to stop or process recording", err);
      setError("停止录音或处理失败。");
      setIsUploading(false);
    }
  };

  // --- 数据处理与提交 ---

  const handleSendRecording = async (
    recording: File | { uri: string; name: string; type: string }
  ) => {
    try {
      // 调用父组件传入的回调函数，将录音数据发送到后端
      const success = await onRetellingSubmit(recording);
      setIsSuccess(success);
      if (!success) {
        setError("复述评估失败，请再试一次。");
      }
    } catch (err) {
      console.error("Error submitting retelling:", err);
      setError("提交录音时发生网络错误。");
      setIsSuccess(false);
    } finally {
      setIsUploading(false);
    }
  };

  const requestMicrophonePermission = async (): Promise<boolean> => {
    if (Platform.OS === "web") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        // 立即停止，我们只是为了检查权限
        stream.getTracks().forEach((track) => track.stop());
        return true;
      } catch (err) {
        return false;
      }
    } else {
      const { status } = await Audio.requestPermissionsAsync();
      return status === "granted";
    }
  };

  // --- UI渲染 ---

  // 录音按钮的动态内容
  const renderButtonContent = () => {
    if (isUploading) {
      return (
        <>
          <ActivityIndicator size="small" color="#ffffff" />
          <Text style={styles.buttonText}>处理中...</Text>
        </>
      );
    }
    if (isRecording) {
      return (
        <>
          <View style={styles.stopIcon} />
          <Text style={styles.buttonText}>停止录音</Text>
        </>
      );
    }
    // 默认显示录音图标和文字
    return (
      <>
        <View style={styles.micIcon} />
        <Text style={styles.buttonText}>点击开始录音</Text>
      </>
    );
  };

  /**
   * (新) 创建一个处理 "Continue" 按钮点击事件的函数
   * 这会将所有重置状态的逻辑封装在一个地方。
   */
  const handlePressContinue = () => {
    setIsSuccess(null);
    setError(null);
    onContinue();
  };

  return (
    // (已修改) 将外部容器的样式从 wrapper 改为与 TranslateItem 一致
    <View
      style={{
        justifyContent: "space-between",
        flex: 1,
        position: "relative",
      }}
    >
      {/* 主要内容区域 */}
      <View style={styles.container}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordButtonActive,
            // 当有结果或正在上传时，禁用录音按钮
            (isUploading || isSuccess !== null) && styles.disabledButton,
          ]}
          onPress={handleToggleRecording}
          disabled={isUploading || isSuccess !== null}
        >
          {renderButtonContent()}
        </TouchableOpacity>

        {/* 错误信息显示在录音按钮下方 */}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      {/* 
        (已修改) 这是核心改动：
        我们用 ExerciseItemEvent 组件替换了之前自定义的页脚。
        这确保了所有练习题的底部UI和行为都是一致的。
      */}
      <ExerciseItemEvent
        // Retelling 没有 "Check" 按钮，因为提交是自动的。
        // 所以我们将 check 按钮一直保持禁用状态。
        checkButtonDisabled={true}
        // 当失败时，我们可以利用 correctAnswer 属性显示一条提示信息。
        correctAnswer={
          isSuccess === false ? "There was an issue. Please try again." : ""
        }
        isSuccess={isSuccess}
        // 将我们新创建的函数传递给 "Check" 按钮的回调
        // 在此场景下，它不会被触发，但 prop 是必需的
        onPressCheck={() => {}}
        // 将我们新创建的函数传递给 "Continue" 按钮的回调
        onPressContinue={handlePressContinue}
      />
    </View>
  );
}

// ------------------- 样式表 -------------------
const styles = StyleSheet.create({
  // wrapper 样式已被移除，因为我们采用了 TranslateItem 的布局
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  recordButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.5)",
    // 移除了不兼容Native的 'transition' 属性
  },
  recordButtonActive: {
    backgroundColor: "#FF3B30",
  },
  disabledButton: {
    backgroundColor: "#8E8E93",
    opacity: 0.7,
  },
  micIcon: {
    width: 40,
    height: 40,
    backgroundColor: "white",
    borderRadius: 20,
  },
  stopIcon: {
    width: 30,
    height: 30,
    backgroundColor: "white",
    borderRadius: 4,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12,
    textAlign: "center",
  },
  errorText: {
    marginTop: 20,
    color: "#ff4d4d",
    fontSize: 16,
    textAlign: "center",
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    maxWidth: "90%",
  },
  // successText, footer, resultContainer 样式已被移除
  // 因为它们的功能现在由 ExerciseItemEvent 组件处理
});