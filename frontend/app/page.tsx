"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import { Download, Eye, RefreshCcw } from "lucide-react";
import { UploadDialog } from "@/components/upload-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DocumentItem {
  _id: string;
  filename: string;
  status: "pending" | "processing" | "completed" | "failed";
  date: string;
}

const getStatusBadge = (status: DocumentItem["status"]) => {
  const colors = {
    pending: "bg-gray-100 text-gray-800 cursor-wait",
    processing:
      "bg-blue-100 text-blue-800 duration-300 transition-all hover:bg-blue-600 cursor-pointer hover:text-white animate-pulse",
    completed:
      "bg-green-100 text-green-800 duration-300 transition-all hover:bg-green-600 cursor-pointer hover:text-white",
    failed:
      "bg-red-100 text-red-800 duration-300 transition-all hover:bg-red-600 hover:text-white cursor-pointer",
  };

  return (
    <Badge className={colors[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const defaultPrompt: string = `You are an expert question generator. Based on the provided document content, create multiple-choice questions that:

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
references: []`;

export default function DocumentPage() {
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  const iconRef = useRef<SVGSVGElement | null>(null);

  // Get All Documents
  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/documents`);

      if (!res.ok) {
        throw new Error(`HTTP Response error ${res.statusText}`);
      }

      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error("Error fetching documents", err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const getLatestPrompt = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/prompt`);
      if (!res.ok) throw new Error("No prompt found");

      const data = await res.json();
      return data.content || defaultPrompt;
    } catch (error) {
      console.warn("Falling back to default prompt:", error);
      return defaultPrompt;
    }
  };

  // Post Documents
  const handleUploadSuccess = async (file: File) => {
    try {
      const prompt = await getLatestPrompt();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("prompt", prompt);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_URL}/documents/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("Upload failed with status:", res.status);
        console.error("Error response:", errData);
        throw new Error("Upload failed");
      }

      fetchDocuments();
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handlePageReload = () => {
    if (iconRef.current) {
      iconRef.current.classList.add("animate-spin");
    }
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  const handleDownload = async (docId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_URL}/documents/${docId}`,
      );
      if (!res.ok) throw new Error("Failed to fetch questions");

      const fullDoc = await res.json();

      const ready = fullDoc.questions.every(
        (q: any) =>
          q.gptResponse &&
          typeof q.gptResponse === "object" &&
          "question" in q.gptResponse,
      );

      if (!ready) {
        alert(
          "This document is still processing. Please wait until it's complete.",
        );
        return;
      }

      const { downloadDocxFromData } = await import("@/lib/downloadDocx");
      downloadDocxFromData(fullDoc.questions, `batch-${docId}.docx`);
    } catch (err) {
      console.error(`Failed to download document ${docId}:`, err);
      alert("An error occurred while downloading the document.");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>
            Upload a .xlsx file to process and generate questions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setIsUploadOpen(true)}>Upload Document</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex w-full items-center justify-between">
            Uploaded Documents
            <RefreshCcw
              ref={iconRef}
              size={18}
              className="cursor-pointer"
              onClick={handlePageReload}
            />
          </CardTitle>
          <CardDescription>
            Manage and view your processed documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Filename</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="relative">
              {documents.map((doc) => (
                <TableRow key={doc._id}>
                  <TableCell className="font-medium">{doc.filename}</TableCell>
                  <TableCell>{getStatusBadge(doc.status)}</TableCell>
                  <TableCell>{doc.date}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/documents/${doc._id}`}>
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc._id)}
                      >
                        <Download className="mr-1 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UploadDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
