"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2, BookOpen, FileQuestion, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import CourseSelectorGrid from "./CourseSelectorGrid";
import NotesViewer from "./NotesViewer";
import QuizSection from "./QuizSection";

interface Chapter {
  chapterNumber: number;
  notesFileUrl: string;
  publicId?: string; // Added to store Cloudinary public ID
  summary: string;
  quiz: { question: string; options: string[]; answer: string }[];
}

interface Subject {
  name: string;
  chapters: Chapter[];
}

interface Unit {
  unitNumber: number;
  notesFileUrl: string;
  summary: string;
  quiz: { question: string; options: string[]; answer: string }[];
}

type ViewMode = "notes" | "quiz";

export default function Exams() {
  const { isLoaded, user } = useUser();
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
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false); // Added for update modal
  const [newNotesFile, setNewNotesFile] = useState<File | null>(null); // Added for new notes file
  const [updatedQuiz, setUpdatedQuiz] = useState<
    { question: string; options: string[]; answer: string }[]
  >([]); // Added for quiz editing

  const userId = user?.id || null;
  const userName = user?.fullName || "Unknown User";
  const isAdmin = user?.publicMetadata?.role === "admin"; // Added to check admin role

  useEffect(() => {
    if (selectedExam && userId) {
      fetchSubjects(selectedExam);
    }
  }, [selectedExam, userId]);

  useEffect(() => {
    if (selectedChapterData && userId && viewMode === "notes") {
      logNotesAccess();
    }
  }, [selectedChapterData, userId, viewMode]);

  const fetchSubjects = async (exam: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/exam?exam=${encodeURIComponent(exam)}`);
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
    setIsUpdateModalOpen(false); // Close modal on exam change
  };

  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
    setSelectedChapter("");
    setSelectedChapterData(null);
    setQuiz([]);
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setViewMode("notes");
    setIsUpdateModalOpen(false); // Close modal on subject change
  };

  const handleChapterChange = (value: string) => {
    setSelectedChapter(value);
    const subject = subjects.find((s) => s.name === selectedSubject);
    const chapter = subject?.chapters.find((c) => c.chapterNumber.toString() === value);
    if (chapter) {
      setSelectedChapterData(chapter);
      const shuffledQuiz = chapter.quiz.sort(() => 0.5 - Math.random());
      setQuiz(shuffledQuiz.slice(0, Math.min(10, shuffledQuiz.length)));
      setUpdatedQuiz(chapter.quiz); // Initialize updated quiz for editing
    } else {
      setSelectedChapterData(null);
      setQuiz([]);
      setUpdatedQuiz([]);
    }
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setViewMode("notes");
    setIsUpdateModalOpen(false); // Close modal on chapter change
  };

  const handleAnswerChange = (questionIndex: string, answer: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

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

  const toggleViewMode = (mode: ViewMode) => {
    setViewMode(mode);
  };

  // Convert Chapter to Unit format for NotesViewer
  const convertChapterToUnit = (chapter: Chapter): Unit => {
    return {
      unitNumber: chapter.chapterNumber,
      notesFileUrl: chapter.notesFileUrl,
      summary: chapter.summary,
      quiz: chapter.quiz,
    };
  };

  // Admin functionality: Update chapter
  const handleUpdateChapter = async () => {
    if (!newNotesFile && updatedQuiz.length === 0) {
      toast.error("Please provide a new notes file or update the quiz.");
      return;
    }

    const formData = new FormData();
    formData.append("exam", selectedExam);
    formData.append("subject", selectedSubject);
    formData.append("chapterNumber", selectedChapter);
    if (newNotesFile) {
      formData.append("notesFile", newNotesFile);
    }
    formData.append("quiz", JSON.stringify(updatedQuiz));

    try {
      const response = await fetch("/api/exam", {
        method: "PUT",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to update chapter");
      }
      toast.success("Chapter updated successfully!");
      setIsUpdateModalOpen(false);
      setNewNotesFile(null);
      fetchSubjects(selectedExam); // Refresh subjects
    } catch (error) {
      console.error("Error updating chapter:", error);
      toast.error("Failed to update chapter. Please try again.");
    }
  };

  // Admin functionality: Delete chapter
  const handleDeleteChapter = async () => {
    if (!confirm("Are you sure you want to delete this chapter?")) return;

    try {
      const response = await fetch("/api/exam", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam: selectedExam,
          subject: selectedSubject,
          chapterNumber: parseInt(selectedChapter),
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to delete chapter");
      }
      toast.success("Chapter deleted successfully!");
      setSelectedChapter("");
      setSelectedChapterData(null);
      setQuiz([]);
      setUpdatedQuiz([]);
      fetchSubjects(selectedExam); // Refresh subjects
    } catch (error) {
      console.error("Error deleting chapter:", error);
      toast.error("Failed to delete chapter. Please try again.");
    }
  };

  // Admin functionality: Handle quiz question changes
  const handleQuizQuestionChange = (
    index: number,
    field: "question" | "answer" | "options",
    value: string | string[]
  ) => {
    const newQuiz = [...updatedQuiz];
    newQuiz[index] = { ...newQuiz[index], [field]: value };
    setUpdatedQuiz(newQuiz);
  };

  // Admin functionality: Add a new quiz question
  const addQuizQuestion = () => {
    setUpdatedQuiz([
      ...updatedQuiz,
      { question: "", options: ["", "", "", ""], answer: "" },
    ]);
  };

  // Admin functionality: Remove a quiz question
  const removeQuizQuestion = (index: number) => {
    setUpdatedQuiz(updatedQuiz.filter((_, i) => i !== index));
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
          <p className="text-blue-800 font-medium">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <p className="text-red-600 font-medium mb-4">Authentication Required</p>
          <p className="text-gray-600">Please sign in to access the exam materials.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 text-blue-900 tracking-tight">
          Competitive Exam Portal
        </h1>
        <p className="text-center text-blue-700 mb-10 max-w-2xl mx-auto">
          Select your exam details below to access study materials and quizzes
        </p>

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

        {selectedChapterData && (
          <div className="mt-12 space-y-8 transition-all duration-500 ease-in-out animate-fadeIn">
            {/* Admin Controls */}
            {isAdmin && (
              <div className="flex justify-end gap-4 mb-6">
                <button
                  onClick={() => setIsUpdateModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  <Edit className="h-5 w-5" />
                  Update Chapter
                </button>
                <button
                  onClick={handleDeleteChapter}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Trash2 className="h-5 w-5" />
                  Delete Chapter
                </button>
              </div>
            )}

            {/* View Mode Toggle Buttons */}
            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={() => toggleViewMode("notes")}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  viewMode === "notes"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <BookOpen className="h-5 w-5" />
                Study Materials
              </button>
              <button
                onClick={() => toggleViewMode("quiz")}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  viewMode === "quiz"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                disabled={quiz.length === 0}
              >
                <FileQuestion className="h-5 w-5" />
                Take Quiz
              </button>
            </div>

            {/* Conditional Content Display */}
            {viewMode === "notes" && (
              <NotesViewer unitData={convertChapterToUnit(selectedChapterData)} />
            )}
            {viewMode === "quiz" && quiz.length > 0 && (
              <QuizSection
                quiz={quiz}
                userAnswers={userAnswers}
                onAnswerChange={handleAnswerChange}
                onSubmitQuiz={handleSubmitQuiz}
                quizSubmitted={quizSubmitted}
                quizScore={quizScore}
              />
            )}

            {/* Update Modal */}
            {isUpdateModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                  <h2 className="text-2xl font-bold mb-4">Update Chapter</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        New Notes File
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) =>
                          setNewNotesFile(e.target.files?.[0] || null)
                        }
                        className="mt-1 block w-full"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Quiz Questions</h3>
                      {updatedQuiz.map((q, index) => (
                        <div key={index} className="border p-4 mb-4 rounded-lg">
                          <label className="block text-sm font-medium text-gray-700">
                            Question {index + 1}
                          </label>
                          <input
                            type="text"
                            value={q.question}
                            onChange={(e) =>
                              handleQuizQuestionChange(index, "question", e.target.value)
                            }
                            className="mt-1 block w-full border rounded-lg p-2"
                          />
                          <label className="block text-sm font-medium text-gray-700 mt-2">
                            Options
                          </label>
                          {q.options.map((option, optIndex) => (
                            <input
                              key={optIndex}
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...q.options];
                                newOptions[optIndex] = e.target.value;
                                handleQuizQuestionChange(index, "options", newOptions);
                              }}
                              className="mt-1 block w-full border rounded-lg p-2"
                            />
                          ))}
                          <label className="block text-sm font-medium text-gray-700 mt-2">
                            Answer
                          </label>
                          <input
                            type="text"
                            value={q.answer}
                            onChange={(e) =>
                              handleQuizQuestionChange(index, "answer", e.target.value)
                            }
                            className="mt-1 block w-full border rounded-lg p-2"
                          />
                          <button
                            onClick={() => removeQuizQuestion(index)}
                            className="mt-2 text-red-600 hover:text-red-800"
                          >
                            Remove Question
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addQuizQuestion}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Add Question
                      </button>
                    </div>
                    <div className="flex justify-end gap-4">
                      <button
                        onClick={() => setIsUpdateModalOpen(false)}
                        className="px-4 py-2 bg-gray-300 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateChapter}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}