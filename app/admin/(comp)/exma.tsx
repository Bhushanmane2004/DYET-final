"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2, BookOpen, FileQuestion, GraduationCap, Clock, Target, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import CourseSelectorGrid from "./CourseSelectorGrid";
import NotesViewer from "./NotesViewer";
import QuizSection from "./QuizSection";

// Define interfaces for data structures
interface Chapter {
  chapterNumber: number;
  notesFileUrl: string;
  summary: string;
  quiz: { question: string; options: string[]; answer: string }[];
}

interface Subject {
  name: string;
  chapters: Chapter[];
}

type ViewMode = "notes" | "quiz";

export default function Exams() {
  const { isLoaded, user } = useUser();
  // State for exam selection and data
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedChapterData, setSelectedChapterData] = useState<Chapter | null>(null);
  const [quiz, setQuiz] = useState<{ question: string; options: string[]; answer: string }[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<{ score: number; total: number } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("notes");

  // Get user details from Clerk
  const userId = user?.id || null;
  const userName = user?.fullName || "Unknown User";

  // Fetch subjects when exam or userId changes
  useEffect(() => {
    if (selectedExam && userId) {
      fetchSubjects(selectedExam);
    }
  }, [selectedExam, userId]);

  // Log notes access when chapter data is loaded and view mode is notes
  useEffect(() => {
    if (selectedChapterData && userId && viewMode === "notes") {
      logNotesAccess();
    }
  }, [selectedChapterData, userId, viewMode]);

  // Fetch subjects for the selected exam
  const fetchSubjects = async (exam: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/notes?exam=${encodeURIComponent(exam)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();

      if (data.exams && data.exams.length > 0) {
        let allSubjects: Subject[] = [];
        data.exams.forEach((exam: any) => {
          if (exam.subjects && Array.isArray(exam.subjects)) {
            allSubjects = [...allSubjects, ...exam.subjects];
          }
        });

        // Deduplicate subjects by name
        const uniqueSubjects = Array.from(
          new Map(allSubjects.map((subject) => [subject.name, subject])).values()
        );

        setSubjects(uniqueSubjects);
      } else {
        setSubjects([]);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setSubjects([]);
      toast.error("Failed to load subjects. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Log notes access activity to the server
  const logNotesAccess = async () => {
    if (!userId || !selectedExam || !selectedSubject || !selectedChapter) {
      console.warn("Cannot log notes access: Missing required fields", {
        userId,
        selectedExam,
        selectedSubject,
        selectedChapter,
      });
      return;
    }

    const chapterNumber = parseInt(selectedChapter);
    if (isNaN(chapterNumber)) {
      console.warn("Invalid chapter number:", selectedChapter);
      toast.error("Invalid chapter selection.");
      return;
    }

    try {
      const response = await fetch("/api/student-activity-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userName,
          exam: selectedExam,
          subject: selectedSubject,
          chapterNumber,
          activityType: "notes_access",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      console.log("Notes access logged successfully:", {
        userId,
        exam: selectedExam,
        subject: selectedSubject,
        chapterNumber,
      });
    } catch (error) {
      console.error("Error logging notes access:", error);
      toast.error("Failed to log notes access. Please try again.");
    }
  };

  // Handle exam selection change
  const handleExamChange = (value: string) => {
    setSelectedExam(value);
    setSelectedSubject("");
    setSelectedChapter("");
    setSubjects([]);
    setSelectedChapterData(null);
    setQuiz([]);
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setViewMode("notes");
  };

  // Handle subject selection change
  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
    setSelectedChapter("");
    setSelectedChapterData(null);
    setQuiz([]);
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setViewMode("notes");
  };

  // Handle chapter selection change
  const handleChapterChange = (value: string) => {
    setSelectedChapter(value);
    const subject = subjects.find((s) => s.name === selectedSubject);
    const chapter = subject?.chapters.find((c) => c.chapterNumber.toString() === value);
    if (chapter) {
      setSelectedChapterData(chapter);
      // Shuffle quiz and limit to 10 questions
      const shuffledQuiz = chapter.quiz.sort(() => 0.5 - Math.random());
      setQuiz(shuffledQuiz.slice(0, Math.min(10, shuffledQuiz.length)));
    } else {
      setSelectedChapterData(null);
      setQuiz([]);
    }
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setViewMode("notes");
  };

  // Handle quiz answer changes
  const handleAnswerChange = (questionIndex: string, answer: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  // Submit quiz and log results
  const handleSubmitQuiz = async () => {
    if (!userId || !selectedExam || !selectedSubject || !selectedChapter) {
      console.warn("Cannot submit quiz: Missing required fields", {
        userId,
        selectedExam,
        selectedSubject,
        selectedChapter,
      });
      toast.error("Please select all required fields.");
      return;
    }

    const chapterNumber = parseInt(selectedChapter);
    if (isNaN(chapterNumber)) {
      console.warn("Invalid chapter number:", selectedChapter);
      toast.error("Invalid chapter selection.");
      return;
    }

    const score = quiz.reduce((acc, question, index) => {
      return userAnswers[index.toString()] === question.answer ? acc + 1 : acc;
    }, 0);

    try {
      const response = await fetch("/api/student-activity-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userName,
          exam: selectedExam,
          subject: selectedSubject,
          chapterNumber,
          activityType: "quiz_submission",
          quizResult: {
            score,
            totalQuestions: quiz.length,
            answers: userAnswers,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      toast.success("Quiz submitted successfully!");
    } catch (error) {
      console.error("Error logging quiz submission:", error);
      toast.error("Failed to submit quiz. Please try again.");
      return;
    }

    setQuizSubmitted(true);
    setQuizScore({ score, total: quiz.length });
  };

  // Toggle between notes and quiz view modes
  const toggleViewMode = (mode: ViewMode) => {
    setViewMode(mode);
  };

  // Loading state UI
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-32 right-24 w-24 h-24 bg-gradient-to-br from-amber-200 to-orange-200 rounded-2xl rotate-12 opacity-15"></div>
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_24%,rgba(68,68,68,.02)_25%,rgba(68,68,68,.02)_26%,transparent_27%,transparent_74%,rgba(68,68,68,.02)_75%,rgba(68,68,68,.02)_76%,transparent_77%,transparent)] bg-[length:40px_40px]"></div>
        </div>

        <div className="flex flex-col items-center gap-6 bg-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-gray-200 relative z-10">
          <div className="relative">
            <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
            <div className="absolute inset-0 h-12 w-12 rounded-full bg-indigo-100 animate-ping"></div>
          </div>
          <div className="text-center">
            <p className="text-indigo-800 font-semibold text-lg mb-2">Loading your exam portal...</p>
            <p className="text-indigo-600 text-sm">Please wait while we prepare your dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  // Authentication error UI
  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-red-100 to-pink-100 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-32 right-24 w-32 h-32 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl rotate-12 opacity-15"></div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-12 rounded-3xl shadow-2xl max-w-md w-full text-center border border-gray-200 relative z-10">
          <div className="bg-gradient-to-br from-red-500 to-pink-500 p-4 rounded-2xl w-fit mx-auto mb-6">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Please sign in to access your personalized exam materials and track your progress.
          </p>
          <button className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 font-medium shadow-lg transform hover:-translate-y-1">
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-32 right-24 w-48 h-48 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl rotate-12 opacity-10"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-rose-50 to-pink-50 rounded-full opacity-30"></div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_24%,rgba(68,68,68,.02)_25%,rgba(68,68,68,.02)_26%,transparent_27%,transparent_74%,rgba(68,68,68,.02)_75%,rgba(68,68,68,.02)_76%,transparent_77%,transparent)] bg-[length:50px_50px]"></div>
      </div>

      <div className="py-12 px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header section */}
          <div className="text-center mb-16">
            <div className="inline-block mb-6">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 rounded-full text-white text-sm font-semibold uppercase tracking-wider shadow-lg">
                Competitive Exam Portal
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="text-gray-800">Master Your</span>{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Exam Preparation
              </span>
              <br />
              <span className="text-gray-700">Starts Here</span>
            </h1>

            {/* Decorative elements */}
            <div className="flex justify-center items-center mt-6 space-x-2 mb-8">
              <div className="w-12 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
              <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
              <div className="w-12 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
            </div>

            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              Select your exam details below to access comprehensive study materials,
              interactive quizzes, and personalized preparation tailored for success.
            </p>

            {/* Welcome message with user info */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto shadow-lg border border-gray-200">
              <div className="flex items-center justify-center space-x-3">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-2 rounded-xl">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Welcome back,</p>
                  <p className="font-semibold text-gray-800">{userName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Exam selector */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-200 mb-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Exam Selection
              </h2>
              <p className="text-gray-600">Choose your exam to get started</p>
            </div>

            <CourseSelectorGrid
              selectedExam={selectedExam}
              selectedSubject={selectedSubject}
              selectedChapter={selectedChapter}
              subjects={subjects}
              isLoading={isLoading}
              onExamChange={handleExamChange}
              onSubjectChange={handleSubjectChange}
              onChapterChange={handleChapterChange}
            />
          </div>

          {selectedChapterData && (
            <div className="space-y-8 transition-all duration-500 ease-in-out">
              {/* Progress breadcrumb */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
                      {selectedExam}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                      {selectedSubject}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
                      Chapter {selectedChapter}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Est. 30 min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Target className="h-4 w-4" />
                      <span>{quiz.length} Questions</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* View mode toggle */}
              <div className="flex justify-center">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-200">
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleViewMode("notes")}
                      className={`group flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                        viewMode === "notes"
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform -translate-y-1"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                      }`}
                    >
                      <BookOpen className={`h-5 w-5 transition-transform duration-300 ${
                        viewMode === "notes" ? "scale-110" : "group-hover:scale-105"
                      }`} />
                      <span>Study Materials</span>
                      {viewMode === "notes" && (
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      )}
                    </button>

                    <button
                      onClick={() => toggleViewMode("quiz")}
                      disabled={quiz.length === 0}
                      className={`group flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                        viewMode === "quiz"
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg transform -translate-y-1"
                          : quiz.length === 0
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                      }`}
                    >
                      <FileQuestion className={`h-5 w-5 transition-transform duration-300 ${
                        viewMode === "quiz" ? "scale-110" : "group-hover:scale-105"
                      }`} />
                      <span>Take Quiz</span>
                      {viewMode === "quiz" && (
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      )}
                      {quiz.length === 0 && (
                        <span className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Content display */}
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
                {viewMode === "notes" && (
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-3 rounded-xl">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">Study Materials</h3>
                        <p className="text-gray-600">Chapter {selectedChapter} • {selectedSubject}</p>
                      </div>
                    </div>
                    <NotesViewer unitData={selectedChapterData} />
                  </div>
                )}

                {viewMode === "quiz" && quiz.length > 0 && (
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-3 rounded-xl">
                        <FileQuestion className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">Interactive Quiz</h3>
                        <p className="text-gray-600">Test your understanding with {quiz.length} questions</p>
                      </div>
                    </div>
                    <QuizSection
                      quiz={quiz}
                      userAnswers={userAnswers}
                      onAnswerChange={handleAnswerChange}
                      onSubmitQuiz={handleSubmitQuiz}
                      quizSubmitted={quizSubmitted}
                      quizScore={quizScore}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}