
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot } from "lucide-react";

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content }) => {
  const isBot = role === 'assistant';
  
  return (
    <div className={`flex gap-3 ${isBot ? '' : 'flex-row-reverse'}`}>
      {isBot ? (
        <Avatar className="h-8 w-8">
          <AvatarFallback>AI</AvatarFallback>
          <Bot className="h-5 w-5 text-primary" />
        </Avatar>
      ) : (
        <Avatar className="h-8 w-8">
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      )}
      <div className={`rounded-lg px-4 py-2 max-w-[80%] ${
        isBot ? 'bg-secondary' : 'bg-primary text-primary-foreground'
      }`}>
        <p className="text-sm">{content}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
