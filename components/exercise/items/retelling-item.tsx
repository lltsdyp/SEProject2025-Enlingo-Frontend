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
import { aiApiClient, contentApiClient } from "@/api";
import { AxiosError } from "axios";

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
  exercise,
  onContinue,
  onResult,
}: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [processingStage, setProcessingStage] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- Refs ---
  const recordingRef = useRef<Audio.Recording | null>(null);
  const mediaRecorderRef = useRef<MediaRecorderRef>({ current: null });
  const audioChunksRef = useRef<Blob[]>([]);

  // 当 isSuccess 状态改变时，调用 onResult 回调
  useEffect(() => {
    if (isSuccess !== null) {
      onResult(isSuccess);
    }
  }, [isSuccess]);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // --- 核心录音逻辑 ---
  // (变动 7: 全新功能) 新增的轮询函数，这是实现异步任务结果获取的核心。
  // 最开始的版本完全没有此功能。
  const pollForResult = (jobId: string) => {
    const maxAttempts = 20; // 最多轮询20次（例如 20 * 2s = 40s 后超时）
    let attempts = 0;

    const poll = async () => {
      // 检查是否已达到最大尝试次数
      if (attempts >= maxAttempts) {
        // 清除定时器以停止轮询
        clearInterval(pollingIntervalRef.current!);
        pollingIntervalRef.current = null; // 标记为已停止

        // 设置UI状态为失败
        setError("分析超时，请稍后再试或检查网络连接。");
        setIsSuccess(false);
        setIsUploading(false); // 结束“处理中”状态
        setProcessingStage(null);
        return; // 退出函数
      }
      
      attempts++;

      try {
        console.log(`Polling for job ${jobId}, attempt #${attempts}`); // 方便调试
        const response = await aiApiClient.apiV1ResultsJobIdGet(jobId);

        // 假设API的响应数据模型是已知的，可以进行类型断言以获得更好的类型提示
        // 如果没有精确类型，使用 `any` 也可以
        const data = response.data as {
          status: 'completed' | 'processing' | 'failed';
          stage: string | null;
          error: string | null;
          result: {
            overall_score: number;
            // ... 其他结果字段
          } | null;
        };

        // 根据API返回的状态更新UI
        switch (data.status) {
          case "completed":
            // 任务成功完成
            clearInterval(pollingIntervalRef.current!);
            pollingIntervalRef.current = null;

            // 根据业务逻辑判断成功或失败（例如，分数是否达标）
            const success = (data.result?.overall_score ?? 0) > 75;
            setIsSuccess(success);
            
            if (!success) {
              setError("评估未通过，请再试一次。");
            }
            
            setIsUploading(false);
            setProcessingStage(null);
            break;

          case "failed":
            // 任务处理失败
            clearInterval(pollingIntervalRef.current!);
            pollingIntervalRef.current = null;

            // 使用后端返回的明确错误信息
            setError(data.error || "分析失败，发生未知错误。");
            setIsSuccess(false);
            setIsUploading(false);
            setProcessingStage(null);
            break;

          case "processing":
            // 任务仍在处理中，更新UI提示
            setProcessingStage(data.stage || "正在分析...");
            // 不做任何操作，等待下一次轮询
            break;
            
          default:
            // 收到未知的状态，记录日志，继续轮询
            console.warn(`Received unknown status from API: ${data.status}`);
            break;
        }
      } catch (err) {
        const axiosError = err as AxiosError;
        // 检查是否是 404 错误
        if (axiosError.response?.status === 404) {
          // 404 是一个明确的、可立即终止的错误
          clearInterval(pollingIntervalRef.current!);
          pollingIntervalRef.current = null;

          setError("任务ID未找到，提交可能已失败。");
          setIsSuccess(false);
          setIsUploading(false);
          setProcessingStage(null);
        } else {
          // 对于其他网络错误（如 500 服务器错误、网络中断），
          // 我们选择不立即终止轮询，而是允许它在下一次尝试时自动恢复。
          // 这样可以增强应用的健壮性，以应对暂时的网络抖动。
          console.error("Polling request failed:", axiosError.message);
        }
      }
    };

    // 立即执行第一次轮询，然后设置定时器进行后续轮询
    poll();
    pollingIntervalRef.current = setInterval(poll, 2000); // 每 2 秒轮询一次
  };
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

  // (变动 6: 完全重写) 此函数从一个简单的回调调用，被重写为处理完整API流程的核心业务函数。
  const handleSendRecording = async (
    recording: File | { uri: string; name: string; type: string }
  ) => {
    // 在最开始的版本中，此函数仅有一行: `await onRetellingSubmit(recording);`
    // 现在，它负责整个工作流：
    try {
      // 步骤 A: (新) 从 props.exercise.content 创建摘要文件。原版本不关心此数据。
      const summaryBlob = new Blob([exercise.content], { type: "text/plain" });
      const audioPayload = Platform.OS === 'web'
        ? (recording as File)
        : { uri: (recording as any).uri, name: (recording as any).name, type: (recording as any).type };

      setProcessingStage("正在上传文件...");

      // 步骤 B: (新) 调用生成的API客户端方法启动分析任务，替换了原有的 onRetellingSubmit()。
      const response = await aiApiClient.apiV1AnalyzePost(summaryBlob, audioPayload);

      // 步骤 C: (新) 从API响应中获取 job_id，这是后续轮询的关键。
      const job_id = (response.data as any).job_id;
      if (!job_id) { throw new Error("未能从API响应中获取 job_id。"); }

      // 步骤 D: (新) 调用新增的轮询函数，开始获取最终结果。
      pollForResult(job_id);

    } catch (err: any) {
      // 步骤 E: (新) 增强了错误处理，能从Axios错误中提取后端返回的具体信息。
      const errorMessage = err.response?.data?.message || err.message || "提交录音时发生网络错误。";
      setError(errorMessage);
      setIsSuccess(false);
      setIsUploading(false);
      setProcessingStage(null);
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
        onPressCheck={() => { }}
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