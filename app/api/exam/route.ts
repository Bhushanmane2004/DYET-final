// File: /api/notes.ts
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "../(lib)/mongodb";
import Exam from "../(model)/Exam";
import ExamStudentActivity from "../(model)/studentexam"; // Import the ExamStudentActivity model
import { uploadToCloudinary, deleteFromCloudinary } from "../(lib)/cloudinary";
import axios from "axios";
import { PdfReader } from "pdfreader";

const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyCIFxqaCGYGBy3YJZFKMKVgMguOMBIX1k0"; // Use environment variable for security
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// Helper function to extract text from PDF
const extractTextFromPDF = async (pdfBuffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    let extractedText = "";
    new PdfReader().parseBuffer(pdfBuffer, (err, item) => {
      if (err) {
        reject(`Error reading PDF: ${err}`);
      } else if (!item) {
        resolve(extractedText.trim());
      } else if (item.text) {
        extractedText += item.text + " ";
      }
    });
  });
};

// Helper function to generate content (summary or quiz) using Gemini API
const generateContent = async (text: string, type: "summary" | "quiz"): Promise<string> => {
  try {
    const maxLength = 90000; // Split text into chunks to avoid API limits
    const textChunks = [];
    for (let i = 0; i < text.length; i += maxLength) {
      textChunks.push(text.slice(i, i + maxLength));
    }

    const responses = await Promise.all(
      textChunks.map(async (chunk) => {
        const prompt =
          type === "summary"
            ? `Generate a concise summary of this content:\n\n${chunk}`
            : `Generate a multiple-choice quiz from this content in JSON format like this:\n{\n  "quiz": [\n    {\n      "question": "What is the capital of France?",\n      "options": ["Berlin", "Madrid", "Paris", "Rome"],\n      "answer": "Paris"\n    }\n  ]\n}\n\n${chunk}`;
        const response = await axios.post(API_URL, {
          contents: [{ parts: [{ text: prompt }] }],
        });
        return response.data;
      })
    );

    const combinedText = responses
      .map((result) => result?.candidates?.[0]?.content?.parts?.[0]?.text || "")
      .join(" ");
    return combinedText;
  } catch (error: any) {
    console.error(`Failed to generate ${type}:`, error.message);
    return type === "summary"
      ? "Summary generation failed."
      : JSON.stringify({
          quiz: [
            {
              question: "What is the capital of France?",
              options: ["Berlin", "Madrid", "Paris", "Rome"],
              answer: "Paris",
            },
          ],
        });
  }
};

// Helper function to clean quiz data
const cleanQuizData = (quizData: string): string => {
  let cleaned = quizData.replace(/```json/g, "").replace(/```/g, "").trim();
  const jsonStartPos = cleaned.indexOf("{");
  const jsonEndPos = cleaned.lastIndexOf("}") + 1;
  if (jsonStartPos >= 0 && jsonEndPos > jsonStartPos) {
    cleaned = cleaned.substring(jsonStartPos, jsonEndPos);
  }
  return cleaned;
};

// Helper function to parse quiz data
const parseQuizData = (quizData: string): any[] => {
  try {
    const cleanedQuizData = cleanQuizData(quizData);
    const parsedData = JSON.parse(cleanedQuizData);
    if (!parsedData || !parsedData.quiz || !Array.isArray(parsedData.quiz)) {
      return [];
    }
    return parsedData.quiz.filter((item: any) => {
      return (
        item.question &&
        typeof item.question === "string" &&
        item.options &&
        Array.isArray(item.options) &&
        item.options.length >= 2 &&
        item.answer &&
        typeof item.answer === "string"
      );
    });
  } catch (error) {
    console.error("Error parsing quiz data:", error);
    return [];
  }
};

