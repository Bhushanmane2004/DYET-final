"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  GraduationCap,
  BookOpen,
  Upload,
  Plus,
  Minus,
  Loader2,
  File,
  FileText,
  AlertTriangle,
  CheckCircle,
  Info,
  Library,
  Bookmark,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";

// Define interfaces for data structures
interface FileWithPreview extends File {
  preview?: string;
}

interface Unit {
  unitNumber: number;
  notesFile?: FileWithPreview;
  fileSize?: string;
  fileType?: string;
  uploadProgress?: number;
  uploadStatus?: "idle" | "uploading" | "success" | "error";
  errorMessage?: string;
}

interface Subject {
  name: string;
  units: Unit[];
}

// Static data for year and branch options
const engineeringYears = [
  "First Year",
  "Second Year",
  "Third Year",
  "Final Year",
];

const branches = [
  "Computer Engineering",
  "Information Technology",
  "Electronics & Telecommunication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
];

const acceptedFileTypes = [".pdf", ".doc", ".docx", ".ppt", ".pptx"];

// Motion component for animations
const MotionCard = motion(Card);

export default function UploadPage() {
  const { isLoaded, user } = useUser();
  // State for form and upload management
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [subjects, setSubjects] = useState<Subject[]>([
    {
      name: "",
      units: [{ unitNumber: 1, uploadStatus: "idle", uploadProgress: 0 }],
    },
  ]);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [recentUploads, setRecentUploads] = useState<
    { course: string; subject: string; unit: number; url: string }[]
  >([]);

  // Ref to store file input elements
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Get user details from Clerk
  const userId = user?.id || null;
  const userName = user?.fullName || "Unknown User";

  // Load recent uploads from localStorage on mount
  useEffect(() => {
    const savedUploads = localStorage.getItem("recentUploads");
    if (savedUploads) {
      try {
        setRecentUploads(JSON.parse(savedUploads).slice(0, 3));
      } catch (e) {
        console.error("Failed to parse recent uploads", e);
      }
    }
  }, []);

  // Add a new subject
  const addSubject = () => {
    setSubjects([
      ...subjects,
      {
        name: "",
        units: [{ unitNumber: 1, uploadStatus: "idle", uploadProgress: 0 }],
      },
    ]);
  };

  // Remove a subject by index
  const removeSubject = (index: number) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter((_, i) => i !== index));
    }
  };

  // Add a new unit to a subject
  const addUnit = (subjectIndex: number) => {
    const updatedSubjects = [...subjects];
    const nextUnitNumber = updatedSubjects[subjectIndex].units.length + 1;
    updatedSubjects[subjectIndex].units.push({
      unitNumber: nextUnitNumber,
      uploadStatus: "idle",
      uploadProgress: 0,
    });
    setSubjects(updatedSubjects);
  };

  // Remove a unit from a subject
  const removeUnit = (subjectIndex: number, unitIndex: number) => {
    const updatedSubjects = [...subjects];
    if (updatedSubjects[subjectIndex].units.length > 1) {
      updatedSubjects[subjectIndex].units = updatedSubjects[subjectIndex].units.filter(
        (_, i) => i !== unitIndex
      );
      setSubjects(updatedSubjects);
    }
  };

  // Update subject fields
  const updateSubject = (index: number, field: keyof Subject, value: string) => {
    const updatedSubjects = [...subjects];
    updatedSubjects[index] = { ...updatedSubjects[index], [field]: value };
    setSubjects(updatedSubjects);
  };

  // Update unit fields
  const updateUnit = (
    subjectIndex: number,
    unitIndex: number,
    field: keyof Unit,
    value: any
  ) => {
    const updatedSubjects = [...subjects];
    updatedSubjects[subjectIndex].units[unitIndex] = {
      ...updatedSubjects[subjectIndex].units[unitIndex],
      [field]: value,
    };
    setSubjects(updatedSubjects);
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Handle file selection for a unit
  const handleFileChange =
    (subjectIndex: number, unitIndex: number) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;

      const file = e.target.files[0] as FileWithPreview;
      const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;

      if (!acceptedFileTypes.includes(fileExtension)) {
        toast.error(
          `Invalid file type. Accepted types: ${acceptedFileTypes.join(", ")}`
        );
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10MB limit");
        return;
      }

      updateUnit(subjectIndex, unitIndex, "notesFile", file);
      updateUnit(subjectIndex, unitIndex, "fileSize", formatFileSize(file.size));
      updateUnit(subjectIndex, unitIndex, "fileType", fileExtension.slice(1).toUpperCase());
      updateUnit(subjectIndex, unitIndex, "uploadStatus", "idle");
      updateUnit(subjectIndex, unitIndex, "uploadProgress", 0);
    };

  // Update upload progress for a unit
  const updateUploadProgress = (
    subjectIndex: number,
    unitIndex: number,
    progress: number
  ) => {
    updateUnit(subjectIndex, unitIndex, "uploadProgress", progress);
    updateUnit(
      subjectIndex,
      unitIndex,
      "uploadStatus",
      progress === 100 ? "success" : "uploading"
    );

    const totalUnits = subjects.reduce((sum, s) => sum + s.units.length, 0);
    const progressSum = subjects.reduce(
      (sum, s) =>
        sum + s.units.reduce((unitSum, u) => unitSum + (u.uploadProgress || 0), 0),
      0
    );
    setOverallProgress(progressSum / totalUnits);
  };

  // Save a recent upload to localStorage
  const saveRecentUpload = (
    course: string,
    subject: string,
    unit: number,
    url: string
  ) => {
    const newUpload = { course, subject, unit, url };
    const updatedUploads = [newUpload, ...recentUploads].slice(0, 3);
    setRecentUploads(updatedUploads);
    localStorage.setItem("recentUploads", JSON.stringify(updatedUploads));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedYear || !selectedBranch) {
      toast.error("Please select year and branch");
      return;
    }

    const validSubjects = subjects.filter(
      (subject) => subject.name.trim() && subject.units.some((unit) => unit.notesFile)
    );
    if (validSubjects.length === 0) {
      toast.error("Please add at least one subject with a unit and notes file");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Preparing to upload files...");

    try {
      const formData = new FormData();
      formData.append("year", selectedYear);
      formData.append("branch", selectedBranch);

      const subjectsToSave = validSubjects.map((subject) => ({
        name: subject.name.trim(),
        units: subject.units
          .filter((unit) => unit.notesFile)
          .map((unit) => ({
            unitNumber: unit.unitNumber,
          })),
      }));
      formData.append("subjects", JSON.stringify(subjectsToSave));

      subjects.forEach((subject, subjectIndex) => {
        subject.units.forEach((unit, unitIndex) => {
          if (unit.notesFile) {
            formData.append(
              `notes-file-${subjectIndex}-${unitIndex}`,
              unit.notesFile,
              unit.notesFile.name
            );
            updateUnit(subjectIndex, unitIndex, "uploadStatus", "uploading");
          }
        });
      });

      toast.dismiss(toastId);
      toast.loading("Uploading files to Cloudinary...");

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/course", true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setOverallProgress(percentComplete);

          subjects.forEach((subject, sIdx) => {
            subject.units.forEach((unit, uIdx) => {
              if (unit.notesFile) {
                updateUploadProgress(sIdx, uIdx, percentComplete);
              }
            });
          });
        }
      };

      xhr.onload = function () {
        if (xhr.status === 201 || xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);

          toast.success("Notes uploaded successfully!");

          if (response.course && response.course.subjects) {
            response.course.subjects.forEach((subj: any) => {
              subj.units.forEach((unit: any) => {
                const courseName = `${selectedYear} - ${selectedBranch}`;
                saveRecentUpload(courseName, subj.name, unit.unitNumber, unit.notesFileUrl);
              });
            });
          }

          setSelectedYear("");
          setSelectedBranch("");
          setSubjects([
            {
              name: "",
              units: [{ unitNumber: 1, uploadStatus: "idle", uploadProgress: 0 }],
            },
          ]);
          setOverallProgress(0);
        } else {
          throw new Error("Failed to upload notes");
        }
        setIsLoading(false);
      };

      xhr.onerror = function () {
        toast.error("Failed to upload notes. Please try again.");
        setIsLoading(false);

        setSubjects((prev) =>
          prev.map((s) => ({
            ...s,
            units: s.units.map((u) =>
              u.uploadStatus === "uploading"
                ? { ...u, uploadStatus: "error", errorMessage: "Upload failed" }
                : u
            ),
          }))
        );
      };

      xhr.send(formData);
    } catch (error) {
      toast.dismiss(toastId);
      toast.error("Failed to upload notes. Please try again.");
      console.error("Upload error:", error);
      setIsLoading(false);
    }
  };

  // Trigger file input click
  const triggerFileInput = (inputId: string) => {
    if (fileInputRefs.current[inputId]) {
      fileInputRefs.current[inputId]?.click();
    }
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
            <p className="text-indigo-800 font-semibold text-lg mb-2">Loading upload portal...</p>
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
            Please sign in to upload your course materials.
          </p>
          <button className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 font-medium shadow-lg transform hover:-translate-y-1">
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

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
        <div className="max-w-4xl mx-auto">
          {/* Header section */}
          <div className="text-center mb-16">
            <div className="inline-block mb-6">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 rounded-full text-white text-sm font-semibold uppercase tracking-wider shadow-lg">
                Upload Course Materials
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="text-gray-800">Share Your</span>{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Study Materials
              </span>
              <br />
              <span className="text-gray-700">Effortlessly</span>
            </h1>

            {/* Decorative elements */}
            <div className="flex justify-center items-center mt-6 space-x-2 mb-8">
              <div className="w-12 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
              <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
              <div className="w-12 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
            </div>

            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              Upload your course notes and study materials to contribute to the learning community.
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Year and Branch Selection */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <MotionCard className="p-6 bg-white/60 backdrop-blur-sm border border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Year</h2>
                </div>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="bg-white border-gray-200 focus:ring-indigo-500">
                    <SelectValue placeholder="Choose academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {engineeringYears.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </MotionCard>

              <MotionCard className="p-6 bg-white/60 backdrop-blur-sm border border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Branch</h2>
                </div>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="bg-white border-gray-200 focus:ring-indigo-500">
                    <SelectValue placeholder="Choose your branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch} value={branch}>
                        {branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </MotionCard>
            </motion.div>

            {/* Subject and Unit Inputs */}
            <AnimatePresence>
              {subjects.map((subject, subjectIndex) => (
                <MotionCard
                  key={subjectIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`overflow-hidden border-gray-200 shadow-xl ${
                    subject.units.every((u) => u.uploadStatus === "success")
                      ? "border-green-500 bg-green-50/30"
                      : subject.units.some((u) => u.uploadStatus === "error")
                      ? "border-red-500 bg-red-50/30"
                      : "bg-white/60 backdrop-blur-sm"
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full">
                              <Library className="h-5 w-5 text-white" />
                            </div>
                            <Label
                              htmlFor={`subject-${subjectIndex}`}
                              className="text-lg font-semibold text-gray-800"
                            >
                              Subject Details
                            </Label>
                          </div>
                          <Input
                            id={`subject-${subjectIndex}`}
                            value={subject.name}
                            onChange={(e) =>
                              updateSubject(subjectIndex, "name", e.target.value)
                            }
                            placeholder="Enter subject name"
                            className="bg-white border-gray-200 focus:ring-indigo-500"
                            disabled={subject.units.some(
                              (u) => u.uploadStatus === "success" || u.uploadStatus === "uploading"
                            )}
                          />
                        </div>
                        {subjects.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeSubject(subjectIndex)}
                            disabled={subject.units.some((u) => u.uploadStatus === "uploading")}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {subject.units.map((unit, unitIndex) => (
                        <motion.div
                          key={unitIndex}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-2 border-t pt-4 border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full">
                                <Bookmark className="h-4 w-4 text-white" />
                              </div>
                              <Label className="text-gray-800">Unit {unit.unitNumber} Notes</Label>
                            </div>
                            {subject.units.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeUnit(subjectIndex, unitIndex)}
                                disabled={unit.uploadStatus === "uploading"}
                                className="border-gray-200 text-gray-700 hover:bg-gray-100"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="flex space-x-2 items-center">
                            <input
                              type="file"
                              id={`notes-file-${subjectIndex}-${unitIndex}`}
                              className="hidden"
                              accept=".pdf,.doc,.docx,.ppt,.pptx"
                              onChange={handleFileChange(subjectIndex, unitIndex)}
                              ref={(el) => {
                                fileInputRefs.current[`notes-file-${subjectIndex}-${unitIndex}`] = el;
                              }}
                              disabled={unit.uploadStatus === "uploading" || unit.uploadStatus === "success"}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                triggerFileInput(`notes-file-${subjectIndex}-${unitIndex}`)
                              }
                              disabled={unit.uploadStatus === "uploading" || unit.uploadStatus === "success"}
                              className={`border-gray-200 text-gray-700 ${
                                unit.notesFile ? "bg-indigo-50" : ""
                              } hover:bg-gray-100`}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              {unit.notesFile ? "Change File" : "Upload File"}
                            </Button>

                            {unit.uploadStatus === "success" && (
                              <span className="text-green-500 flex items-center">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Uploaded
                              </span>
                            )}

                            {unit.uploadStatus === "error" && (
                              <span className="text-red-500 flex items-center">
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                {unit.errorMessage || "Failed"}
                              </span>
                            )}
                          </div>

                          {unit.notesFile && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-gray-50 p-3 rounded-md border border-gray-200"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <File className="h-4 w-4 mr-2 text-indigo-500" />
                                  <span className="text-sm font-medium truncate max-w-[250px]">
                                    {unit.notesFile.name}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {unit.fileSize} | {unit.fileType}
                                </div>
                              </div>

                              {unit.uploadStatus === "uploading" && (
                                <div className="mt-2">
                                  <Progress value={unit.uploadProgress} className="h-2 bg-gray-200" />
                                  <div className="text-xs text-right mt-1 text-indigo-600">
                                    {Math.round(unit.uploadProgress || 0)}%
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </motion.div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addUnit(subjectIndex)}
                        disabled={isLoading}
                        className="border-gray-200 text-gray-700 hover:bg-gray-100"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Unit
                      </Button>
                    </div>
                  </CardContent>
                </MotionCard>
              ))}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flex gap-4 flex-col">
              <Button
                type="button"
                variant="outline"
                className="w-full border-gray-200 text-gray-700 hover:bg-gray-100"
                onClick={addSubject}
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Subject
              </Button>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                disabled={
                  isLoading || !subjects.some((s) => s.name && s.units.some((u) => u.notesFile))
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading... {Math.round(overallProgress)}%
                  </>
                ) : (
                  <>
                    Upload Notes
                    <Upload className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>

            {/* Overall Progress */}
            {isLoading && (
              <div className="mt-4">
                <Progress value={overallProgress} className="h-2 bg-gray-200" />
                <p className="text-sm text-center mt-2 text-indigo-600">
                  Uploading to Cloudinary... {Math.round(overallProgress)}%
                </p>
              </div>
            )}

            {/* Recent Uploads */}
            {recentUploads.length > 0 && (
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 border-gray-200 shadow-xl bg-white/60 backdrop-blur-sm"
              >
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
                    <Info className="h-5 w-5 text-indigo-600" />
                    Recent Uploads
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-3">
                    {recentUploads.map((upload, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div>
                          <p className="font-medium text-gray-800">
                            {upload.subject} - Unit {upload.unit}
                          </p>
                          <p className="text-sm text-gray-600">{upload.course}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-200 text-gray-700 hover:bg-gray-100"
                          asChild
                        >
                          <a href={upload.url} target="_blank" rel="noopener noreferrer">
                            View
                          </a>
                        </Button>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </MotionCard>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}