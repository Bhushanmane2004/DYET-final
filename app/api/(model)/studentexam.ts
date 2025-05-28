import mongoose, { Schema, Document } from "mongoose";

export interface IExamStudentActivity extends Document {
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
  timestamp: Date;
}

const ExamStudentActivitySchema = new Schema(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    exam: { type: String, required: true },
    subject: { type: String, required: true },
    chapterNumber: { type: Number, required: true },
    activityType: {
      type: String,
      enum: ["notes_access", "quiz_submission"],
      required: true,
    },
    quizResult: {
      score: { type: Number },
      totalQuestions: { type: Number },
      answers: { type: Map, of: String },
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const ExamStudentActivity =
  mongoose.models.ExamStudentActivity ||
  mongoose.model<IExamStudentActivity>("ExamStudentActivity", ExamStudentActivitySchema);

export default ExamStudentActivity;