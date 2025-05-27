"use client";

import React, { useState, useEffect } from 'react';



interface QuizProps {
  unitTitle: string;
  apiUrl: string;
  onComplete: (passed: boolean, score: number) => void;
  passingScore: number;
}

type Quiz = {
  question: string;
  options: string[];
  answer: string;
  _id: string;
};

type Subject = {
  name: string;
  quiz?: Quiz[];
};

type Course = {
  year: string;
  branch: string;
  subjects: Subject[];
};

type CourseData = {
  courses: Course[];
};

function getQuizBySubject(data: CourseData, subjectName: string): Quiz[] | undefined {
  for (const course of data.courses) {
      for (const subject of course.subjects) {
          if (subject.name === subjectName) {
              return subject.quiz; // Return quiz if found
          }
      }
  }
  return []; // Return undefined if subject not found
}

const Quiz: React.FC<QuizProps> = ({ unitTitle, apiUrl, onComplete, passingScore = 70 }) => {
  const [questions, setQuestions] = useState<Quiz[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  const fetchQuestions = async () => {
    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        
      });
      
      if (!response.ok) throw new Error("Failed to fetch questions");
      
      const data: CourseData = await response.json();
      // console.log(data);
      
      var quizQuestions: Quiz[] | undefined = getQuizBySubject(data, "OS");

      if (quizQuestions) {
        setQuestions(quizQuestions.slice(0, 5));
        console.log(quizQuestions.length);
        setSelectedAnswers(Array(quizQuestions.length).fill(-1));
      } else {
        setError("No quiz found for the subject.");
        setLoading(false);
      }
      setLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  fetchQuestions();
}, [apiUrl]);

  const handleAnswerSelect = (option: string) => {
    const newSelectedAnswers = [...selectedAnswers];
    newSelectedAnswers[currentQuestion] = option;
    setSelectedAnswers(newSelectedAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = () => {
    if (questions.length === 0) return 0;
    
    let correctCount = 0;
    questions.forEach((question, index) => {
      if (index < selectedAnswers.length && question.answer && selectedAnswers[index] === question.answer) {
        correctCount++;
      }
    });
    console.log(correctCount);
    return (correctCount / questions.length) * 100;
  };

  // const handleSubmit = async () => {
  //   setIsSubmitting(true);
  //   const score = calculateScore();
  //   const passed = score >= passingScore;

  //   try {
  //     await fetch(`${apiUrl}/submit`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ score, passed, answers: selectedAnswers })
  //     });
  //     setShowResults(true);
  //     onComplete(passed, score);
  //   } catch (err) {
  //     setError("Failed to submit quiz results");
  //   }
  //   setIsSubmitting(false);
  // };
    const handleSubmit = () => {
    setIsSubmitting(true);
    // Simulate API call with timeout
    setTimeout(() => {
      setShowResults(true);
      const score = calculateScore();
      const passed = score >= passingScore;
      onComplete(passed, score);
      setIsSubmitting(false);
    }, 1000);
  };


  if (loading) return <p>Loading quiz...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      {questions.length === 0 ? (
        <div className="text-center">
          <h2 className="text-xl font-bold">Loading Quiz...</h2>
        </div>
      ) : showResults ? (
        <div className="text-center">
          <h2 className="text-2xl font-bold">Quiz Results</h2>
          <p>Your score: {calculateScore().toFixed(0)}%</p>
          <button onClick={() => window.location.reload()} className="bg-blue-600 text-white p-2 rounded">Retry Quiz</button>
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-center mb-6">Unit Quiz: {unitTitle}</h2>
          <div className="mb-6 p-4 border rounded">
            <p className="font-semibold">{currentQuestion + 1}. {questions[currentQuestion]?.question}</p>
            <div className="mt-4 space-y-3">
              {questions[currentQuestion]?.options.map((option, index) => (
                <div 
                  key={index} 
                  onClick={() => handleAnswerSelect(option)} 
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    selectedAnswers[currentQuestion] === option 
                      ? 'bg-blue-100 border-blue-500' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                      selectedAnswers[currentQuestion] === option 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {selectedAnswers[currentQuestion] === option && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <span>{option}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between mt-4">
            <button 
              onClick={handlePrevious} 
              disabled={currentQuestion === 0} 
              className={`p-2 rounded ${currentQuestion === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white'}`}
            >
              Previous
            </button>
            
            {currentQuestion < questions.length - 1 ? (
              <button onClick={handleNext} className="bg-blue-600 text-white p-2 rounded">Next</button>
            ) : (
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className={`p-2 rounded ${isSubmitting ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 text-white'}`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Quiz;
