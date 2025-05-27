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

const MotionCard = motion(Card);

export default function UploadPage() {
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

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

  const addSubject = () => {
    setSubjects([
      ...subjects,
      {
        name: "",
        units: [{ unitNumber: 1, uploadStatus: "idle", uploadProgress: 0 }],
      },
    ]);
  };

  const removeSubject = (index: number) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter((_, i) => i !== index));
    }
  };

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

  const removeUnit = (subjectIndex: number, unitIndex: number) => {
    const updatedSubjects = [...subjects];
    if (updatedSubjects[subjectIndex].units.length > 1) {
      updatedSubjects[subjectIndex].units = updatedSubjects[
        subjectIndex
      ].units.filter((_, i) => i !== unitIndex);
      setSubjects(updatedSubjects);
    }
  };

  const updateSubject = (
    index: number,
    field: keyof Subject,
    value: string
  ) => {
    const updatedSubjects = [...subjects];
    updatedSubjects[index] = { ...updatedSubjects[index], [field]: value };
    setSubjects(updatedSubjects);
  };

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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

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
      updateUnit(
        subjectIndex,
        unitIndex,
        "fileSize",
        formatFileSize(file.size)
      );
      updateUnit(
        subjectIndex,
        unitIndex,
        "fileType",
        fileExtension.slice(1).toUpperCase()
      );
      updateUnit(subjectIndex, unitIndex, "uploadStatus", "idle");
      updateUnit(subjectIndex, unitIndex, "uploadProgress", 0);
    };

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
    const progressSum = subjects.reduce((sum, s) => {
      return (
        sum +
        s.units.reduce((unitSum, u) => unitSum + (u.uploadProgress || 0), 0)
      );
    }, 0);
    setOverallProgress(progressSum / totalUnits);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedYear || !selectedBranch) {
      toast.error("Please select year and branch");
      return;
    }

    const validSubjects = subjects.filter(
      (subject) =>
        subject.name.trim() && subject.units.some((unit) => unit.notesFile)
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
                saveRecentUpload(
                  courseName,
                  subj.name,
                  unit.unitNumber,
                  unit.notesFileUrl
                );
              });
            });
          }

          setSelectedYear("");
          setSelectedBranch("");
          setSubjects([
            {
              name: "",
              units: [
                { unitNumber: 1, uploadStatus: "idle", uploadProgress: 0 },
              ],
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

  const triggerFileInput = (inputId: string) => {
    if (fileInputRefs.current[inputId]) {
      fileInputRefs.current[inputId]?.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 text-blue-900 tracking-tight">
          Course Materials Upload
        </h1>
        <p className="text-center text-blue-700 mb-10 max-w-2xl mx-auto">
          Upload study materials and notes for your courses
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <MotionCard className="p-6 bg-white/90 backdrop-blur-sm border border-blue-100 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-blue-100 rounded-full">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-blue-900">Year</h2>
              </div>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="bg-white border-blue-200 focus:ring-blue-500">
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

            <MotionCard className="p-6 bg-white/90 backdrop-blur-sm border border-blue-100 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-blue-100 rounded-full">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-blue-900">Branch</h2>
              </div>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="bg-white border-blue-200 focus:ring-blue-500">
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

          <AnimatePresence>
            {subjects.map((subject, subjectIndex) => (
              <MotionCard
                key={subjectIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`overflow-hidden border-blue-100 shadow-xl ${
                  subject.units.every((u) => u.uploadStatus === "success")
                    ? "border-green-500 bg-green-50/50"
                    : subject.units.some((u) => u.uploadStatus === "error")
                    ? "border-red-500 bg-red-50/50"
                    : "bg-white/90 backdrop-blur-sm"
                }`}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Library className="h-5 w-5 text-blue-600" />
                          </div>
                          <Label
                            htmlFor={`subject-${subjectIndex}`}
                            className="text-lg font-semibold text-blue-900"
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
                          className="bg-white border-blue-200 focus:ring-blue-500"
                          disabled={subject.units.some(
                            (u) =>
                              u.uploadStatus === "success" ||
                              u.uploadStatus === "uploading"
                          )}
                        />
                      </div>
                      {subjects.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removeSubject(subjectIndex)}
                          disabled={subject.units.some(
                            (u) => u.uploadStatus === "uploading"
                          )}
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
                        className="space-y-2 border-t pt-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 rounded-full">
                              <Bookmark className="h-4 w-4 text-blue-600" />
                            </div>
                            <Label className="text-blue-900">
                              Unit {unit.unitNumber} Notes
                            </Label>
                          </div>
                          {subject.units.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                removeUnit(subjectIndex, unitIndex)
                              }
                              disabled={unit.uploadStatus === "uploading"}
                              className="border-blue-200 text-blue-700"
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
                            ref={(el) =>
                              (fileInputRefs.current[
                                `notes-file-${subjectIndex}-${unitIndex}`
                              ] = el)
                            }
                            disabled={
                              unit.uploadStatus === "uploading" ||
                              unit.uploadStatus === "success"
                            }
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              triggerFileInput(
                                `notes-file-${subjectIndex}-${unitIndex}`
                              )
                            }
                            disabled={
                              unit.uploadStatus === "uploading" ||
                              unit.uploadStatus === "success"
                            }
                            className={`border-blue-200 ${
                              unit.notesFile ? "bg-blue-50" : ""
                            }`}
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
                            className="bg-slate-50 p-3 rounded-md border border-slate-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <File className="h-4 w-4 mr-2 text-blue-500" />
                                <span className="text-sm font-medium truncate max-w-[250px]">
                                  {unit.notesFile.name}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {unit.fileSize} | {unit.fileType}
                              </div>
                            </div>

                            {unit.uploadStatus === "uploading" && (
                              <div className="mt-2">
                                <Progress
                                  value={unit.uploadProgress}
                                  className="h-2"
                                />
                                <div className="text-xs text-right mt-1 text-blue-600">
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
                      className="border-blue-200 text-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Unit
                    </Button>
                  </div>
                </CardContent>
              </MotionCard>
            ))}
          </AnimatePresence>

          <div className="flex gap-4 flex-col">
            <Button
              type="button"
              variant="outline"
              className="w-full border-blue-200 text-blue-700"
              onClick={addSubject}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Subject
            </Button>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={
                isLoading ||
                !subjects.some(
                  (s) => s.name && s.units.some((u) => u.notesFile)
                )
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

          {isLoading && (
            <div className="mt-4">
              <Progress value={overallProgress} className="h-2" />
              <p className="text-sm text-center mt-2 text-blue-600">
                Uploading to Cloudinary... {Math.round(overallProgress)}%
              </p>
            </div>
          )}

          {recentUploads.length > 0 && (
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 border-blue-100 shadow-xl bg-white/90 backdrop-blur-sm"
            >
              <CardHeader className="border-b border-blue-100">
                <CardTitle className="text-xl text-blue-900 flex items-center gap-2">
                  <Info className="h-5 w-5" />
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
                      className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div>
                        <p className="font-medium text-blue-900">
                          {upload.subject} - Unit {upload.unit}
                        </p>
                        <p className="text-sm text-blue-600">{upload.course}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-200 text-blue-700"
                        asChild
                      >
                        <a
                          href={upload.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
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
  );
}
