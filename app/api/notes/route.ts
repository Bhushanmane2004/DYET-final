import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "../(lib)/mongodb";
import Exam from "../(model)/Exam";

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
      const quizzes = [];
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
      { message: "Error fetching exams", error: (error as Error).message },
      { status: 500 }
    );
  }
}