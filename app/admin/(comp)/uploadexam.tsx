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

interface Chapter {
  chapterNumber: number;
  notesFile?: FileWithPreview;
  fileSize?: string;
  fileType?: string;
  uploadProgress?: number;
  uploadStatus?: "idle" | "uploading" | "success" | "error";
  errorMessage?: string;
}

interface Subject {
  name: string;
  chapters: Chapter[];
}

const competitiveExams = [
  "UPSC",
  "SSC",
  "Banking",
  "Railways",
  "State PSC",
  "GATE",
];

const acceptedFileTypes = [".pdf", ".doc", ".docx", ".ppt", ".pptx"];

const MotionCard = motion(Card);

export default function UploadExamPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [subjects, setSubjects] = useState<Subject[]>([
    {
      name: "",
      chapters: [{ chapterNumber: 1, uploadStatus: "idle", uploadProgress: 0 }],
    },
  ]);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [recentUploads, setRecentUploads] = useState<
    { exam: string; subject: string; chapter: number; url: string }[]
  >([]);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const savedUploads = localStorage.getItem("recentExamUploads");
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
        chapters: [{ chapterNumber: 1, uploadStatus: "idle", uploadProgress: 0 }],
      },
    ]);
  };

  const removeSubject = (index: number) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter((_, i) => i !== index));
    }
  };

  const addChapter = (subjectIndex: number) => {
    const updatedSubjects = [...subjects];
    const nextChapterNumber = updatedSubjects[subjectIndex].chapters.length + 1;
    updatedSubjects[subjectIndex].chapters.push({
      chapterNumber: nextChapterNumber,
      uploadStatus: "idle",
      uploadProgress: 0,
    });
    setSubjects(updatedSubjects);
  };

  const removeChapter = (subjectIndex: number, chapterIndex: number) => {
    const updatedSubjects = [...subjects];
    if (updatedSubjects[subjectIndex].chapters.length > 1) {
      updatedSubjects[subjectIndex].chapters = updatedSubjects[subjectIndex].chapters.filter(
        (_, i) => i !== chapterIndex
      );
      setSubjects(updatedSubjects);
    }
  };

  const updateSubject = (index: number, field: keyof Subject, value: string) => {
    const updatedSubjects = [...subjects];
    updatedSubjects[index] = { ...updatedSubjects[index], [field]: value };
    setSubjects(updatedSubjects);
  };

  const updateChapter = (
    subjectIndex: number,
    chapterIndex: number,
    field: keyof Chapter,
    value: any
  ) => {
    const updatedSubjects = [...subjects];
    updatedSubjects[subjectIndex].chapters[chapterIndex] = {
      ...updatedSubjects[subjectIndex].chapters[chapterIndex],
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
    (subjectIndex: number, chapterIndex: number) =>
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

      updateChapter(subjectIndex, chapterIndex, "notesFile", file);
      updateChapter(
        subjectIndex,
        chapterIndex,
        "fileSize",
        formatFileSize(file.size)
      );
      updateChapter(
        subjectIndex,
        chapterIndex,
        "fileType",
        fileExtension.slice(1).toUpperCase()
      );
      updateChapter(subjectIndex, chapterIndex, "uploadStatus", "idle");
      updateChapter(subjectIndex, chapterIndex, "uploadProgress", 0);
    };

  const updateUploadProgress = (
    subjectIndex: number,
    chapterIndex: number,
    progress: number
  ) => {
    updateChapter(subjectIndex, chapterIndex, "uploadProgress", progress);
    updateChapter(
      subjectIndex,
      chapterIndex,
      "uploadStatus",
      progress === 100 ? "success" : "uploading"
    );

    const totalChapters = subjects.reduce((sum, s) => sum + s.chapters.length, 0);
    const progressSum = subjects.reduce((sum, s) => {
      return (
        sum +
        s.chapters.reduce((chapterSum, c) => chapterSum + (c.uploadProgress || 0), 0)
      );
    }, 0);
    setOverallProgress(progressSum / totalChapters);
  };

  const saveRecentUpload = (
    exam: string,
    subject: string,
    chapter: number,
    url: string
  ) => {
    const newUpload = { exam, subject, chapter, url };
    const updatedUploads = [newUpload, ...recentUploads].slice(0, 3);
    setRecentUploads(updatedUploads);
    localStorage.setItem("recentExamUploads", JSON.stringify(updatedUploads));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedExam) {
      toast.error("Please select an exam");
      return;
    }

    const validSubjects = subjects.filter(
      (subject) =>
        subject.name.trim() && subject.chapters.some((chapter) => chapter.notesFile)
    );
    if (validSubjects.length === 0) {
      toast.error("Please add at least one subject with a chapter and notes file");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Preparing to upload files...");

    try {
      const formData = new FormData();
      formData.append("exam", selectedExam);
      formData.append(
        "subjects",
        JSON.stringify(
          validSubjects.map((subject) => ({
            name: subject.name.trim(),
            chapters: subject.chapters
              .filter((chapter) => chapter.notesFile)
              .map((chapter) => ({
                chapterNumber: chapter.chapterNumber,
              })),
          }))
        )
      );

      subjects.forEach((subject, subjectIndex) => {
        subject.chapters.forEach((chapter, chapterIndex) => {
          if (chapter.notesFile) {
            formData.append(
              `notes-file-${subjectIndex}-${chapterIndex}`,
              chapter.notesFile,
              chapter.notesFile.name
            );
            updateChapter(subjectIndex, chapterIndex, "uploadStatus", "uploading");
          }
        });
      });

      toast.dismiss(toastId);
      toast.loading("Uploading files to Cloudinary...");

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/exam", true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setOverallProgress(percentComplete);

          subjects.forEach((subject, sIdx) => {
            subject.chapters.forEach((chapter, cIdx) => {
              if (chapter.notesFile) {
                updateUploadProgress(sIdx, cIdx, percentComplete);
              }
            });
          });
        }
      };

      xhr.onload = function () {
        if (xhr.status === 201 || xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);

          toast.success("Notes uploaded successfully!");

          if (response.exam && response.exam.subjects) {
            response.exam.subjects.forEach((subj: any) => {
              subj.chapters.forEach((chapter: any) => {
                saveRecentUpload(
                  selectedExam,
                  subj.name,
                  chapter.chapterNumber,
                  chapter.notesFileUrl
                );
              });
            });
          }

          setSelectedExam("");
          setSubjects([
            {
              name: "",
              chapters: [
                { chapterNumber: 1, uploadStatus: "idle", uploadProgress: 0 },
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
            chapters: s.chapters.map((c) =>
              c.uploadStatus === "uploading"
                ? { ...c, uploadStatus: "error", errorMessage: "Upload failed" }
                : c
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
          Competitive Exam Notes Upload
        </h1>
        <p className="text-center text-blue-700 mb-10 max-w-2xl mx-auto">
          Upload study materials and notes for competitive exams
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <MotionCard className="p-6 bg-white/90 backdrop-blur-sm border border-blue-100 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-blue-100 rounded-full">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-blue-900">Exam</h2>
              </div>
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger className="bg-white border-blue-200 focus:ring-blue-500">
                  <SelectValue placeholder="Choose competitive exam" />
                </SelectTrigger>
                <SelectContent>
                  {competitiveExams.map((exam) => (
                    <SelectItem key={exam} value={exam}>
                      {exam}
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
                  subject.chapters.every((c) => c.uploadStatus === "success")
                    ? "border-green-500 bg-green-50/50"
                    : subject.chapters.some((c) => c.uploadStatus === "error")
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
                          disabled={subject.chapters.some(
                            (c) =>
                              c.uploadStatus === "success" ||
                              c.uploadStatus === "uploading"
                          )}
                        />
                      </div>
                      {subjects.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removeSubject(subjectIndex)}
                          disabled={subject.chapters.some(
                            (c) => c.uploadStatus === "uploading"
                          )}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {subject.chapters.map((chapter, chapterIndex) => (
                      <motion.div
                        key={chapterIndex}
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
                              Chapter {chapter.chapterNumber} Notes
                            </Label>
                          </div>
                          {subject.chapters.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                removeChapter(subjectIndex, chapterIndex)
                              }
                              disabled={chapter.uploadStatus === "uploading"}
                              className="border-blue-200 text-blue-700"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="flex space-x-2 items-center">
                          <input
                            type="file"
                            id={`notes-file-${subjectIndex}-${chapterIndex}`}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.ppt,.pptx"
                            onChange={handleFileChange(subjectIndex, chapterIndex)}
                           ref={(el) => {
  fileInputRefs.current[`notes-file-${subjectIndex}-${chapterIndex}`] = el;
}}

                            disabled={
                              chapter.uploadStatus === "uploading" ||
                              chapter.uploadStatus === "success"
                            }
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              triggerFileInput(
                                `notes-file-${subjectIndex}-${chapterIndex}`
                              )
                            }
                            disabled={
                              chapter.uploadStatus === "uploading" ||
                              chapter.uploadStatus === "success"
                            }
                            className={`border-blue-200 ${
                              chapter.notesFile ? "bg-blue-50" : ""
                            }`}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            {chapter.notesFile ? "Change File" : "Upload File"}
                          </Button>

                          {chapter.uploadStatus === "success" && (
                            <span className="text-green-500 flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Uploaded
                            </span>
                          )}

                          {chapter.uploadStatus === "error" && (
                            <span className="text-red-500 flex items-center">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              {chapter.errorMessage || "Failed"}
                            </span>
                          )}
                        </div>

                        {chapter.notesFile && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-50 p-3 rounded-md border border-slate-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <File className="h-4 w-4 mr-2 text-blue-500" />
                                <span className="text-sm font-medium truncate max-w-[250px]">
                                  {chapter.notesFile.name}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {chapter.fileSize} | {chapter.fileType}
                              </div>
                            </div>

                            {chapter.uploadStatus === "uploading" && (
                              <div className="mt-2">
                                <Progress
                                  value={chapter.uploadProgress}
                                  className="h-2"
                                />
                                <div className="text-xs text-right mt-1 text-blue-600">
                                  {Math.round(chapter.uploadProgress || 0)}%
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
                      onClick={() => addChapter(subjectIndex)}
                      disabled={isLoading}
                      className="border-blue-200 text-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Chapter
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
                  (s) => s.name && s.chapters.some((c) => c.notesFile)
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
                          {upload.subject} - Chapter {upload.chapter}
                        </p>
                        <p className="text-sm text-blue-600">{upload.exam}</p>
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