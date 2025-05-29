"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import Sidebar from "./(comp)/admin-sidebar";
import Navbar from "../(dashboard)/(comp)/navbar";
import UploadPage from "../(dashboard)/(courses)/uploadcourse";
import QuizManager from "./(comp)/admin-update";
import UploadExamPage from "./(comp)/uploadexam";
import Exams from "./(comp)/adminexamupdated";
import AdminPanel from "../(dashboard)/(comp)/admin-report";
import { useRouter } from "next/navigation";

export default function RootLayout() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [activeButton, setActiveButton] = useState("Dashboard");
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      const role = user?.publicMetadata?.role;
      if (role !== "admin") {
        router.replace("/"); // Redirect if not admin
      }
    }
  }, [isLoaded, user, router]);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const renderContent = () => {
    switch (activeButton) {
      case "Dashboard":
        return <h1 className="text-3xl font-bold">Admin Dashboard</h1>;
      case "Courses":
        return <QuizManager />;
      case "Upload Notes":
        return <UploadPage />;
      case "Competitive Exam Upload":
        return <UploadExamPage />;
      case "Admin":
        return <AdminPanel />;
      case "Competitive Exam":
        return <Exams />;
      case "Career Corner":
        return <h1 className="text-3xl font-bold">Career Opportunities</h1>;
      default:
        return <h1 className="text-3xl font-bold">Welcome!</h1>;
    }
  };

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen bg-gray-50">
      {(!isLoaded || user?.publicMetadata?.role !== "admin") ? (
        <div className="text-center w-full p-10">Loading...</div>
      ) : (
        <>
          <Sidebar
            setActiveButton={setActiveButton}
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <div className="flex-1 flex flex-col min-h-screen">
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
            <main className="flex-1 p-4 pt-20 md:pt-16 md:ml-64">
              <div className="p-4 md:p-6 w-full">{renderContent()}</div>
            </main>
          </div>
        </>
      )}
    </div>
  );
}
