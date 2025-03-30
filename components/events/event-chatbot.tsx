"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot } from "lucide-react";
import { toast } from "sonner";

import type { Event } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";

interface EventChatbotProps {
  eventId: string;
  event: Event;
}

interface ChatMessage {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

export function EventChatbot({ eventId, event }: EventChatbotProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add initial bot message
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        content: `Hi there! I'm the virtual assistant for ${event.title}. Ask me anything about this event!`,
        isBot: true,
        timestamp: new Date(),
      },
    ]);
  }, [event.title]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    if (!user) {
      toast.error("Please log in to use the chatbot");
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: input,
      isBot: false,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Send message to API
      const response = await fetch("/api/chat?userId=" + user.uid, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          message: input,
          userName: user.displayName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Add bot response
      const botMessage: ChatMessage = {
        id: Date.now().toString() + "-bot",
        content: data.response,
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to get a response. Please try again.");

      // Add error message
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + "-error",
        content: "Sorry, I couldn't process your request. Please try again.",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Bot className="h-5 w-5 text-primary" />
        <h3 className="font-medium">Event Assistant</h3>
      </div>

      <div className="bg-muted/50 rounded-lg p-3 h-[200px] overflow-y-auto mb-3">
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.isBot ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  message.isBot
                    ? "bg-muted"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-lg px-3 py-2 bg-muted">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"></div>
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce delay-75"></div>
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce delay-150"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Ask about this event..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || !user}
        />
        <Button
          size="icon"
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim() || !user}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {!user && (
        <p className="text-xs text-muted-foreground mt-2">
          Please log in to use the chatbot
        </p>
      )}
    </div>
  );
}
