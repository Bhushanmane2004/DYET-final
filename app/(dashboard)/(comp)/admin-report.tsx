"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

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
    const filteredExams = examActivities.filter((activity) =>
      (activity.userName || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredCourses = courseActivities.filter((activity) =>
      (activity.userName || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredExamActivities(filteredExams);
    setFilteredCourseActivities(filteredCourses);
  }, [searchQuery, examActivities, courseActivities]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-slate-800">
          Admin Panel: Student Activity
        </h1>
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search by student name..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="max-w-md mx-auto"
          />
        </div>

        {/* Competitive Exam Activities */}
        <Card className="p-6 bg-white shadow-md rounded-xl mb-8">
          <h2 className="text-2xl font-semibold text-blue-900 mb-4">Competitive Exam Activities</h2>
          {filteredExamActivities.length === 0 ? (
            <p className="text-center text-gray-600">
              No exam activities match the search query.
            </p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-2">User Name</th>
                  <th className="py-2">Exam</th>
                  <th className="py-2">Subject</th>
                  <th className="py-2">Chapter</th>
                  <th className="py-2">Activity</th>
                  <th className="py-2">Details</th>
                  <th className="py-2">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredExamActivities.map((activity) => (
                  <tr key={activity._id} className="border-b">
                    <td className="py-2">{activity.userName || "Unknown"}</td>
                    <td className="py-2">{activity.exam}</td>
                    <td className="py-2">{activity.subject}</td>
                    <td className="py-2">{activity.chapterNumber}</td>
                    <td className="py-2">{activity.activityType.replace("_", " ")}</td>
                    <td className="py-2">
                      {activity.activityType === "quiz_submission" && activity.quizResult ? (
                        <span>
                          Score: {activity.quizResult.score}/{activity.quizResult.totalQuestions}
                        </span>
                      ) : (
                        "Notes viewed"
                      )}
                    </td>
                    <td className="py-2">{new Date(activity.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Engineering Course Activities */}
        <Card className="p-6 bg-white shadow-md rounded-xl">
          <h2 className="text-2xl font-semibold text-blue-900 mb-4">Engineering Course Activities</h2>
          {filteredCourseActivities.length === 0 ? (
            <p className="text-center text-gray-600">
              No course activities match the search query.
            </p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-2">User Name</th>
                  <th className="py-2">Year</th>
                  <th className="py-2">Branch</th>
                  <th className="py-2">Subject</th>
                  <th className="py-2">Unit</th>
                  <th className="py-2">Activity</th>
                  <th className="py-2">Details</th>
                  <th className="py-2">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourseActivities.map((activity) => (
                  <tr key={activity._id} className="border-b">
                    <td className="py-2">{activity.userName || "Unknown"}</td>
                    <td className="py-2">{activity.year}</td>
                    <td className="py-2">{activity.branch}</td>
                    <td className="py-2">{activity.subject}</td>
                    <td className="py-2">{activity.unitNumber}</td>
                    <td className="py-2">{activity.activityType.replace("_", " ")}</td>
                    <td className="py-2">
                      {activity.activityType === "quiz_submission" && activity.quizResult ? (
                        <span>
                          Score: {activity.quizResult.score}/{activity.quizResult.totalQuestions}
                        </span>
                      ) : (
                        "Notes viewed"
                      )}
                    </td>
                    <td className="py-2">{new Date(activity.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}