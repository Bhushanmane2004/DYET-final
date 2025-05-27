import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "../(lib)/mongodb";
import Course from "../(model)/Course";
import { deleteFromCloudinary } from "../(lib)/cloudinary";

// GET endpoint to fetch a specific quiz question
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const url = new URL(req.url);
    const year = url.searchParams.get("year");
    const branch = url.searchParams.get("branch");
    const subjectName = url.searchParams.get("subject");
    const unitNumber = url.searchParams.get("unitNumber");
    const questionId = url.searchParams.get("questionId");

    if (!year || !branch || !subjectName || !unitNumber) {
      return NextResponse.json({ message: "Missing required query parameters" }, { status: 400 });
    }

    const course = await Course.findOne({ year, branch });
    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    const subject = course.subjects.find((s: any) => s.name === subjectName);
    if (!subject) {
      return NextResponse.json({ message: "Subject not found" }, { status: 404 });
    }

    const unit = subject.units.find((u: any) => u.unitNumber === Number(unitNumber));
    if (!unit) {
      return NextResponse.json({ message: "Unit not found" }, { status: 404 });
    }

    if (questionId) {
      const question = unit.quiz.find((q: any) => q._id.toString() === questionId);
      if (!question) {
        return NextResponse.json({ message: "Question not found" }, { status: 404 });
      }
      return NextResponse.json({ question }, { status: 200 });
    }

    return NextResponse.json({ quiz: unit.quiz }, { status: 200 });
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json(
      { message: "Error fetching quiz", error: (error as Error).message },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update a specific quiz question
export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const { year, branch, subjectName, unitNumber, questionId, updatedQuestion } = await req.json();

    if (!year || !branch || !subjectName || !unitNumber || !questionId || !updatedQuestion) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const course = await Course.findOne({ year, branch });
    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    const subject = course.subjects.find((s: any) => s.name === subjectName);
    if (!subject) {
      return NextResponse.json({ message: "Subject not found" }, { status: 404 });
    }

    const unit = subject.units.find((u: any) => u.unitNumber === Number(unitNumber));
    if (!unit) {
      return NextResponse.json({ message: "Unit not found" }, { status: 404 });
    }

    const questionIndex = unit.quiz.findIndex((q: any) => q._id.toString() === questionId);
    if (questionIndex === -1) {
      return NextResponse.json({ message: "Question not found" }, { status: 404 });
    }

    unit.quiz[questionIndex] = {
      ...unit.quiz[questionIndex],
      question: updatedQuestion.question,
      options: updatedQuestion.options,
      answer: updatedQuestion.answer,
    };

    await course.save();
    return NextResponse.json(
      { message: "Question updated successfully", question: unit.quiz[questionIndex] },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { message: "Error updating question", error: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete a quiz question or entire notes
export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { year, branch, subjectName, unitNumber, questionId, deleteNotes } = await req.json();

    if (!year || !branch || !subjectName || !unitNumber) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const course = await Course.findOne({ year, branch });
    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    const subject = course.subjects.find((s: any) => s.name === subjectName);
    if (!subject) {
      return NextResponse.json({ message: "Subject not found" }, { status: 404 });
    }

    const unitIndex = subject.units.findIndex((u: any) => u.unitNumber === Number(unitNumber));
    if (unitIndex === -1) {
      return NextResponse.json({ message: "Unit not found" }, { status: 404 });
    }

    if (deleteNotes) {
      const unit = subject.units[unitIndex];
      if (unit.publicId) {
        try {
          await deleteFromCloudinary(unit.publicId);
        } catch (error) {
          console.error("Error deleting from Cloudinary:", error);
          return NextResponse.json(
            { message: "Error deleting notes from Cloudinary", error: (error as Error).message },
            { status: 500 }
          );
        }
      }
      subject.units.splice(unitIndex, 1);
    } else if (questionId) {
      const unit = subject.units[unitIndex];
      const questionIndex = unit.quiz.findIndex((q: any) => q._id.toString() === questionId);
      if (questionIndex === -1) {
        return NextResponse.json({ message: "Question not found" }, { status: 404 });
      }
      unit.quiz.splice(questionIndex, 1);
    } else {
      return NextResponse.json({ message: "Specify questionId or deleteNotes" }, { status: 400 });
    }

    await course.save();
    return NextResponse.json(
      { message: deleteNotes ? "Notes deleted successfully" : "Question deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting:", error);
    return NextResponse.json(
      { message: "Error deleting", error: (error as Error).message },
      { status: 500 }
    );
  }
}