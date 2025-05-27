"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Loader2, GraduationCap, BookOpen, Bookmark } from "lucide-react";
import { motion } from "framer-motion";

interface CourseSelectorGridProps {
  selectedExam: string;
  selectedSubject: string;
  selectedChapter: string;
  subjects: { name: string; chapters: { chapterNumber: number }[] }[];
  isLoading: boolean;
  onExamChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onChapterChange: (value: string) => void;
}

const competitiveExams = ["UPSC", "SSC", "Banking", "Railways", "State PSC", "GATE"];

const MotionCard = motion(Card);

export default function CourseSelectorGrid({
  selectedExam,
  selectedSubject,
  selectedChapter,
  subjects,
  isLoading,
  onExamChange,
  onSubjectChange,
  onChapterChange,
}: CourseSelectorGridProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <MotionCard
        className="p-6 bg-white/90 backdrop-blur-sm border border-blue-100 shadow-md hover:shadow-lg transition-all duration-300"
        variants={item}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-blue-100 rounded-full">
            <GraduationCap className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-blue-900">Exam</h2>
        </div>
        <Select value={selectedExam} onValueChange={onExamChange}>
          <SelectTrigger className="bg-white border-blue-200 focus:ring-blue-500">
            <SelectValue placeholder="Choose your exam" />
          </SelectTrigger>
          <SelectContent>
            {competitiveExams.map((exam) => (
              <SelectItem key={exam} value={exam}>{exam}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </MotionCard>

      <MotionCard
        className={`p-6 bg-white/90 backdrop-blur-sm border border-blue-100 shadow-md hover:shadow-lg transition-all duration-300 ${
          !selectedExam ? "opacity-50 pointer-events-none" : ""
        }`}
        variants={item}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-blue-100 rounded-full">
            <BookOpen className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-blue-900">Subject</h2>
        </div>
        <Select
          value={selectedSubject}
          onValueChange={onSubjectChange}
          disabled={!selectedExam || isLoading}
        >
          <SelectTrigger className="bg-white border-blue-200 focus:ring-blue-500">
            <SelectValue
              placeholder={isLoading ? "Loading subjects..." : "Choose your subject"}
            />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((subject) => (
              <SelectItem key={subject.name} value={subject.name}>{subject.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isLoading && (
          <div className="mt-2 flex justify-center">
            <div className="animate-pulse h-1 w-full bg-blue-200 rounded"></div>
          </div>
        )}
      </MotionCard>

      <MotionCard
        className={`p-6 bg-white/90 backdrop-blur-sm border border-blue-100 shadow-md hover:shadow-lg transition-all duration-300 ${
          !selectedSubject ? "opacity-50 pointer-events-none" : ""
        }`}
        variants={item}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-blue-100 rounded-full">
            <Bookmark className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-blue-900">Chapter</h2>
        </div>
        <Select
          value={selectedChapter}
          onValueChange={onChapterChange}
          disabled={!selectedSubject || isLoading}
        >
          <SelectTrigger className="bg-white border-blue-200 focus:ring-blue-500">
            <SelectValue
              placeholder={isLoading ? "Loading chapters..." : "Choose your chapter"}
            />
          </SelectTrigger>
          <SelectContent>
            {subjects
              .find((s) => s.name === selectedSubject)
              ?.chapters.map((chapter) => (
                <SelectItem key={chapter.chapterNumber} value={chapter.chapterNumber.toString()}>
                  Chapter {chapter.chapterNumber}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {isLoading && (
          <div className="mt-2 flex justify-center">
            <div className="animate-pulse h-1 w-full bg-blue-200 rounded"></div>
          </div>
        )}
      </MotionCard>

      {isLoading && (
        <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-center items-center">
          <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
          <span className="ml-2 text-blue-600">Loading...</span>
        </div>
      )}
    </motion.div>
  );
}