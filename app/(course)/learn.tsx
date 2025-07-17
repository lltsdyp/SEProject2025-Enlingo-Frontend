import { useState } from "react";
import { ScrollView, Image, TouchableOpacity } from "react-native";

import { CourseDetailsBar } from "@/components/course-details-bar";
import { Icon } from "@/components/icons";
import { LessonItem } from "@/components/lesson-item";
import { Metadata } from "@/components/metadata";
import { Text, View } from "@/components/themed";
import { Button } from "@/components/ui/button";
import { layouts } from "@/constants/layouts";
import { useCourseContent } from "@/content/courses/data";
import { useBreakpoint } from "@/context/breakpoints";
import { useCourse } from "@/context/course";
import { useLanguageCode } from "@/context/language";
import { useTheme } from "@/context/theme";
import { Chapter } from "@/types/course";

const CAMP = 16;
const CIRCLE_RADUIS = 48;


export default function Learn() {
  const { languageCode } = useLanguageCode();
  const { courseId, courseProgress } = useCourse();
  const { mutedForeground, border, accent } = useTheme();
  const breakpoint = useBreakpoint();
  const courseContent = useCourseContent();
  console.log("learn page");
  console.log(courseContent);


  const [headerHeight, setHeaderHeight] = useState(0);

  let isOdd = true;
  let translateX = 0;

  const currentSection = courseContent.sections[courseProgress.sectionIdx];
  if (!currentSection) return null;

  const renderCourseChapter = (chapter: Chapter, chapterIndex: number) => (
    <View
      key={chapter.id}
      style={{
        gap: layouts.padding * 4,
        paddingHorizontal: breakpoint === "sm" ? 0 : layouts.padding * 2,
      }}
    >
      <View
        style={[
          {
            flexDirection: "row",
            justifyContent: breakpoint == "md" ? "flex-start" : "space-between",
            padding: layouts.padding * 2,
            backgroundColor: accent,
            borderRadius: breakpoint === "sm" ? 0 : layouts.padding,
            alignItems: "center",
          },
          breakpoint == "sm" && {
            paddingHorizontal: layouts.padding,
          },
        ]}
      >
        <View
          style={{
            backgroundColor: accent,
            gap: layouts.padding,
            flex: 1,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
            {chapter.title[languageCode]}
          </Text>
          <Text style={{ color: mutedForeground }}>
            {chapter.description[languageCode]}
          </Text>
        </View>
        <Button
          variant="ghost"
          viewStyle={{
            padding: layouts.padding * 0.5,
          }}
        >
          <Icon name="notebook" />
        </Button>
      </View>

      <View
        style={{
          gap: layouts.padding * 2,
          alignItems: "center",
        }}
      >
        {chapter.lessons.map((lession, lessonIndex) => {
          if (translateX > CAMP || translateX < -CAMP) {
            isOdd = !isOdd;
          }

          if (lessonIndex !== 0) {
            isOdd ? (translateX += CIRCLE_RADUIS) : (translateX -= CIRCLE_RADUIS);
          }

          const isCurrentChapter = courseProgress.chapterIdx === chapterIndex;
          const isCurrentLesson =
            isCurrentChapter && courseProgress.lessonIdx === lessonIndex;
          const isFinishedLesson =
            (isCurrentChapter && lessonIndex < courseProgress.lessonIdx) ||
            chapterIndex < courseProgress.chapterIdx;
          const currentExercise = lession.exercises[courseProgress.exerciseIdx];
          console.log("progress chapter id:", courseProgress.chapterIdx, "progress lesson id:", courseProgress.lessonIdx,"current exercise:",currentExercise);
          console.log("current chapter id:", chapterIndex, "current lesson id:", lessonIndex);

          // if (!currentExercise) return null;

          return (
            <LessonItem
              key={lessonIndex}
              index={lessonIndex}
              circleRadius={CIRCLE_RADUIS}
              exerciseSetId={currentExercise}
              isCurrentLesson={isCurrentLesson}
              isFinishedLesson={isFinishedLesson}
              lessonDescription={lession.description[languageCode]}
              totalExercise={lession.exercises.length}
              style={{ transform: [{ translateX }] }}
              courseProgression={{
                sectionIdx: courseProgress.sectionIdx,
                chapterIdx: chapterIndex,
                lessonIdx: lessonIndex,
                exerciseIdx: 0,
              }}
            />
          );
        })}
      </View>
    </View>
  );

  return (
    <>
      <Metadata
        title="Learn"
        description="Learn a new lesson every day to keep your streak."
      />
      <View style={{ flex: 1, position: "relative" }}>
        <View
          style={{
            borderBottomWidth: layouts.borderWidth,
            borderBottomColor: border,
            position: "absolute",
            top: 0,
            right: 0,
            left: 0,
            zIndex: 9999,
            gap: layouts.padding * 2,
            backgroundColor: "white", // 避免重叠透明，可根据主题调整
          }}
          onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        >
          {(breakpoint === "sm" || breakpoint === "md") && courseId && (
            <CourseDetailsBar
              courseId={courseId}
              style={{
                paddingTop:
                  breakpoint == "sm" ? layouts.padding : layouts.padding * 3,
                paddingHorizontal:
                  breakpoint == "sm" ? layouts.padding : layouts.padding * 2,
              }}
            />
          )}
          <View
            style={{
              paddingBottom: layouts.padding,
              paddingTop:
                breakpoint === "sm"
                  ? 0
                  : breakpoint === "md"
                    ? layouts.padding * 2
                    : layouts.padding * 3,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: mutedForeground,
                textAlign: "center",
              }}
            >
              {currentSection.title[languageCode]}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingTop:
              breakpoint == "sm"
                ? headerHeight + layouts.padding
                : headerHeight + layouts.padding * 3,
            paddingBottom: layouts.padding * 2,
            gap: layouts.padding * 4,
          }}
          showsVerticalScrollIndicator={false}
        >
          {currentSection.chapters.map((chapter, index) =>
            renderCourseChapter(chapter, index)
          )}
        </ScrollView>
      </View>
    </>
  );
}
