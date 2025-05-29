"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  ChartBarIcon,
  TrophyIcon,
  BookOpenIcon,
  StarIcon,
  ClockIcon,
} from "lucide-react";

interface ExamStudentActivity {
  _id: string;
  userId: string;
  userName: string;
  exam: string;
  subject: string;
  chapterNumber: number;
  activityType: "notes_access" | "quiz_submission";
  quizResult?: {
    score: number;
    totalQuestions: number;
    answers: { [key: string]: string };
  };
  timestamp: string;
}

interface CourseStudentActivity {
  _id: string;
  userId: string;
  userName: string;
  year: string;
  branch: string;
  subject: string;
  unitNumber: number;
  activityType: "notes_access" | "quiz_submission";
  quizResult?: {
    score: number;
    totalQuestions: number;
    answers: { [key: string]: string };
  };
  timestamp: string;
}

export default function AdminPanel() {
  const { isLoaded, user } = useUser();
  const [examActivities, setExamActivities] = useState<ExamStudentActivity[]>([]);
  const [courseActivities, setCourseActivities] = useState<CourseStudentActivity[]>([]);
  const [filteredExamActivities, setFilteredExamActivities] = useState<ExamStudentActivity[]>([]);
  const [filteredCourseActivities, setFilteredCourseActivities] = useState<CourseStudentActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [examFilterType, setExamFilterType] = useState<"all" | "notes_access" | "quiz_submission">("all");
  const [courseFilterType, setCourseFilterType] = useState<"all" | "notes_access" | "quiz_submission">("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.publicMetadata?.role === "admin";

  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true);
      try {
        // Fetch exam activities
        const examResponse = await fetch(`/api/student-activity-exam?isAdmin=${isAdmin}`, {
          headers: { Accept: "application/json" },
        });
        if (!examResponse.ok) {
          const text = await examResponse.text();
          console.error("Exam API response:", text);
          throw new Error(`Failed to fetch exam activities: ${examResponse.status} ${examResponse.statusText}`);
        }
        const examData = await examResponse.json();
        if (!examData.activities) {
          throw new Error("No exam activities found in response");
        }
        setExamActivities(examData.activities);
        setFilteredExamActivities(examData.activities);

        // Fetch course activities
        const courseResponse = await fetch(`/api/student-activity?isAdmin=${isAdmin}`, {
          headers: { Accept: "application/json" },
        });
        if (!courseResponse.ok) {
          const text = await courseResponse.text();
          console.error("Course API response:", text);
          throw new Error(`Failed to fetch course activities: ${courseResponse.status} ${courseResponse.statusText}`);
        }
        const courseData = await courseResponse.json();
        if (!courseData.activities) {
          throw new Error("No course activities found in response");
        }
        setCourseActivities(courseData.activities);
        setFilteredCourseActivities(courseData.activities);

        if (!examData.activities.length && !courseData.activities.length) {
          setError("No activities found.");
        }
      } catch (error) {
        console.error("Error fetching activities:", error);
        setError(`Failed to load activities: ${(error as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoaded && isAdmin) {
      fetchActivities();
    } else if (isLoaded && !isAdmin) {
      setError("Unauthorized access. Admin role required.");
      setIsLoading(false);
    }
  }, [isLoaded, isAdmin]);

  useEffect(() => {
    const filteredExams = examActivities.filter(
      (activity) =>
        (activity.userName || "").toLowerCase().includes(searchQuery.toLowerCase()) &&
        (examFilterType === "all" || activity.activityType === examFilterType)
    );
    const filteredCourses = courseActivities.filter(
      (activity) =>
        (activity.userName || "").toLowerCase().includes(searchQuery.toLowerCase()) &&
        (courseFilterType === "all" || activity.activityType === courseFilterType)
    );
    setFilteredExamActivities(filteredExams);
    setFilteredCourseActivities(filteredCourses);
  }, [searchQuery, examFilterType, courseFilterType, examActivities, courseActivities]);

  // Calculate stats
  const totalActivities = examActivities.length + courseActivities.length;
  const quizActivities = [
    ...examActivities.filter((a) => a.activityType === "quiz_submission"),
    ...courseActivities.filter((a) => a.activityType === "quiz_submission"),
  ];
  const notesActivities = [
    ...examActivities.filter((a) => a.activityType === "notes_access"),
    ...courseActivities.filter((a) => a.activityType === "notes_access"),
  ];
  const averageScore =
    quizActivities.length > 0
      ? quizActivities.reduce(
          (sum, quiz) => sum + (quiz.quizResult?.score || 0) / (quiz.quizResult?.totalQuestions || 1),
          0
        ) / quizActivities.length
      : 0;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-white flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-32 left-16 w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl rotate-12 opacity-15"></div>
        </div>
        <div className="text-center relative z-10">
          <Loader2 className="h-16 w-16 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-white flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-red-100 to-pink-100 rounded-full opacity-20"></div>
          <div className="absolute bottom-32 left-16 w-24 h-24 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl rotate-12 opacity-15"></div>
        </div>
        <div className="text-center relative z-10 bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-red-200">
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
          <p className="text-red-600 text-lg font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-white relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-40 h-40 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-32 h-32 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl rotate-12 opacity-15"></div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_24%,rgba(68,68,68,.02)_25%,rgba(68,68,68,.02)_26%,transparent_27%,transparent_74%,rgba(68,68,68,.02)_75%,rgba(68,68,68,.02)_76%,transparent_77%,transparent)] bg-[length:40px_40px]"></div>
      </div>

      <div className="relative z-10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-12 text-center">
            <div className="inline-block mb-4">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 rounded-full text-white text-sm font-semibold uppercase tracking-wider shadow-lg">
                Admin Panel
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
              <span className="text-gray-800">Student Activity</span>
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Monitoring Dashboard
              </span>
            </h1>
            <div className="flex justify-center items-center mt-6 space-x-2">
              <div className="w-8 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
              <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
              <div className="w-8 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
            </div>
            <div className="mt-8">
              <Input
                type="text"
                placeholder="Search by student name..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="max-w-md mx-auto border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="group bg-white/80 backdrop-blur-sm p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Activities</p>
                  <p className="text-2xl font-bold text-gray-900">{totalActivities}</p>
                </div>
              </div>
            </Card>
            <Card className="group bg-white/80 backdrop-blur-sm p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-amber-200 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrophyIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Quizzes Taken</p>
                  <p className="text-2xl font-bold text-gray-900">{quizActivities.length}</p>
                </div>
              </div>
            </Card>
            <Card className="group bg-white/80 backdrop-blur-sm p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <BookOpenIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Notes Accessed</p>
                  <p className="text-2xl font-bold text-gray-900">{notesActivities.length}</p>
                </div>
              </div>
            </Card>
            <Card className="group bg-white/80 backdrop-blur-sm p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-rose-200 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-rose-500 to-pink-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <StarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">{(averageScore * 100).toFixed(1)}%</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Competitive Exam Activities */}
          <div className="mb-12">
            <Card className="bg-white/80 backdrop-blur-sm p-6 shadow-sm border border-gray-200 mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Competitive Exam Activities</h2>
                  <p className="text-gray-600">Monitor student exam preparation progress</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setExamFilterType("all")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      examFilterType === "all"
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    All Activities
                  </button>
                  <button
                    onClick={() => setExamFilterType("notes_access")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      examFilterType === "notes_access"
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Notes Only
                  </button>
                  <button
                    onClick={() => setExamFilterType("quiz_submission")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      examFilterType === "quiz_submission"
                        ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Quizzes Only
                  </button>
                </div>
              </div>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200 overflow-hidden">
              {filteredExamActivities.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <StarIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Exam Activities Found</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    No activities match the search query or filter.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {/* Mobile Card View */}
                  <div className="block sm:hidden p-4 space-y-4">
                    {filteredExamActivities.map((activity) => (
                      <div
                        key={activity._id}
                        className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`p-2 rounded-lg ${
                                activity.activityType === "quiz_submission"
                                  ? "bg-gradient-to-br from-amber-100 to-orange-100"
                                  : "bg-gradient-to-br from-emerald-100 to-teal-100"
                              }`}
                            >
                              {activity.activityType === "quiz_submission" ? (
                                <TrophyIcon className="h-4 w-4 text-amber-600" />
                              ) : (
                                <StarIcon className="h-4 w-4 text-emerald-600" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800">{activity.userName || "Unknown"}</h4>
                              <p className="text-sm text-gray-600">
                                {activity.exam} - {activity.subject} - Chapter {activity.chapterNumber}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Activity</p>
                            <p className="font-medium text-gray-800 capitalize">
                              {activity.activityType.replace("_", " ")}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Details</p>
                            <p className="font-medium text-gray-800">
                              {activity.activityType === "quiz_submission" && activity.quizResult ? (
                                <span>
                                  Score: {activity.quizResult.score}/{activity.quizResult.totalQuestions}
                                </span>
                              ) : (
                                "Notes viewed"
                              )}
                            </p>
                          </div>
                        </div>
                        {activity.activityType === "quiz_submission" && activity.quizResult && (
                          <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-amber-800">Quiz Score</span>
                              <span className="text-lg font-bold text-amber-900">
                                {activity.quizResult.score}/{activity.quizResult.totalQuestions}
                              </span>
                            </div>
                            <div className="mt-2 bg-amber-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${(activity.quizResult.score / activity.quizResult.totalQuestions) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                        <div className="mt-3 flex items-center text-xs text-gray-500">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {new Date(activity.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Desktop Table View */}
                  <div className="hidden sm:block">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Student & Exam Details
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Activity
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Performance
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Date & Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredExamActivities.map((activity) => (
                          <tr key={activity._id} className="hover:bg-gray-50/50 transition-colors duration-200">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`p-2 rounded-lg ${
                                    activity.activityType === "quiz_submission"
                                      ? "bg-gradient-to-br from-amber-100 to-orange-100"
                                      : "bg-gradient-to-br from-emerald-100 to-teal-100"
                                  }`}
                                >
                                  {activity.activityType === "quiz_submission" ? (
                                    <TrophyIcon className="h-5 w-5 text-amber-600" />
                                  ) : (
                                    <StarIcon className="h-5 w-5 text-emerald-600" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{activity.userName || "Unknown"}</p>
                                  <p className="text-sm text-gray-600">
                                    {activity.exam} • {activity.subject} • Chapter {activity.chapterNumber}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  activity.activityType === "quiz_submission"
                                    ? "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800"
                                    : "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800"
                                }`}
                              >
                                {activity.activityType.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {activity.activityType === "quiz_submission" && activity.quizResult ? (
                                <div className="flex items-center space-x-3">
                                  <div className="flex-1 max-w-32">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-medium text-gray-700">
                                        {activity.quizResult.score}/{activity.quizResult.totalQuestions}
                                      </span>
                                      <span className="text-sm font-bold text-gray-900">
                                        {Math.round(
                                          (activity.quizResult.score / activity.quizResult.totalQuestions) * 100
                                        )}
                                        %
                                      </span>
                                    </div>
                                    <div className="bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                                        style={{
                                          width: `${(activity.quizResult.score / activity.quizResult.totalQuestions) * 100}%`,
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                                  Completed
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <ClockIcon className="h-4 w-4 mr-2" />
                                <div>
                                  <p className="font-medium">{new Date(activity.timestamp).toLocaleDateString()}</p>
                                  <p className="text-xs">{new Date(activity.timestamp).toLocaleTimeString()}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Engineering Course Activities */}
          <div>
            <Card className="bg-white/80 backdrop-blur-sm p-6 shadow-sm border border-gray-200 mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Engineering Course Activities</h2>
                  <p className="text-gray-600">Monitor student course learning progress</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCourseFilterType("all")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      courseFilterType === "all"
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    All Activities
                  </button>
                  <button
                    onClick={() => setCourseFilterType("notes_access")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      courseFilterType === "notes_access"
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Notes Only
                  </button>
                  <button
                    onClick={() => setCourseFilterType("quiz_submission")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      courseFilterType === "quiz_submission"
                        ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Quizzes Only
                  </button>
                </div>
              </div>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200 overflow-hidden">
              {filteredCourseActivities.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <StarIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Course Activities Found</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    No activities match the search query or filter.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {/* Mobile Card View */}
                  <div className="block sm:hidden p-4 space-y-4">
                    {filteredCourseActivities.map((activity) => (
                      <div
                        key={activity._id}
                        className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`p-2 rounded-lg ${
                                activity.activityType === "quiz_submission"
                                  ? "bg-gradient-to-br from-amber-100 to-orange-100"
                                  : "bg-gradient-to-br from-emerald-100 to-teal-100"
                              }`}
                            >
                              {activity.activityType === "quiz_submission" ? (
                                <TrophyIcon className="h-4 w-4 text-amber-600" />
                              ) : (
                                <StarIcon className="h-4 w-4 text-emerald-600" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800">{activity.userName || "Unknown"}</h4>
                              <p className="text-sm text-gray-600">
                                {activity.year} - {activity.branch} - {activity.subject} - Unit {activity.unitNumber}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Activity</p>
                            <p className="font-medium text-gray-800 capitalize">
                              {activity.activityType.replace("_", " ")}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Details</p>
                            <p className="font-medium text-gray-800">
                              {activity.activityType === "quiz_submission" && activity.quizResult ? (
                                <span>
                                  Score: {activity.quizResult.score}/{activity.quizResult.totalQuestions}
                                </span>
                              ) : (
                                "Notes viewed"
                              )}
                            </p>
                          </div>
                        </div>
                        {activity.activityType === "quiz_submission" && activity.quizResult && (
                          <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-amber-800">Quiz Score</span>
                              <span className="text-lg font-bold text-amber-900">
                                {activity.quizResult.score}/{activity.quizResult.totalQuestions}
                              </span>
                            </div>
                            <div className="mt-2 bg-amber-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${(activity.quizResult.score / activity.quizResult.totalQuestions) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                        <div className="mt-3 flex items-center text-xs text-gray-500">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {new Date(activity.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Desktop Table View */}
                  <div className="hidden sm:block">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Student & Course Details
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Activity
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Performance
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Date & Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredCourseActivities.map((activity) => (
                          <tr key={activity._id} className="hover:bg-gray-50/50 transition-colors duration-200">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`p-2 rounded-lg ${
                                    activity.activityType === "quiz_submission"
                                      ? "bg-gradient-to-br from-amber-100 to-orange-100"
                                      : "bg-gradient-to-br from-emerald-100 to-teal-100"
                                  }`}
                                >
                                  {activity.activityType === "quiz_submission" ? (
                                    <TrophyIcon className="h-5 w-5 text-amber-600" />
                                  ) : (
                                    <StarIcon className="h-5 w-5 text-emerald-600" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{activity.userName || "Unknown"}</p>
                                  <p className="text-sm text-gray-600">
                                    {activity.year} • {activity.branch} • {activity.subject} • Unit {activity.unitNumber}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  activity.activityType === "quiz_submission"
                                    ? "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800"
                                    : "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800"
                                }`}
                              >
                                {activity.activityType.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {activity.activityType === "quiz_submission" && activity.quizResult ? (
                                <div className="flex items-center space-x-3">
                                  <div className="flex-1 max-w-32">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-medium text-gray-700">
                                        {activity.quizResult.score}/{activity.quizResult.totalQuestions}
                                      </span>
                                      <span className="text-sm font-bold text-gray-900">
                                        {Math.round(
                                          (activity.quizResult.score / activity.quizResult.totalQuestions) * 100
                                        )}
                                        %
                                      </span>
                                    </div>
                                    <div className="bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                                        style={{
                                          width: `${(activity.quizResult.score / activity.quizResult.totalQuestions) * 100}%`,
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                                  Completed
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <ClockIcon className="h-4 w-4 mr-2" />
                                <div>
                                  <p className="font-medium">{new Date(activity.timestamp).toLocaleDateString()}</p>
                                  <p className="text-xs">{new Date(activity.timestamp).toLocaleTimeString()}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}