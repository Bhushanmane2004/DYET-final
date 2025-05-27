"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

interface QuizSectionProps {
  quiz: { question: string; options: string[]; answer: string }[];
  userAnswers: { [key: string]: string };
  onAnswerChange: (questionIndex: string, answer: string) => void;
  onSubmitQuiz: () => void;
  quizSubmitted: boolean;
  quizScore: { score: number; total: number } | null;
}

export default function QuizSection({
  quiz,
  userAnswers,
  onAnswerChange,
  onSubmitQuiz,
  quizSubmitted,
  quizScore,
}: QuizSectionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const answeredQuestionsCount = Object.keys(userAnswers).length;
  const progressPercentage = (answeredQuestionsCount / quiz.length) * 100;

  const resetQuiz = () => {
    // Reset to first question
    setCurrentQuestionIndex(0);
  };

  const getScoreColor = () => {
    if (!quizScore) return "bg-blue-500";
    const percentage = (quizScore.score / quizScore.total) * 100;
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="mt-12 space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
          <HelpCircle className="h-6 w-6" />
          Knowledge Check Quiz
        </h2>

        {!quizSubmitted && (
          <div className="flex items-center gap-3 text-sm font-medium">
            <span className="text-blue-700">
              {answeredQuestionsCount} of {quiz.length} questions answered
            </span>
            <div className="w-48">
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>
        )}

        {quizSubmitted && quizScore && (
          <div className="flex items-center gap-2">
            <Award className="text-yellow-500 h-5 w-5" />
            <span className="font-medium">
              Score: {quizScore.score}/{quizScore.total}
            </span>
          </div>
        )}
      </div>

      {!quizSubmitted ? (
        <Card className="border-blue-100 shadow-xl overflow-hidden">
          <div className="bg-blue-800 text-white p-3 flex justify-between items-center">
            <h3 className="font-semibold">
              Question {currentQuestionIndex + 1} of {quiz.length}
            </h3>
            <div className="flex gap-1">
              {quiz.map((_, index) => (
                <button
                  key={index}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    index === currentQuestionIndex
                      ? "bg-white text-blue-800"
                      : userAnswers[index.toString()]
                      ? "bg-blue-600 text-white"
                      : "bg-blue-400/50 text-white"
                  }`}
                  onClick={() => setCurrentQuestionIndex(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-medium text-gray-800">
                  {quiz[currentQuestionIndex].question}
                </h3>

                <div className="space-y-3">
                  {quiz[currentQuestionIndex].options.map(
                    (option, optionIndex) => (
                      <div
                        key={`option-${currentQuestionIndex}-${optionIndex}`}
                        className={`flex items-center p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          userAnswers[currentQuestionIndex.toString()] ===
                          option
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                        }`}
                        onClick={() =>
                          onAnswerChange(
                            currentQuestionIndex.toString(),
                            option
                          )
                        }
                      >
                        <div
                          className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                            userAnswers[currentQuestionIndex.toString()] ===
                            option
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {userAnswers[currentQuestionIndex.toString()] ===
                            option && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <span className="text-gray-700">{option}</span>
                      </div>
                    )
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="border-blue-200 text-blue-700"
                  >
                    Previous
                  </Button>

                  {currentQuestionIndex < quiz.length - 1 ? (
                    <Button
                      onClick={handleNextQuestion}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Next <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={onSubmitQuiz}
                      disabled={Object.keys(userAnswers).length < quiz.length}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Submit Quiz
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </Card>
      ) : (
        <Card className="border-blue-100 shadow-xl overflow-hidden">
          <div className="bg-blue-800 text-white p-3 flex justify-between items-center">
            <h3 className="font-semibold">Quiz Results</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={resetQuiz}
              className="bg-transparent border-white text-white hover:bg-blue-700"
            >
              <RotateCcw className="mr-1 h-4 w-4" /> Review Answers
            </Button>
          </div>

          <div className="p-6">
            <div className="mb-8 flex flex-col items-center">
              <div className="relative mb-4">
                <svg className="w-32 h-32">
                  <circle
                    className="text-gray-200"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="58"
                    cx="64"
                    cy="64"
                  />
                  <circle
                    className={getScoreColor()}
                    strokeWidth="8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="58"
                    cx="64"
                    cy="64"
                    strokeDasharray={`${
                      ((quizScore?.score || 0) / (quizScore?.total || 1)) * 365
                    } 365`}
                    strokeDashoffset="0"
                    transform="rotate(-90 64 64)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-800">
                    {quizScore?.score || 0}
                  </span>
                  <span className="text-sm text-gray-600">
                    out of {quizScore?.total || 0}
                  </span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">
                Quiz Completed!
              </h3>
              <p className="text-gray-600 text-center">
                Your answers have been submitted successfully.
              </p>
            </div>

            <div className="space-y-6">
              <h4 className="font-medium text-gray-700 flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                Question Review
              </h4>

              <AnimatePresence>
                <motion.div
                  key={currentQuestionIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                    <h5 className="font-medium mb-2">
                      {quiz[currentQuestionIndex].question}
                    </h5>

                    {quiz[currentQuestionIndex].options.map(
                      (option, optionIndex) => (
                        <div
                          key={`result-${currentQuestionIndex}-${optionIndex}`}
                          className={`flex items-center p-3 mb-2 rounded-md ${
                            option === quiz[currentQuestionIndex].answer
                              ? "bg-green-50 border border-green-200"
                              : userAnswers[currentQuestionIndex.toString()] ===
                                option
                              ? "bg-red-50 border border-red-200"
                              : "bg-white border border-gray-200"
                          }`}
                        >
                          {option === quiz[currentQuestionIndex].answer ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          ) : userAnswers[currentQuestionIndex.toString()] ===
                            option ? (
                            <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                          ) : (
                            <div className="w-5 h-5 mr-2 flex-shrink-0" />
                          )}
                          <span>{option}</span>

                          {option === quiz[currentQuestionIndex].answer && (
                            <span className="ml-auto text-xs font-medium text-green-600">
                              Correct Answer
                            </span>
                          )}

                          {userAnswers[currentQuestionIndex.toString()] ===
                            option &&
                            option !== quiz[currentQuestionIndex].answer && (
                              <span className="ml-auto text-xs font-medium text-red-600">
                                Your Answer
                              </span>
                            )}
                        </div>
                      )
                    )}
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={handlePrevQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="border-blue-200 text-blue-700"
                    >
                      Previous
                    </Button>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                userAnswers[currentQuestionIndex.toString()] ===
                                quiz[currentQuestionIndex].answer
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`}
                            />
                            <span className="text-sm text-gray-600">
                              Question {currentQuestionIndex + 1} of{" "}
                              {quiz.length}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {userAnswers[currentQuestionIndex.toString()] ===
                          quiz[currentQuestionIndex].answer
                            ? "Correct answer!"
                            : "Incorrect answer"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <Button
                      onClick={handleNextQuestion}
                      disabled={currentQuestionIndex === quiz.length - 1}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Next <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
