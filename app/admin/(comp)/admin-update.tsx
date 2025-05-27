"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2, BookOpen, FileQuestion, Edit, Trash2 } from "lucide-react";
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
        `/api/course?year=${encodeURIComponent(
          year
        )}&branch=${encodeURIComponent(branch)}`
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
          new Map(
            allSubjects.map((subject) => [subject.name, subject])
          ).values()
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
      setUpdatedQuiz(unit.quiz); // Initialize updated quiz for editing
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
      fetchSubjects(selectedYear, selectedBranch); // Refresh subjects
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
      fetchSubjects(selectedYear, selectedBranch); // Refresh subjects
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
          <p className="text-red-600 font-medium mb-4">
            Authentication Required
          </p>
          <p className="text-gray-600">
            Please sign in to access the course materials.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 text-blue-900 tracking-tight">
          Learning Portal
        </h1>
        <p className="text-center text-blue-700 mb-10 max-w-2xl mx-auto">
          Select your course details below to access study materials and
          assessments
        </p>

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

        {selectedUnitData && (
          <div className="mt-12 space-y-8 transition-all duration-500 ease-in-out animate-fadeIn">
            {/* Admin Controls */}
            {isAdmin && (
              <div className="flex justify-end gap-4 mb-6">
                <button
                  onClick={() => setIsUpdateModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  <Edit className="h-5 w-5" />
                  Update Unit
                </button>
                <button
                  onClick={handleDeleteUnit}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Trash2 className="h-5 w-5" />
                  Delete Unit
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
              <NotesViewer unitData={selectedUnitData} />
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
                  <h2 className="text-2xl font-bold mb-4">Update Unit</h2>
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
                        onClick={handleUpdateUnit}
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