import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Users } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface Message {
  id?: number;
  userId: number;
  userName: string;
  message: string;
  createdAt: Date | string;
}

export default function Chat() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Array<{ userId: number; userName: string }>>([]);
  const [currentRoom] = useState("general");
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
      toast.error("Please log in to access chat");
    }
  }, [isAuthenticated, setLocation]);

  // Setup Socket.IO connection
  useEffect(() => {
    if (!user) return;

    const socketUrl = window.location.origin;
    const newSocket = io(socketUrl, {
      path: "/socket.io/",
    });

    newSocket.on("connect", () => {
      if (process.env.NODE_ENV === "development") {
        console.log("Connected to chat server");
      }
      newSocket.emit("join_room", {
        room: currentRoom,
        userId: user.id,
        userName: user.name || "Member",
      });
    });

    newSocket.on("message_history", (history: Message[]) => {
      setMessages(history);
    });

    newSocket.on("receive_message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on("user_joined", ({ userName }: { userName: string }) => {
      toast.info(`${userName} joined the chat`);
    });

    newSocket.on("user_typing", ({ userName }: { userName: string }) => {
      setTypingUsers((prev) => {
        if (prev.includes(userName)) return prev;
        return [...prev, userName];
      });
    });

    newSocket.on("user_stop_typing", ({ userName }: { userName: string }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== userName));
    });

    newSocket.on("online_users", (users: Array<{ userId: number; userName: string }>) => {
      setOnlineUsers(users);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user, currentRoom]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!socket || !user || !newMessage.trim()) return;

    socket.emit("send_message", {
      room: currentRoom,
      userId: user.id,
      userName: user.name || "Member",
      message: newMessage.trim(),
    });

    setNewMessage("");
    
    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit("stop_typing", {
      room: currentRoom,
      userName: user.name || "Member",
    });
  };

  const handleTyping = () => {
    if (!socket || !user) return;

    socket.emit("typing", {
      room: currentRoom,
      userName: user.name || "Member",
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", {
        room: currentRoom,
        userName: user.name || "Member",
      });
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container max-w-4xl mx-auto">
        <Card className="h-[calc(100vh-2rem)]">
          <CardHeader>
            <CardTitle className="text-2xl">Member Chat - General</CardTitle>
            <p className="text-sm text-muted-foreground">
              Connect with other Academy members and coaches
            </p>
          </CardHeader>
          <CardContent className="flex flex-col h-[calc(100%-6rem)]">
            {/* Messages Area */}
            <ScrollArea className="flex-1 pr-4 mb-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((msg, index) => {
                  const isOwnMessage = msg.userId === user.id;
                  return (
                    <div
                      key={index}
                      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isOwnMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {!isOwnMessage && (
                          <p className="text-xs font-semibold mb-1">{msg.userName}</p>
                        )}
                        <p className="text-sm break-words">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </ScrollArea>

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="text-sm text-muted-foreground mb-2 px-2">
                {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
              </div>
            )}

            {/* Input Area */}
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button onClick={handleSendMessage} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
