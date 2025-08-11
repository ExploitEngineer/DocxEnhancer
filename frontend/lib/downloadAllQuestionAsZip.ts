import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  BorderStyle,
  ExternalHyperlink,
} from "docx";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { Question } from "@/types/question";
import type { GptResponse } from "@/types/gpt-response";

export async function downloadAllQuestionsAsZip(
  questions: Question[],
  zipFileName: string,
) {
  const BLACK_COLOR = "000000";
  const BIG_SPACE = 550;
  const SMALL_SPACE = 250;

  const zip = new JSZip();

  for (const [index, q] of questions.entries()) {
    let gpt: GptResponse | null = null;

    try {
      gpt =
        typeof q.gptResponse === "string"
          ? JSON.parse(q.gptResponse)
          : (q.gptResponse ?? null);
    } catch (err) {
      console.warn("Failed to parse gptResponse for download:", err);
      continue;
    }

    if (!gpt?.question) continue;

    const content: Paragraph[] = [];

    // QUESTION (Heading)
    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Question ${index + 1}:`,
            bold: true,
            color: BLACK_COLOR,
          }),
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { after: BIG_SPACE },
      }),
    );

    // Scenario
    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: gpt.question.scenario || "",
            color: BLACK_COLOR,
          }),
        ],
        spacing: { after: BIG_SPACE },
      }),
    );

    // Instruction
    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: gpt.question.instruction || "",
            color: BLACK_COLOR,
          }),
        ],
        spacing: { after: BIG_SPACE },
      }),
    );

    // Horizontal Line
    content.push(
      new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 2, color: BLACK_COLOR },
        },
        spacing: { after: BIG_SPACE },
      }),
    );

    // Options
    content.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Options:", bold: true, color: BLACK_COLOR }),
        ],
        heading: HeadingLevel.HEADING_3,
        spacing: { after: BIG_SPACE },
      }),
    );

    gpt.options.forEach((option: string) => {
      content.push(
        new Paragraph({
          children: [
            new TextRun({
              bold: true,
              color: BLACK_COLOR,
            }),
            new TextRun({ text: option, color: BLACK_COLOR }),
          ],
          spacing: { after: SMALL_SPACE },
        }),
      );
    });

    content.push(
      new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 2, color: BLACK_COLOR },
        },
        spacing: { after: BIG_SPACE },
      }),
    );

    // Answer
    content.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Answer:", bold: true, color: BLACK_COLOR }),
        ],
        heading: HeadingLevel.HEADING_3,
        spacing: { after: BIG_SPACE },
      }),
    );

    content.push(
      new Paragraph({
        children: [new TextRun({ text: gpt.answer || "", color: BLACK_COLOR })],
        spacing: { after: BIG_SPACE },
      }),
    );

    content.push(
      new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 2, color: BLACK_COLOR },
        },
        spacing: { after: BIG_SPACE },
      }),
    );

    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Explanation:",
            bold: true,
            color: BLACK_COLOR,
          }),
        ],
        heading: HeadingLevel.HEADING_3,
        spacing: { after: BIG_SPACE },
      }),
    );

    if (gpt?.explanation) {
      const { quote, paragraph, option_breakdown } = gpt.explanation as any;

      if (quote?.quote && quote?.citation) {
        content.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `"${quote.quote}"`,
                bold: true,
                italics: true,
                color: BLACK_COLOR,
              }),
            ],
            spacing: { after: SMALL_SPACE },
          }),
        );

        content.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `(${quote.citation})`,
                italics: true,
                color: BLACK_COLOR,
              }),
            ],
            spacing: { after: SMALL_SPACE },
          }),
        );
      }

      if (paragraph) {
        content.push(
          new Paragraph({
            children: [new TextRun({ text: paragraph, color: BLACK_COLOR })],
            spacing: { after: SMALL_SPACE },
          }),
        );
      }

      option_breakdown?.forEach((item: any) => {
        content.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: `Option ${item.key} ${item.label ? `(${item.label})` : ""}`,
                color: BLACK_COLOR,
              }),
              new TextRun({
                text: `${item.explanation}`,
                color: BLACK_COLOR,
              }),
            ],
            spacing: { after: SMALL_SPACE },
          }),
        );
      });
    }

    content.push(
      new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 2, color: BLACK_COLOR },
        },
        spacing: { after: BIG_SPACE },
      }),
    );

    if (Array.isArray(gpt.references) && gpt.references.length > 0) {
      content.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "References:",
              bold: true,
              color: BLACK_COLOR,
            }),
          ],
          heading: HeadingLevel.HEADING_3,
          spacing: { after: SMALL_SPACE },
        }),
      );

      gpt.references.forEach((ref: any) => {
        if (
          typeof ref === "object" &&
          ref !== null &&
          "link" in ref &&
          "title" in ref
        ) {
          content.push(
            new Paragraph({
              bullet: { level: 0 },
              children: [
                new ExternalHyperlink({
                  link: ref.link,
                  children: [
                    new TextRun({
                      text: `${ref.title}`,
                      style: "Hyperlink",
                    }),
                  ],
                }),
              ],
              spacing: { after: SMALL_SPACE },
            }),
          );
        } else {
          content.push(
            new Paragraph({
              children: [
                new TextRun({ text: `• ${String(ref)}`, color: BLACK_COLOR }),
              ],
              spacing: { after: SMALL_SPACE },
            }),
          );
        }
      });
    }

    content.push(new Paragraph({ spacing: { after: 600 } }));

    const doc = new Document({ sections: [{ children: content }] });
    const blob = await Packer.toBlob(doc);
    zip.file(`question-${index + 1}.docx`, blob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, zipFileName);
}
