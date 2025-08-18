"use client";

import { Download } from "lucide-react";
import type { Question } from "@/types/question";
import { Button } from "@/components/ui/button";
import { useEffect, useState, use } from "react";
import { downloadDocxFromData } from "@/lib/downloadDocx";
import { downloadAllQuestionsAsZip } from "@/lib/downloadAllQuestionAsZip";
import { ImproveDialog } from "@/components/improve-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GptResponse } from "@/types/gpt-response";

export default function BatchDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = use(paramsPromise).id;
  console.log("Doc ID", id);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [improveDialogOpen, setImproveDialogOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("");
  const [regeneratingIds, setRegeneratingIds] = useState<string[]>([]);
  const [isDocumentComplete, setIsDocumentCompleted] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchQuestions = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_URL}/documents/${id}`,
        );
        const data = await res.json();

        if (!res.ok) throw new Error("Failed to fetch questions");

        if (Array.isArray(data.questions)) {
          setQuestions(data.questions);
          console.log("status", data.status);
          const completed = data.status === "completed";

          console.log("Completed:", completed);

          setIsDocumentCompleted(completed);
          if (completed && interval) {
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error("Error fetching questions:", err);
      }
    };

    fetchQuestions();

    interval = setInterval(fetchQuestions, 5000);

    return () => clearInterval(interval);
  }, [id]);

  const handleImprove = (questionId: string) => {
    setSelectedQuestionId(questionId);
    setImproveDialogOpen(true);
  };

  const handleRegenerateQuestion = async (questionId: string) => {
    setRegeneratingIds((prev) => [...prev, questionId]);

    const updatedGptResponse = await regenerateQuestion(questionId);

    if (updatedGptResponse) {
      setQuestions((prev) =>
        prev.map((q) =>
          q._id === questionId ? { ...q, gptResponse: updatedGptResponse } : q,
        ),
      );
    }

    setRegeneratingIds((prev) => prev.filter((id) => id !== questionId));
  };

  async function regenerateQuestion(questionId: string) {
    try {
      const url = `${process.env.NEXT_PUBLIC_URL}/documents/regenerate-question`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questionId }),
      });

      if (!res.ok) {
        throw new Error(`Response Error, ${res.statusText}`);
      }

      const data = await res.json();
      console.log("Regenerated question:", data);
      return data.gptResponse;
    } catch (err) {
      console.error("Error regenerating question:", err);
      return null;
    }
  }

  const handleImproveSuccess = (
    questionId: string,
    newGptResponse: GptResponse,
  ) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q._id === questionId ? { ...q, gptResponse: newGptResponse } : q,
      ),
    );
    setImproveDialogOpen(false);
  };

  const handleDownloadAll = async () => {
    await downloadAllQuestionsAsZip(questions, id);
  };

  const handleDownloadQuestion = (questionId: string) => {
    const q = questions.find((q) => q._id === questionId);
    if (q) downloadDocxFromData([q], `question-${questionId}.docx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Processed Questions</h1>
          <p className="text-gray-600">Batch ID: {String(id)}</p>
        </div>
        <Button onClick={handleDownloadAll}>
          <Download className="mr-2 h-4 w-4" />
          Download All
        </Button>
      </div>

      <div className="grid gap-6">
        {questions.map((question, index) => {
          let gptData: GptResponse | null = null;

          try {
            gptData =
              typeof question.gptResponse === "string"
                ? JSON.parse(question.gptResponse)
                : question.gptResponse;
          } catch (err) {
            console.warn("Failed to parse gptResponse:", err);
          }

          const correctLetters = gptData?.answer?.trim().toUpperCase() || "";

          return (
            <Card key={question._id}>
              <CardHeader>
                <CardTitle className="text-lg">Question {index + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!gptData?.question ||
                regeneratingIds.includes(question._id) ? (
                  <p className="italic text-muted-foreground">
                    ⏳ Processing with GPT...
                  </p>
                ) : (
                  <>
                    <div className="space-y-3">
                      <p className="whitespace-pre-line font-medium">
                        {gptData.question.scenario}
                      </p>
                      <p className="whitespace-pre-line font-medium">
                        {gptData.question.instruction}
                      </p>
                    </div>

                    {Array.isArray(gptData.options) &&
                      gptData.options.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">Options:</p>
                          {gptData.options.map((choice, choiceIndex) => {
                            return (
                              <div
                                key={choiceIndex}
                                className="rounded-lg border bg-gray-50 p-3"
                              >
                                <div className="flex items-center gap-2">
                                  <span>{choice}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                    {correctLetters && (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                        <p className="mb-1 text-sm font-semibold text-green-900">
                          Correct Answer:
                        </p>
                        <p className="text-sm text-green-800">
                          {correctLetters}
                        </p>
                      </div>
                    )}

                    {gptData.explanation && (
                      <div className="rounded-lg bg-blue-50 p-3">
                        <div className="mb-8 space-y-3">
                          <p className="mb-1 text-sm font-semibold text-blue-900">
                            Explanation:
                          </p>
                          <p className="mb-1 text-sm font-semibold text-blue-900">
                            {gptData.explanation.quote.quote}
                          </p>
                          <p className="mb-1 text-sm font-semibold text-blue-900">
                            {gptData.explanation.quote.citation}
                          </p>
                          <p className="whitespace-pre-line text-sm text-blue-800">
                            {gptData.explanation.paragraph}
                          </p>
                        </div>
                        {gptData.explanation.option_breakdown &&
                          gptData.explanation.option_breakdown.length > 0 && (
                            <ul className="mt-2 list-inside list-disc space-y-2 text-sm text-blue-800">
                              {gptData.explanation.option_breakdown.map(
                                (breakdown, idx: number) => (
                                  <li key={idx}>
                                    <span className="mr-2 font-semibold">
                                      Option {breakdown.key} {breakdown.label}:
                                    </span>
                                    {breakdown.explanation}
                                  </li>
                                ),
                              )}
                            </ul>
                          )}
                      </div>
                    )}

                    {Array.isArray(gptData.references) &&
                      gptData.references.length > 0 &&
                      gptData.references.some((r) => !!r && r !== "None") && (
                        <div className="rounded-lg bg-yellow-50 p-3">
                          <p className="mb-1 text-sm font-semibold text-yellow-900">
                            References:
                          </p>
                          <ul className="list-inside list-disc text-sm text-yellow-800">
                            {gptData.references.map((ref, idx) => {
                              if (!ref || ref === "None") return null;

                              if (
                                typeof ref === "object" &&
                                ref !== null &&
                                "link" in ref &&
                                "title" in ref
                              ) {
                                const typedRef = ref as {
                                  title: string;
                                  link: string;
                                };
                                return (
                                  <li key={idx}>
                                    <a
                                      href={typedRef.link || "#"}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline"
                                    >
                                      {typedRef.title}
                                    </a>
                                  </li>
                                );
                              }

                              // fallback if ref is plain string
                              return (
                                <li key={idx}>
                                  <a
                                    href={ref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline"
                                  >
                                    {ref}
                                  </a>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                  </>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => handleImprove(question._id)}
                  >
                    Improve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadQuestion(question._id)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>

                  {(() => {
                    console.log("Complete Status", isDocumentComplete);
                    return true;
                  })() &&
                    isDocumentComplete && (
                      <Button
                        variant="outline"
                        onClick={() => handleRegenerateQuestion(question._id)}
                      >
                        {regeneratingIds.includes(question._id)
                          ? "Regenerating..."
                          : "Regenerate"}
                      </Button>
                    )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ImproveDialog
        open={improveDialogOpen}
        onOpenChange={setImproveDialogOpen}
        questionId={selectedQuestionId}
        onImproveSuccess={handleImproveSuccess}
      />
    </div>
  );
}
