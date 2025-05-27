import mongoose, { Schema, Document } from "mongoose";

export interface IChapter {
  chapterNumber: number;
  notesFileUrl: string;
  publicId: string;
  summary?: string;
  quiz: { question: string; options: string[]; answer: string }[];
}

export interface IExam extends Document {
  exam: string;
  subjects: { name: string; chapters: IChapter[] }[];
  createdAt: Date;
  updatedAt: Date;
}

const ExamSchema = new Schema(
  {
    exam: { type: String, required: true },
    subjects: [
      {
        name: { type: String, required: true },
        chapters: [
          {
            chapterNumber: { type: Number, required: true },
            notesFileUrl: { type: String, required: true },
            publicId: { type: String, required: true },
            summary: { type: String, default: "" },
            quiz: {
              type: [{ question: String, options: [String], answer: String }],
              default: [],
            },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

const Exam = mongoose.models.Exam || mongoose.model<IExam>("Exam", ExamSchema);
export default Exam;