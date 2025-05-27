"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  BookOpen,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Unit {
  unitNumber: number;
  notesFileUrl: string;
  summary: string;
  quiz: { question: string; options: string[]; answer: string }[];
}

interface NotesViewerProps {
  unitData: Unit;
}

export default function NotesViewer({ unitData }: NotesViewerProps) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<"pdf" | "summary">("pdf");

  const handleZoomIn = () => {
    if (zoomLevel < 200) setZoomLevel(zoomLevel + 10);
  };

  const handleZoomOut = () => {
    if (zoomLevel > 50) setZoomLevel(zoomLevel - 10);
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Unit {unitData.unitNumber} Study Materials
        </h2>

        <div className="flex space-x-2">
          <Button
            variant={viewMode === "pdf" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("pdf")}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            PDF
          </Button>
          <Button
            variant={viewMode === "summary" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("summary")}
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Summary
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "pdf" ? (
          <motion.div
            key="pdf-viewer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden border-blue-100 shadow-xl">
              <div className="bg-blue-800 text-white p-3 flex justify-between items-center">
                <h3 className="font-semibold">PDF Document</h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomOut}
                    className="h-8 w-8 text-white hover:bg-blue-700"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">{zoomLevel}%</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomIn}
                    className="h-8 w-8 text-white hover:bg-blue-700"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleResetZoom}
                    className="h-8 w-8 text-white hover:bg-blue-700"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <a
                    href={unitData.notesFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "icon" }),
                      "h-8 w-8 bg-transparent border-white text-white hover:bg-blue-700 hover:text-white"
                    )}
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <div className="bg-slate-100 p-4">
                <div
                  className="w-full overflow-hidden transition-all duration-300 bg-white rounded-lg"
                  style={{
                    height: "70vh",
                    boxShadow:
                      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  }}
                >
                  <iframe
                    src={unitData.notesFileUrl}
                    width="100%"
                    height="100%"
                    style={{
                      border: "none",
                      transform: `scale(${zoomLevel / 100})`,
                      transformOrigin: "top left",
                    }}
                    title="PDF Viewer"
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="summary-viewer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden border-blue-100 shadow-xl">
              <div className="bg-blue-800 text-white p-3 flex justify-between items-center">
                <h3 className="font-semibold">Unit Summary</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSummaryExpanded(!summaryExpanded)}
                  className="text-white hover:bg-blue-700"
                >
                  {summaryExpanded ? (
                    <span className="flex items-center gap-1">
                      <ChevronUp className="h-4 w-4" /> Collapse
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <ChevronDown className="h-4 w-4" /> Expand All
                    </span>
                  )}
                </Button>
              </div>
              <div
                className={`bg-white p-6 prose prose-blue max-w-none ${
                  summaryExpanded
                    ? "min-h-[70vh]"
                    : "max-h-[70vh] overflow-y-auto"
                }`}
              >
                {unitData.summary.split("\n\n").map((paragraph, index) => {
                  if (paragraph.startsWith("*   **")) {
                    const titleEnd = paragraph.indexOf(":**");
                    const title = paragraph.substring(6, titleEnd);
                    const content = paragraph.substring(titleEnd + 3);

                    return (
                      <div key={index} className="mb-6">
                        <h3 className="text-xl font-semibold text-blue-800 mb-2">
                          {title}
                        </h3>
                        <p className="text-gray-700">{content}</p>
                      </div>
                    );
                  } else if (paragraph.startsWith("*   ")) {
                    return (
                      <li key={index} className="mb-2 text-gray-700 ml-6">
                        {paragraph.substring(4)}
                      </li>
                    );
                  } else {
                    return (
                      <p key={index} className="mb-4 text-gray-700">
                        {paragraph}
                      </p>
                    );
                  }
                })}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
