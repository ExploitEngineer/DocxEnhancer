import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  BorderStyle,
  ExternalHyperlink,
} from "docx";
import { saveAs } from "file-saver";
import { Question } from "@/types/question";
import { GptResponse } from "@/types/gpt-response";

export async function downloadDocxFromData(
  questions: Question[],
  fileName: string,
): Promise<void> {
  const BLACK_COLOR = "000000";
  const BIG_SPACE = 550;
  const SMALL_SPACE = 250;

  const doc = new Document({
    sections: [
      {
        children: questions.flatMap((q) => {
          const content: Paragraph[] = [];
          let gpt: GptResponse;
          try {
            gpt =
              typeof q.gptResponse === "string"
                ? JSON.parse(q.gptResponse)
                : q.gptResponse!;
          } catch (error) {
            console.error("Invalid GPT response", error);
            return [];
          }

          content.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "Question:",
                  bold: true,
                  color: BLACK_COLOR,
                }),
              ],
              heading: HeadingLevel.HEADING_2,
              spacing: { after: BIG_SPACE },
            }),
          );

          content.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: gpt?.question?.scenario || "",
                  color: BLACK_COLOR,
                }),
              ],
              spacing: { after: BIG_SPACE },
            }),
          );

          content.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: gpt?.question?.instruction || "",
                  color: BLACK_COLOR,
                }),
              ],
              spacing: { after: BIG_SPACE },
            }),
          );

          content.push(
            new Paragraph({
              border: {
                bottom: { style: BorderStyle.SINGLE, size: 2, color: "ffffff" },
              },
              spacing: { after: BIG_SPACE },
            }),
          );

          content.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "Options:",
                  bold: true,
                  color: BLACK_COLOR,
                }),
              ],
              heading: HeadingLevel.HEADING_3,
              spacing: { after: BIG_SPACE },
            }),
          );

          gpt?.options?.forEach((option: string) => {
            content.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${option}`,
                    color: BLACK_COLOR,
                  }),
                ],
                spacing: { after: SMALL_SPACE },
              }),
            );
          });

          content.push(
            new Paragraph({
              border: {
                bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
              },
              spacing: { after: BIG_SPACE },
            }),
          );

          content.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "Answer:",
                  bold: true,
                  color: BLACK_COLOR,
                }),
              ],
              heading: HeadingLevel.HEADING_3,
              spacing: { after: BIG_SPACE },
            }),
          );

          content.push(
            new Paragraph({
              children: [
                new TextRun({ text: gpt?.answer || "", color: BLACK_COLOR }),
              ],
              spacing: { after: BIG_SPACE },
            }),
          );

          content.push(
            new Paragraph({
              border: {
                bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
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
            const { quote, paragraph, option_breakdown } =
              gpt.explanation as any;

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
                  children: [
                    new TextRun({ text: paragraph, color: BLACK_COLOR }),
                  ],
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
                bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
              },
              spacing: { after: BIG_SPACE },
            }),
          );

          if (Array.isArray(gpt?.references) && gpt.references.length > 0) {
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
                      new TextRun({
                        text: `• ${String(ref)}`,
                        color: BLACK_COLOR,
                      }),
                    ],
                    spacing: { after: SMALL_SPACE },
                  }),
                );
              }
            });
          }

          content.push(new Paragraph({ spacing: { after: 600 } }));

          return content;
        }),
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, fileName);
}
