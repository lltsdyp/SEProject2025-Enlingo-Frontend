import { VideoExercise } from "@/types/course";

import { AVPlaybackSource } from "expo-av";

export const exampleVideoExercise: VideoExercise = {
  id: 1,
  type: "video",
  question: {
    en: "Watch the video and answer the questions",
    ja: "ビデオを見て質問に答えてください",
    cn: "观看视频并回答问题",
    my: "ဗီဒီယိုကိုကြည့်ပြီးမေးခွန်းတွေကိုဖြေပါ",
    th: "ดูวิดีโอและตอบคำถาม",
    es: "Mira el video y responde las preguntas",
    fr: "Regardez la vidéo et répondez aux questions",
    hi: "वीडियो देखें और प्रश्नों का उत्तर दें",
    ru: "Смотрите видео и отвечайте на вопросы",
  },
  video: {
    source: {uri: "http://26l1b06988.qicp.vip:38000/seproject-2025/test.mp4" } ,
  },
  srt: "http://26l1b06988.qicp.vip:38000/seproject-2025/test.srt",
};
