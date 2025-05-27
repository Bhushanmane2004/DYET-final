"use client";
import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./(comp)/admin-sidebar";
import Navbar from "../(dashboard)/(comp)/navbar";
import UploadPage from "../(dashboard)/(courses)/uploadcourse";
import QuizManager from "./(comp)/admin-update";
import UploadExamPage from "./(comp)/uploadexam";
import Exams from "./(comp)/exma";


export default function RootLayout() {
  const [activeButton, setActiveButton] = useState("Dashboard");
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const renderContent = () => {
    switch (activeButton) {
      case "Dashboard":
        return ;
      case "Courses":
        return <QuizManager /> ;
      case "Upload Notes":
        return <UploadPage />;
      case "Newsfeed":
        return <UploadExamPage />;
      case "Admin":
        return <Exams />;
    
      case "Career Corner":
        return <h1 className="text-3xl font-bold">Career Opportunities</h1>;
      default:
        return <h1 className="text-3xl font-bold">Welcome!</h1>;
    }
  };

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
          <div className=" p-4 md:p-6  w-full">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
}