// POST endpoint to create or update an exam
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const formData = await req.formData();
    const exam = formData.get("exam") as string;
    const subjects = JSON.parse(formData.get("subjects") as string);

    if (!exam || !subjects || !Array.isArray(subjects)) {
      return NextResponse.json({ message: "Missing required fields: exam or subjects" }, { status: 400 });
    }

    const processedSubjects = await Promise.all(
      subjects.map(async (subject: any, subjectIndex: number) => {
        if (!subject.name?.trim() || !subject.chapters?.length) {
          console.warn(`Skipping subject ${subject.name} due to missing name or chapters`);
          return null;
        }

        const processedChapters = await Promise.all(
          subject.chapters.map(async (chapter: any, chapterIndex: number) => {
            const notesFile = formData.get(`notes-file-${subjectIndex}-${chapterIndex}`) as File | null;
            if (!notesFile) {
              console.warn(`Skipping chapter ${chapter.chapterNumber} in ${subject.name} due to missing file`);
              return null;
            }

            const notesFileBuffer = Buffer.from(await notesFile.arrayBuffer());
            const folderPath = `competitive-exam-notes/${exam
              .replace(/\s+/g, "-")
              .toLowerCase()}`;
            const fileName = `${subject.name
              .replace(/\s+/g, "-")
              .toLowerCase()}-chapter-${chapter.chapterNumber}-${Date.now()}`;

            let uploadResult;
            try {
              uploadResult = await uploadToCloudinary(notesFileBuffer, folderPath, fileName);
            } catch (error) {
              console.error(`Cloudinary upload failed for ${subject.name} Chapter ${chapter.chapterNumber}:`, error);
              throw new Error(`Cloudinary upload failed: ${(error as Error).message}`);
            }

            if (!uploadResult || !uploadResult.url || !uploadResult.public_id) {
              console.error(`Invalid upload result for ${subject.name} Chapter ${chapter.chapterNumber}:`, uploadResult);
              throw new Error(`Invalid upload result for ${subject.name} Chapter ${chapter.chapterNumber}`);
            }

            const notesFileUrl = uploadResult.url;
            const publicId = uploadResult.public_id;

            let pdfText;
            try {
              const response = await axios.get(notesFileUrl, { responseType: "arraybuffer" });
              pdfText = await extractTextFromPDF(Buffer.from(response.data));
            } catch (error) {
              console.error(`Failed to extract text from PDF for ${subject.name} Chapter ${chapter.chapterNumber}:`, error);
              pdfText = "Text extraction failed.";
            }

            const summary = await generateContent(pdfText, "summary");
            const quizData = await generateContent(pdfText, "quiz");
            const quiz = parseQuizData(quizData);

            return {
              chapterNumber: chapter.chapterNumber,
              notesFileUrl,
              publicId,
              summary,
              quiz,
            };
          })
        );

        const validChapters = processedChapters.filter((chapter) => chapter !== null);
        if (validChapters.length === 0) {
          console.warn(`No valid chapters for subject ${subject.name}`);
          return null;
        }

        return {
          name: subject.name.trim(),
          chapters: validChapters,
        };
      })
    );

    const validSubjects = processedSubjects.filter((subject) => subject !== null);

    if (validSubjects.length === 0) {
      return NextResponse.json({ message: "No valid subjects provided" }, { status: 400 });
    }

    const existingExam = await Exam.findOne({ exam });

    if (existingExam) {
      validSubjects.forEach((newSubject: any) => {
        const existingSubject = existingExam.subjects.find(
          (s: any) => s.name === newSubject.name
        );
        if (existingSubject) {
          newSubject.chapters.forEach((newChapter: any) => {
            const existingChapter = existingSubject.chapters.find(
              (c: any) => c.chapterNumber === newChapter.chapterNumber
            );
            if (!existingChapter) {
              existingSubject.chapters.push(newChapter);
            } else {
              existingChapter.notesFileUrl = newChapter.notesFileUrl;
              existingChapter.publicId = newChapter.publicId;
              existingChapter.summary = newChapter.summary;
              existingChapter.quiz = newChapter.quiz;
            }
          });
        } else {
          existingExam.subjects.push(newSubject);
        }
      });
      await existingExam.save();

      return NextResponse.json(
        {
          message: "Subjects and chapters added to existing exam!",
          exam: existingExam,
        },
        { status: 200 }
      );
    } else {
      const newExam = new Exam({
        exam,
        subjects: validSubjects,
      });

      const savedExam = await newExam.save();

      return NextResponse.json(
        {
          message: "Exam added successfully!",
          exam: savedExam,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Error saving exam:", error);
    return NextResponse.json(
      {
        message: "Error saving exam",
        error: (error as Error).message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch exams or quizzes
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const url = new URL(req.url);
    const exam = url.searchParams.get("exam");
    const subjectName = url.searchParams.get("subject");
    const chapterNumber = url.searchParams.get("chapterNumber");
    const quizOnly = url.searchParams.get("quizOnly") === "true";

    const query: any = {};
    if (exam) query.exam = exam;

    const exams = await Exam.find(query);

    if (quizOnly && subjectName) {
      const quizzes: any[] = [];
      for (const exam of exams) {
        const matchedSubject = exam.subjects.find((subject: any) => subject.name === subjectName);
        if (matchedSubject) {
          const chapters = chapterNumber
            ? matchedSubject.chapters.filter(
                (chapter: any) => chapter.chapterNumber === Number(chapterNumber)
              )
            : matchedSubject.chapters;
          chapters.forEach((chapter: any) => {
            if (chapter.quiz && chapter.quiz.length > 0) {
              quizzes.push({
                examId: exam._id,
                exam: exam.exam,
                subjectName: matchedSubject.name,
                chapterNumber: chapter.chapterNumber,
                quiz: chapter.quiz,
                summary: chapter.summary,
              });
            }
          });
        }
      }
      return NextResponse.json({ quizzes }, { status: 200 });
    }

    if (subjectName) {
      const filteredExams = exams.map((exam) => ({
        ...exam.toObject(),
        subjects: exam.subjects
          .filter((subject: any) => subject.name === subjectName)
          .map((subject: any) => ({
            ...subject,
            chapters: chapterNumber
              ? subject.chapters.filter(
                  (chapter: any) => chapter.chapterNumber === Number(chapterNumber)
                )
              : subject.chapters,
          })),
      }));
      return NextResponse.json({ exams: filteredExams }, { status: 200 });
    }

    return NextResponse.json({ exams }, { status: 200 });
  } catch (error) {
    console.error("Error fetching exams:", error);
    return NextResponse.json(
      {
        message: "Error fetching exams",
        error: (error as Error).message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT endpoint to update a chapter's notes and quiz
export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const formData = await req.formData();
    const exam = formData.get("exam") as string;
    const subject = formData.get("subject") as string;
    const chapterNumber = parseInt(formData.get("chapterNumber") as string);
    const notesFile = formData.get("notesFile") as File | null;
    const quizString = formData.get("quiz") as string;

    // Validate required fields
    if (!exam || !subject || isNaN(chapterNumber)) {
      return NextResponse.json(
        { message: "Missing required fields: exam, subject, or chapterNumber" },
        { status: 400 }
      );
    }

    // Find the exam
    const examData = await Exam.findOne({ exam });
    if (!examData) {
      return NextResponse.json({ message: "Exam not found" }, { status: 404 });
    }

    // Find the subject
    const subjectData = examData.subjects.find((s: any) => s.name === subject);
    if (!subjectData) {
      return NextResponse.json({ message: "Subject not found" }, { status: 404 });
    }

    // Find the chapter
    const chapter = subjectData.chapters.find((c: any) => c.chapterNumber === chapterNumber);
    if (!chapter) {
      return NextResponse.json({ message: "Chapter not found" }, { status: 404 });
    }

    // Handle notes file update
    if (notesFile) {
      const notesFileBuffer = Buffer.from(await notesFile.arrayBuffer());
      const folderPath = `competitive-exam-notes/${exam
        .replace(/\s+/g, "-")
        .toLowerCase()}`;
      const fileName = `${subject
        .replace(/\s+/g, "-")
        .toLowerCase()}-chapter-${chapterNumber}-${Date.now()}`;

      // Delete old file from Cloudinary if it exists
      if (chapter.publicId) {
        try {
          await deleteFromCloudinary(chapter.publicId);
        } catch (error) {
          console.error(`Failed to delete old file from Cloudinary: ${chapter.publicId}`, error);
        }
      }

      // Upload new file to Cloudinary
      const uploadResult = await uploadToCloudinary(notesFileBuffer, folderPath, fileName);
      if (!uploadResult || !uploadResult.url || !uploadResult.public_id) {
        throw new Error("Invalid upload result from Cloudinary");
      }

      chapter.notesFileUrl = uploadResult.url;
      chapter.publicId = uploadResult.public_id;

      // Regenerate summary from new PDF
      try {
        const pdfText = await extractTextFromPDF(notesFileBuffer);
        chapter.summary = await generateContent(pdfText, "summary");
      } catch (error) {
        console.error("Failed to regenerate summary:", error);
        chapter.summary = "Summary generation failed.";
      }
    }

    // Update quiz if provided
    if (quizString) {
      try {
        const quiz = JSON.parse(quizString);
        if (Array.isArray(quiz)) {
          chapter.quiz = quiz.filter(
            (item: any) =>
              item.question &&
              typeof item.question === "string" &&
              item.options &&
              Array.isArray(item.options) &&
              item.options.length >= 2 &&
              item.answer &&
              typeof item.answer === "string"
          );
        } else {
          console.warn("Quiz data is not an array:", quiz);
        }
      } catch (error) {
        console.error("Error parsing quiz data:", error);
        return NextResponse.json(
          { message: "Invalid quiz data format" },
          { status: 400 }
        );
      }
    }

    // Save the updated exam
    await examData.save();

    return NextResponse.json(
      { message: "Chapter updated successfully", chapter },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating chapter:", error);
    return NextResponse.json(
      {
        message: "Error updating chapter",
        error: (error as Error).message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete a chapter
export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { exam, subject, chapterNumber } = body;

    // Validate required fields
    if (!exam || !subject || isNaN(chapterNumber)) {
      console.error("DELETE request failed: Missing required fields", { exam, subject, chapterNumber });
      return NextResponse.json(
        { message: "Missing required fields: exam, subject, or chapterNumber" },
        { status: 400 }
      );
    }

    // Find the exam
    const examData = await Exam.findOne({ exam });
    if (!examData) {
      console.error(`Exam not found: ${exam}`);
      return NextResponse.json({ message: `Exam '${exam}' not found` }, { status: 404 });
    }

    // Find the subject
    const subjectData = examData.subjects.find((s: any) => s.name === subject);
    if (!subjectData) {
      console.error(`Subject not found: ${subject} in exam: ${exam}`);
      return NextResponse.json({ message: `Subject '${subject}' not found` }, { status: 404 });
    }

    // Find the chapter index
    const chapterIndex = subjectData.chapters.findIndex(
      (c: any) => c.chapterNumber === Number(chapterNumber)
    );
    if (chapterIndex === -1) {
      console.error(`Chapter not found: ${chapterNumber} in subject: ${subject}, exam: ${exam}`);
      return NextResponse.json({ message: `Chapter ${chapterNumber} not found` }, { status: 404 });
    }

    // Get the chapter to delete
    const chapter = subjectData.chapters[chapterIndex];

    // Delete associated Cloudinary file if it exists
    if (chapter.publicId) {
      try {
        await deleteFromCloudinary(chapter.publicId);
        console.log(`Successfully deleted Cloudinary file: ${chapter.publicId}`);
      } catch (error) {
        console.error(`Failed to delete Cloudinary file: ${chapter.publicId}`, error);
        // Continue with deletion even if Cloudinary fails to avoid blocking
      }
    }

    // Remove the chapter from the subject
    subjectData.chapters.splice(chapterIndex, 1);

    // Optionally, clean up related student activity records
    try {
      await ExamStudentActivity.deleteMany({
        exam,
        subject,
        chapterNumber,
      });
      console.log(`Deleted student activity records for exam: ${exam}, subject: ${subject}, chapter: ${chapterNumber}`);
    } catch (error) {
      console.warn(`Failed to delete student activity records for exam: ${exam}, subject: ${subject}, chapter: ${chapterNumber}`, error);
      // Continue with chapter deletion even if activity cleanup fails
    }

    // Save the updated exam
    await examData.save();

    return NextResponse.json(
      { message: "Chapter deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting chapter:", {
      error: (error as Error).message || "Unknown error",
      stack: (error as Error).stack,
    });
    return NextResponse.json(
      {
        message: "Error deleting chapter",
        error: (error as Error).message || "Unknown error",
      },
      { status: 500 }
    );
  }
}