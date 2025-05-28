"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Navbar from "./(comp)/navbar";
import Sidebar from "./(comp)/sidebar";
import { Menu } from "lucide-react";
import Courses from "./(courses)/courses";
import UploadNotes from "./(courses)/uploadcourse";
import AdminPanel from "./(comp)/admin-report";
import StudentDashboard from "./(comp)/Student-report";
import Exams from "../admin/(comp)/exma";

export default function RootLayout() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [activeButton, setActiveButton] = useState("Courses");
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) {
      router.replace("/"); // Redirect to home if not logged in
    }
  }, [isLoaded, user, router]);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const renderContent = () => {
    switch (activeButton) {
      case "Courses":
        return <Courses />;
      case "Study Lists":
        return <UploadNotes />;
      case "Competitive Exam":
        return <Exams />;
      case "Admin":
        return <AdminPanel />;
      case "My Acitivity":
        return <StudentDashboard />;
      case "Career Corner":
        return <h1 className="text-3xl font-bold">Career Opportunities</h1>;
      default:
        return <h1 className="text-3xl font-bold">Welcome!</h1>;
    }
  };

  if (!isLoaded || !user) {
    return <div className="text-center w-full p-10">Loading...</div>;
  }

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        setActiveButton={setActiveButton}
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Navbar with sidebar toggle for mobile */}
        <div className="sticky top-0 z-30">
          <div className="md:hidden absolute left-4 top-4 z-50">
            <button
              onClick={toggleSidebar}
              className="p-2 bg-white rounded-lg shadow-md"
              aria-label="Toggle sidebar"
            >
              <Menu size={24} />
            </button>
          </div>
          <Navbar />
        </div>

        {/* Main content area */}
        <main className="flex-1 p-4 pt-20 md:pt-16 md:ml-64">
          <div className="p-4 md:p-6 w-full">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
}
