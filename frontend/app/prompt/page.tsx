"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

const defaultPrompt = `You are an expert question generator. Based on the provided document content, create multiple-choice questions that:

1. Test comprehension of key concepts
2. Include 4 answer choices (A, B, C, D)
3. Have only one correct answer
4. Include a clear explanation for the correct answer
5. Are appropriate for the document's subject matter and complexity level

Format each question as:
Question: [Your question here]
A) [Choice A]
B) [Choice B]
C) [Choice C]
D) [Choice D]
Correct Answer: [Letter]
Explanation: [Detailed explanation]

Generate 5-10 questions per document depending on content length and complexity.`

export default function PromptPage() {
  const [prompt, setPrompt] = useState(defaultPrompt)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  const handleUpdatePrompt = async () => {
    setIsUpdating(true)
    setUpdateSuccess(false)

    // Simulate API call to update prompt
    setTimeout(() => {
      setIsUpdating(false)
      setUpdateSuccess(true)

      // Hide success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false)
      }, 3000)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">GPT Prompt Settings</h1>
        <p className="text-gray-600">Configure the prompt template used for question generation</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prompt Template</CardTitle>
          <CardDescription>
            This prompt will be used by GPT to generate questions from uploaded documents. Modify it to customize the
            question generation behavior.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="prompt">Prompt Template</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isUpdating}
              rows={15}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={handleUpdatePrompt} disabled={isUpdating || !prompt.trim()}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Prompt
            </Button>

            {updateSuccess && <p className="text-sm text-green-600 font-medium">Prompt updated successfully!</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tips for Effective Prompts</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Be specific about the question format and structure</li>
            <li>• Include clear instructions for answer choices</li>
            <li>• Specify the number of questions to generate</li>
            <li>• Request explanations for correct answers</li>
            <li>• Consider the target audience and difficulty level</li>
            <li>• Use examples when possible to guide the AI</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
