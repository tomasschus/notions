"use client";

import { useParams } from "next/navigation";
import { Editor } from "@/components/Editor";

export default function NotePage() {
  const params = useParams();
  const noteId = params.id as string;

  return <Editor noteId={noteId} />;
}
