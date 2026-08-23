"use client";
import { useSidebar } from "@/lib/SidebarContext";
import { Editor } from "@tinymce/tinymce-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
}

const RichTextEditor = ({ value, onChange, placeholder, height = 400 }: RichTextEditorProps) => {
  const { isDarkMode } = useSidebar();

  return (
    <Editor
      apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
      value={value}
      onEditorChange={(content) => onChange(content)}
      init={{
        height,
        menubar: false,
        placeholder,
        plugins: [
          "advlist", "autolink", "lists", "link", "image", "charmap",
          "searchreplace", "visualblocks", "code", "fullscreen",
          "insertdatetime", "media", "table", "wordcount",
        ],
        toolbar:
          "undo redo | blocks | bold italic underline | " +
          "alignleft aligncenter alignright | bullist numlist outdent indent | " +
          "link image | removeformat | code fullscreen",
        content_style: "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px }",
        skin: isDarkMode ? "oxide-dark" : "oxide",
        content_css: isDarkMode ? "dark" : "default",
      }}
    />
  );
};

export default RichTextEditor;
