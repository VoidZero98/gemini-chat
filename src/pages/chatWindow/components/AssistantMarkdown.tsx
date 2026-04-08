import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./AssistantMarkdown.css";

type Props = {
  content: string;
};

export const AssistantMarkdown = ({ content }: Props) => (
  <div className="assistant-md">
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
  </div>
);
