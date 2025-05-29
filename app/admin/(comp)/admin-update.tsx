"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2, BookOpen, FileQuestion, Edit, Trash2, X } from "lucide-react";
import CourseSelectorGrid from "@/app/(dashboard)/(comp)/CourseSelectorGrid";
import NotesViewer from "@/app/(dashboard)/(comp)/NotesViewer";
import QuizSection from "@/app/(dashboard)/(comp)/QuizSection";

interface Unit {
  unitNumber: number;
  notesFileUrl: string;
  summary: string;
  quiz: { question: string; options: string[]; answer: string }[];
}

interface Subject {
  name: string;
  units: Unit[];
}

type ViewMode = "notes" | "quiz";

export default function Courses() {
  const { isLoaded, user } = useUser();
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedUnitData, setSelectedUnitData] = useState<Unit | null>(null);
  const [quiz, setQuiz] = useState<
    { question: string; options: string[]; answer: string }[]
  >([]);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<{
    score: number;
    total: number;
  } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("notes");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [newNotesFile, setNewNotesFile] = useState<File | null>(null);
  const [updatedQuiz, setUpdatedQuiz] = useState<
    { question: string; options: string[]; answer: string }[]
  >([]);

  // Get user details from Clerk
  const userId = user?.id || null;
  const userName = user?.fullName || "Unknown User";
  const isAdmin = user?.publicMetadata?.role === "admin";

  useEffect(() => {
    if (selectedYear && selectedBranch && userId) {
      fetchSubjects(selectedYear, selectedBranch);
    }
  }, [selectedYear, selectedBranch, userId]);

  useEffect(() => {
    if (selectedUnitData && userId && viewMode === "notes") {
      logNotesAccess();
    }
  }, [selectedUnitData, userId, viewMode]);

  const fetchSubjects = async (year: string, branch: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/course?year=${encodeURIComponent(year)}&branch=${encodeURIComponent(branch)}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();

      if (data.courses && data.courses.length > 0) {
        let allSubjects: Subject[] = [];
        data.courses.forEach((course: any) => {
          if (course.subjects && Array.isArray(course.subjects)) {
            allSubjects = [...allSubjects, ...course.subjects];
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
    } finally {
      setIsLoading(false);
    }
  };

  const logNotesAccess = async () => {
    try {
      const response = await fetch("/api/student-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userName,
          year: selectedYear,
          branch: selectedBranch,
          subject: selectedSubject,
          unitNumber: parseInt(selectedUnit),
          activityType: "notes_access",
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to log notes access");
      }
    } catch (error) {
      console.error("Error logging notes access:", error);
    }
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    setSelectedBranch("");
    setSelectedSubject("");
    setSelectedUnit("");
    setSubjects([]);
    setSelectedUnitData(null);
    setQuiz([]);
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setViewMode("notes");
  };

  const handleBranchChange = (value: string) => {
    setSelectedBranch(value);
    setSelectedSubject("");
    setSelectedUnit("");
    setSelectedUnitData(null);
    setQuiz([]);
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setViewMode("notes");
  };

  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
    setSelectedUnit("");
    setSelectedUnitData(null);
    setQuiz([]);
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setViewMode("notes");
  };

  const handleUnitChange = (value: string) => {
    setSelectedUnit(value);
    const subject = subjects.find((s) => s.name === selectedSubject);
    const unit = subject?.units.find((u) => u.unitNumber.toString() === value);
    if (unit) {
      setSelectedUnitData(unit);
      const shuffledQuiz = unit.quiz.sort(() => 0.5 - Math.random());
      setQuiz(shuffledQuiz.slice(0, Math.min(10, shuffledQuiz.length)));
      setUpdatedQuiz(unit.quiz);
    } else {
      setSelectedUnitData(null);
      setQuiz([]);
      setUpdatedQuiz([]);
    }
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setViewMode("notes");
  };

  const handleAnswerChange = (questionIndex: string, answer: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const handleSubmitQuiz = async () => {
    const score = quiz.reduce((acc, question, index) => {
      return userAnswers[index.toString()] === question.answer ? acc + 1 : acc;
    }, 0);

    try {
      const response = await fetch("/api/student-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userName,
          year: selectedYear,
          branch: selectedBranch,
          subject: selectedSubject,
          unitNumber: parseInt(selectedUnit),
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
        throw new Error(`Failed to log quiz submission: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error logging quiz submission:", error);
      alert("Failed to submit quiz. Please try again.");
      return;
    }

    setQuizSubmitted(true);
    setQuizScore({ score, total: quiz.length });
  };

  const toggleViewMode = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const handleUpdateUnit = async () => {
    if (!newNotesFile && updatedQuiz.length === 0) {
      alert("Please provide a new notes file or update the quiz.");
      return;
    }

    const formData = new FormData();
    formData.append("year", selectedYear);
    formData.append("branch", selectedBranch);
    formData.append("subject", selectedSubject);
    formData.append("unitNumber", selectedUnit);
    if (newNotesFile) {
      formData.append("notesFile", newNotesFile);
    }
    formData.append("quiz", JSON.stringify(updatedQuiz));

    try {
      const response = await fetch("/api/course", {
        method: "PUT",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to update unit");
      }
      alert("Unit updated successfully!");
      setIsUpdateModalOpen(false);
      setNewNotesFile(null);
      fetchSubjects(selectedYear, selectedBranch);
    } catch (error) {
      console.error("Error updating unit:", error);
      alert("Failed to update unit. Please try again.");
    }
  };

  const handleDeleteUnit = async () => {
    if (!confirm("Are you sure you want to delete this unit?")) return;

    try {
      const response = await fetch("/api/course", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: selectedYear,
          branch: selectedBranch,
          subject: selectedSubject,
          unitNumber: parseInt(selectedUnit),
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to delete unit");
      }
      alert("Unit deleted successfully!");
      setSelectedUnit("");
      setSelectedUnitData(null);
      setQuiz([]);
      setUpdatedQuiz([]);
      fetchSubjects(selectedYear, selectedBranch);
    } catch (error) {
      console.error("Error deleting unit:", error);
      alert("Failed to delete unit. Please try again.");
    }
  };

  const handleQuizQuestionChange = (
    index: number,
    field: "question" | "answer" | "options",
    value: string | string[]
  ) => {
    const newQuiz = [...updatedQuiz];
    newQuiz[index] = { ...newQuiz[index], [field]: value };
    setUpdatedQuiz(newQuiz);
  };

  const addQuizQuestion = () => {
    setUpdatedQuiz([
      ...updatedQuiz,
      { question: "", options: ["", "", "", ""], answer: "" },
    ]);
  };

  const removeQuizQuestion = (index: number) => {
    setUpdatedQuiz(updatedQuiz.filter((_, i) => i !== index));
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-white flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-32 left-16 w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl rotate-12 opacity-15"></div>
        </div>
        <div className="text-center relative z-10">
          <Loader2 className="h-16 w-16 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-white flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-red-100 to-pink-100 rounded-full opacity-20"></div>
          <div className="absolute bottom-32 left-16 w-24 h-24 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl rotate-12 opacity-15"></div>
        </div>
        <div className="text-center relative z-10 bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-red-200 max-w-md w-full">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-red-600 text-lg font-medium mb-4">Authentication Required</p>
          <p className="text-gray-600">Please sign in to access the course materials.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-white relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-40 h-40 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-32 h-32 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl rotate-12 opacity-15"></div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_24%,rgba(68,68,68,.02)_25%,rgba(68,68,68,.02)_26%,transparent_27%,transparent_74%,rgba(68,68,68,.02)_75%,rgba(68,68,68,.02)_76%,transparent_77%,transparent)] bg-[length:40px_40px]"></div>
      </div>

      <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 rounded-full text-white text-sm font-semibold uppercase tracking-wider shadow-lg">
                Learning Portal
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
              <span className="text-gray-800">Explore Your</span>
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Course Materials
              </span>
            </h1>
            <div className="flex justify-center items-center mt-6 space-x-2">
              <div className="w-8 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
              <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
              <div className="w-8 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
            </div>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Select your course details to access study materials and assessments
            </p>
          </div>

          {/* Course Selector Grid */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6 mb-12">
            <CourseSelectorGrid
              selectedYear={selectedYear}
              selectedBranch={selectedBranch}
              selectedSubject={selectedSubject}
              selectedUnit={selectedUnit}
              subjects={subjects}
              isLoading={isLoading}
              onYearChange={handleYearChange}
              onBranchChange={handleBranchChange}
              onSubjectChange={handleSubjectChange}
              onUnitChange={handleUnitChange}
            />
          </div>

          {selectedUnitData && (
            <div className="space-y-8 transition-all duration-500 ease-in-out animate-fadeIn">
              {/* Admin Controls */}
              {isAdmin && (
                <div className="flex justify-end gap-4 mb-6">
                  <button
                    onClick={() => setIsUpdateModalOpen(true)}
                    className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg shadow-md hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 transform hover:-translate-y-1"
                    title="Update unit notes or quiz"
                  >
                    <Edit className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    Update Unit
                  </button>
                  <button
                    onClick={handleDeleteUnit}
                    className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg shadow-md hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:-translate-y-1"
                    title="Delete this unit"
                  >
                    <Trash2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    Delete Unit
                  </button>
                </div>
              )}

              {/* View Mode Toggle Buttons */}
              <div className="flex justify-center gap-4 mb-6 flex-wrap">
                <button
                  onClick={() => toggleViewMode("notes")}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-md transform hover:-translate-y-1 ${
                    viewMode === "notes"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <BookOpen className="h-5 w-5" />
                  Study Materials
                </button>
                <button
                  onClick={() => toggleViewMode("quiz")}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-md transform hover:-translate-y-1 ${
                    viewMode === "quiz"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                      : quiz.length === 0
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  disabled={quiz.length === 0}
                  title={quiz.length === 0 ? "No quiz available for this unit" : "Take the quiz"}
                >
                  <FileQuestion className="h-5 w-5" />
                  Take Quiz
                </button>
              </div>

              {/* Conditional Content Display */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6">
                {viewMode === "notes" && <NotesViewer unitData={selectedUnitData} />}
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
              </div>

              {/* Update Modal */}
              {isUpdateModalOpen && (
                <div className="fixed inset-0 bg-slate-100 bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300">
                  <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto relative shadow-2xl border border-gray-200">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl">
                      <h2 className="text-2xl font-bold text-white">Update Unit</h2>
                      <button
                        onClick={() => setIsUpdateModalOpen(false)}
                        className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
                        title="Close"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                    <div className="p-6 space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Notes File (PDF)
                        </label>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setNewNotesFile(e.target.files?.[0] || null)}
                          className="block w-full border border-gray-300 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Quiz Questions</h3>
                        {updatedQuiz.map((q, index) => (
                          <div key={index} className="border border-gray-200 p-4 mb-4 rounded-lg bg-gray-50">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Question {index + 1}
                            </label>
                            <input
                              type="text"
                              value={q.question}
                              onChange={(e) =>
                                handleQuizQuestionChange(index, "question", e.target.value)
                              }
                              className="block w-full border border-gray-300 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500 mb-2"
                            />
                            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                className="block w-full border border-gray-300 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500 mb-2"
                                placeholder={`Option ${optIndex + 1}`}
                              />
                            ))}
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Answer
                            </label>
                            <input
                              type="text"
                              value={q.answer}
                              onChange={(e) =>
                                handleQuizQuestionChange(index, "answer", e.target.value)
                              }
                              className="block w-full border border-gray-300 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500 mb-2"
                            />
                            <button
                              onClick={() => removeQuizQuestion(index)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                            >
                              Remove Question
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={addQuizQuestion}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
                        >
                          + Add Question
                        </button>
                      </div>
                      <div className="flex justify-end gap-4">
                        <button
                          onClick={() => setIsUpdateModalOpen(false)}
                          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdateUnit}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
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
    </div>
  );
}