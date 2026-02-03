import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Hash, Users, Megaphone, UserCheck, Menu, X, Circle } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { trpc } from "@/lib/trpc";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

interface Message {
  id?: number;
  room?: string;
  userId: number;
  userName: string;
  message: string;
  createdAt: Date | string;
}

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unreadCount: number;
}

const CHAT_ROOMS: Omit<ChatRoom, 'unreadCount'>[] = [
  { id: "general", name: "General", description: "Open discussion for all members", icon: <Hash className="h-4 w-4" /> },
  { id: "announcements", name: "Announcements", description: "Important updates from coaches", icon: <Megaphone className="h-4 w-4" /> },
  { id: "parents", name: "Parents", description: "Parent-only discussions", icon: <Users className="h-4 w-4" /> },
  { id: "coaches", name: "Coaches", description: "Coach coordination channel", icon: <UserCheck className="h-4 w-4" /> },
];

export default function Chat() {
  const { user, isAuthenticated, loading, authConfigured } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const chatEnabled = import.meta.env.VITE_ENABLE_SOCKET_IO !== "false";
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Array<{ userId: number; userName: string }>>([]);
  const [currentRoom, setCurrentRoom] = useState("general");
  const [rooms, setRooms] = useState<ChatRoom[]>(
    CHAT_ROOMS.map(r => ({ ...r, unreadCount: 0 }))
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatTokenQuery = trpc.auth.chatToken.useQuery(undefined, {
    enabled: Boolean(user),
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      toast.error("Please sign in to access chat");
    }
  }, [isAuthenticated, loading]);

  useEffect(() => {
    if (chatTokenQuery.error) {
      logger.error("[Chat] Failed to load chat token", chatTokenQuery.error);
      toast.error("Unable to authenticate chat session. Please refresh and try again.");
    }
  }, [chatTokenQuery.error]);

  // Setup Socket.IO connection
  useEffect(() => {
    if (!chatEnabled || !user || !chatTokenQuery.data?.token) return;

    const socketUrl = window.location.origin;
    const newSocket = io(socketUrl, {
      path: "/socket.io/",
      auth: {
        token: chatTokenQuery.data.token,
      },
    });

    newSocket.on("connect", () => {
      logger.info("Connected to chat server");
      setIsConnected(true);
      toast.success("Connected to chat");
      // Join all rooms to receive notifications
      CHAT_ROOMS.forEach(room => {
        newSocket.emit("join_room", { room: room.id });
      });
    });

    newSocket.on("connect_error", (error) => {
      logger.error("Chat connection error:", error);
      toast.error("Failed to connect to chat. Please refresh the page.");
    });

    newSocket.on("disconnect", (reason) => {
      logger.warn("Disconnected from chat:", reason);
      setIsConnected(false);
      if (reason === "io server disconnect") {
        // Server disconnected, try to reconnect
        newSocket.connect();
      }
    });

    newSocket.on("message_history", (history: Message[]) => {
      setMessages(history);
    });

    newSocket.on("receive_message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
      
      // If message is from a different room, increment unread count
      if (message.room && message.room !== currentRoom && message.userId !== user.id) {
        setRooms(prev => prev.map(r => 
          r.id === message.room 
            ? { ...r, unreadCount: r.unreadCount + 1 }
            : r
        ));
        // Show notification toast for messages in other rooms
        toast.info(`New message in #${message.room} from ${message.userName}`);
      }
    });

    newSocket.on("user_joined", ({ userName, room }: { userName: string; room?: string }) => {
      if (!room || room === currentRoom) {
        toast.info(`${userName} joined the chat`);
      }
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
  }, [chatEnabled, user, chatTokenQuery.data?.token]);

  // Request room history when switching rooms
  useEffect(() => {
    if (socket && currentRoom) {
      socket.emit("get_room_history", { room: currentRoom });
      // Clear unread count for current room
      setRooms(prev => prev.map(r => 
        r.id === currentRoom ? { ...r, unreadCount: 0 } : r
      ));
    }
  }, [socket, currentRoom]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!socket || !user || !newMessage.trim()) {
      if (!socket) {
        toast.error("Not connected to chat. Please wait or refresh the page.");
      }
      return;
    }

    if (!socket.connected) {
      toast.error("Connection lost. Reconnecting...");
      socket.connect();
      return;
    }

    socket.emit("send_message", {
      room: currentRoom,
      message: newMessage.trim(),
    });

    setNewMessage("");
    
    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit("stop_typing", {
      room: currentRoom,
    });
  };

  const handleTyping = () => {
    if (!socket || !user) return;

    socket.emit("typing", {
      room: currentRoom,
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", {
        room: currentRoom,
      });
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const switchRoom = (roomId: string) => {
    setCurrentRoom(roomId);
    setMessages([]); // Clear messages while loading new room
    setMobileMenuOpen(false);
  };

  const currentRoomData = rooms.find(r => r.id === currentRoom);
  const totalUnread = rooms.reduce((sum, r) => sum + r.unreadCount, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="flex-1 flex items-center justify-center text-muted-foreground">
          Loading chat...
        </main>
        <Footer />
      </div>
    );
  }

  if (!authConfigured) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center max-w-md px-6">
            <h1 className="text-2xl font-bold mb-3 text-foreground">Authentication Not Configured</h1>
            <p className="text-muted-foreground">
              Please set VITE_CLERK_PUBLISHABLE_KEY or OAuth credentials to access the member chat.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!chatEnabled) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center max-w-md px-6">
            <h1 className="text-2xl font-bold mb-3 text-foreground">Chat Temporarily Unavailable</h1>
            <p className="text-muted-foreground">
              Realtime chat is disabled in this environment. Please check back soon.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="flex-1 flex items-center justify-center text-muted-foreground">
          Redirecting to sign in...
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main id="main-content" className="flex-1 p-2 md:p-4">
        <div className="container max-w-6xl mx-auto h-[calc(100vh-10rem)]">
          <div className="flex h-full gap-4">
            {/* Sidebar - Desktop */}
            <div className={`hidden md:flex flex-col w-64 bg-card rounded-lg border ${sidebarOpen ? '' : 'hidden'}`}>
              <div className="p-4 border-b">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <Hash className="h-5 w-5 text-primary" />
                  Channels
                </h2>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => switchRoom(room.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                        currentRoom === room.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <span className={currentRoom === room.id ? "text-primary-foreground" : "text-muted-foreground"}>
                        {room.icon}
                      </span>
                      <span className="flex-1 font-medium">{room.name}</span>
                      {room.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {room.unreadCount}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
              
              {/* Online Users */}
              <div className="p-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                  Online ({onlineUsers.length})
                </h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {onlineUsers.slice(0, 10).map((u) => (
                    <div key={u.userId} className="text-sm text-muted-foreground truncate">
                      {u.userName}
                    </div>
                  ))}
                  {onlineUsers.length > 10 && (
                    <div className="text-xs text-muted-foreground">
                      +{onlineUsers.length - 10} more
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
              <div className="fixed inset-0 z-50 md:hidden">
                <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
                <div className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r shadow-lg">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                      <Hash className="h-5 w-5 text-primary" />
                      Channels
                    </h2>
                    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <ScrollArea className="h-[calc(100%-5rem)]">
                    <div className="p-2 space-y-1">
                      {rooms.map((room) => (
                        <button
                          key={room.id}
                          onClick={() => switchRoom(room.id)}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-left transition-colors ${
                            currentRoom === room.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          <span className={currentRoom === room.id ? "text-primary-foreground" : "text-muted-foreground"}>
                            {room.icon}
                          </span>
                          <div className="flex-1">
                            <span className="font-medium block">{room.name}</span>
                            <span className="text-xs opacity-70">{room.description}</span>
                          </div>
                          {room.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {room.unreadCount}
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}

            {/* Main Chat Area */}
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  {/* Mobile menu button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setMobileMenuOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                    {totalUnread > 0 && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {totalUnread}
                      </span>
                    )}
                  </Button>
                  
                  <div className="flex-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      {currentRoomData?.icon}
                      #{currentRoomData?.name || currentRoom}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {currentRoomData?.description}
                    </p>
                  </div>
                  
                  <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                    <Circle className={`h-2 w-2 ${isConnected ? 'fill-green-500 text-green-500' : 'fill-yellow-500 text-yellow-500'}`} />
                    {isConnected ? `${onlineUsers.length} online` : 'Connecting...'}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col min-h-0">
                {/* Messages Area */}
                <ScrollArea className="flex-1 pr-4 mb-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-12">
                        <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Welcome to #{currentRoomData?.name}</p>
                        <p className="text-sm">{currentRoomData?.description}</p>
                        <p className="text-sm mt-2">Be the first to send a message!</p>
                      </div>
                    ) : (
                      messages.map((msg, index) => {
                        const isOwnMessage = msg.userId === user.id;
                        const showAvatar = index === 0 || messages[index - 1]?.userId !== msg.userId;
                        
                        return (
                          <div
                            key={index}
                            className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] md:max-w-[70%] rounded-lg p-3 ${
                                isOwnMessage
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              {!isOwnMessage && showAvatar && (
                                <p className="text-xs font-semibold mb-1">{msg.userName}</p>
                              )}
                              <p className="text-sm break-words whitespace-pre-wrap">{msg.message}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>

                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                  <div className="text-sm text-muted-foreground mb-2 px-2 flex items-center gap-2">
                    <span className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
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
                    placeholder={`Message #${currentRoomData?.name || currentRoom}...`}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} size="icon" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
