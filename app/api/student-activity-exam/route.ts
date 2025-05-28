import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "../(lib)/mongodb";
import ExamStudentActivity, { IExamStudentActivity } from "../(model)/studentexam";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { userId, userName, exam, subject, chapterNumber, activityType, quizResult } = body;

    if (!userId || !userName || !exam || !subject || chapterNumber == null || !activityType) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    if (!["notes_access", "quiz_submission"].includes(activityType)) {
      return NextResponse.json({ message: "Invalid activity type" }, { status: 400 });
    }

    const activity: Partial<IExamStudentActivity> = {
      userId,
      userName,
      exam,
      subject,
      chapterNumber,
      activityType,
      timestamp: new Date(),
    };

    if (activityType === "quiz_submission" && quizResult) {
      activity.quizResult = quizResult;
    }

    const savedActivity = await ExamStudentActivity.create(activity);

    return NextResponse.json(
      { message: "Activity logged successfully", activity: savedActivity },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error logging exam activity:", error);
    return NextResponse.json(
      { message: "Error logging activity", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const isAdmin = url.searchParams.get("isAdmin") === "true";

    if (!isAdmin && !userId) {
      return NextResponse.json(
        { message: "Unauthorized: userId or admin access required" },
        { status: 401 }
      );
    }

    const query: any = {};
    if (userId && !isAdmin) {
      query.userId = userId;
    }

    const activities = await ExamStudentActivity.find(query).sort({ timestamp: -1 });

    return NextResponse.json({ activities }, { status: 200 });
  } catch (error) {
    console.error("Error fetching exam activities:", error);
    return NextResponse.json(
      { message: "Error fetching activities", error: (error as Error).message },
      { status: 500 }
    );
  }
}