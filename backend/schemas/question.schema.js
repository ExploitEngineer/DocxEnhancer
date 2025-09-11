import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswerRaw: { type: String },
  explanation: { type: String },
  references: { type: [String] },
  threadId: { type: String },
  gptResponse: {
    type: {
      question: {
        scenario: String,
        instruction: String,
      },
      options: [String],
      answer: String,
      explanation: {
        paragraph: String,
        option_breakdown: [
          {
            key: String,
            label: String,
            explanation: String,
          },
        ],
      },
      references: [
        {
          title: String,
          link: String,
        },
      ],
    },
    default: null,
  },
});

export { questionSchema };
