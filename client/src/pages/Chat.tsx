import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Hash, Users, Megaphone, UserCheck, Menu, X, Circle, Image as ImageIcon, AtSign, Bell } from "lucide-react";
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
  imageUrl?: string;
  mentions?: number[];
  createdAt: Date | string;
}

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unreadCount: number;
}

interface OnlineUser {
  id: number;
  name: string;
}

const CHAT_ROOMS: Omit<ChatRoom, 'unreadCount'>[] = [
  { id: "general", name: "General", description: "Open discussion for all members", icon: <Hash className="h-4 w-4" /> },
  { id: "announcements", name: "Announcements", description: "Important updates from coaches", icon: <Megaphone className="h-4 w-4" /> },
  { id: "parents", name: "Parents", description: "Parent-only discussions", icon: <Users className="h-4 w-4" /> },
  { id: "coaches", name: "Coaches", description: "Coach coordination channel", icon: <UserCheck className="h-4 w-4" /> },
];

const POLL_INTERVAL = 3000;

export default function Chat() {
  const { user, isAuthenticated, loading, authConfigured } = useAuth({
    redirectOnUnauthenticated: true,
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentRoom, setCurrentRoom] = useState("general");
  const [rooms, setRooms] = useState<ChatRoom[]>(
    CHAT_ROOMS.map(r => ({ ...r, unreadCount: 0 }))
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [allUsers, setAllUsers] = useState<OnlineUser[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem("dismissed-announcements");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMessageIdRef = useRef<number | undefined>(undefined);

  const chatTokenQuery = trpc.auth.chatToken.useQuery(undefined, {
    enabled: Boolean(user),
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Fetch announcements for banner
  const { data: announcements } = trpc.announcements.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const visibleAnnouncements = announcements?.filter(
    (a: any) => !dismissedAnnouncements.has(a.id)
  );

  const dismissAnnouncement = (id: number) => {
    setDismissedAnnouncements(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem("dismissed-announcements", JSON.stringify([...next]));
      return next;
    });
  };

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

  // Fetch all users for @mentions
  useEffect(() => {
    if (chatTokenQuery.data?.token) {
      fetch("/api/chat/users")
        .then(res => res.json())
        .then(users => setAllUsers(users))
        .catch(err => logger.error("[Chat] Failed to fetch users:", err));
    }
  }, [chatTokenQuery.data?.token]);

  // Fetch message history for a room
  const fetchMessageHistory = useCallback(async (room: string) => {
    try {
      const response = await fetch(`/api/chat/history/${room}?limit=50`);
      if (response.ok) {
        const history = await response.json() as Message[];
        setMessages(prev => {
          // Compare last message ID to detect new messages
          const newLastId = history.length > 0 ? history[history.length - 1].id : undefined;
          const prevLastId = lastMessageIdRef.current;
          lastMessageIdRef.current = newLastId;

          // If message IDs changed, update
          if (newLastId !== prevLastId || prev.length === 0) {
            return history;
          }
          return prev;
        });
        if (!isPolling) {
          setIsPolling(true);
        }
      }
    } catch (error) {
      logger.error("[Chat] Failed to fetch message history:", error);
    }
  }, [isPolling]);

  // Start polling when token is available
  useEffect(() => {
    if (!chatTokenQuery.data?.token || !user) return;

    // Initial fetch
    lastMessageIdRef.current = undefined;
    fetchMessageHistory(currentRoom);

    // Set up polling interval
    pollIntervalRef.current = setInterval(() => {
      fetchMessageHistory(currentRoom);
    }, POLL_INTERVAL);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [chatTokenQuery.data?.token, user, currentRoom, fetchMessageHistory]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear selected image
  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Upload image to S3
  const uploadImage = async (file: File): Promise<{ url: string; key: string } | null> => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("token", chatTokenQuery.data?.token || "");

      const response = await fetch("/api/chat/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      return { url: data.url, key: data.key };
    } catch (error) {
      logger.error("[Chat] Failed to upload image:", error);
      toast.error("Failed to upload image");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Send message via HTTP POST
  const handleSendMessage = async () => {
    if (!user || (!newMessage.trim() && !selectedImage) || !chatTokenQuery.data?.token) {
      if (!chatTokenQuery.data?.token) {
        toast.error("Not connected to chat. Please wait or refresh the page.");
      }
      return;
    }

    setIsSending(true);

    // Extract mentions from message
    const mentionRegex = /@(\w+)/g;
    const mentionedNames = [...newMessage.matchAll(mentionRegex)].map(m => m[1]);
    const mentionedUserIds = allUsers
      .filter(u => mentionedNames.some(name =>
        u.name.toLowerCase().includes(name.toLowerCase())
      ))
      .map(u => u.id);

    try {
      // Upload image first if selected
      let imageUrl: string | undefined;
      let imageKey: string | undefined;

      if (selectedImage) {
        const uploadResult = await uploadImage(selectedImage);
        if (uploadResult) {
          imageUrl = uploadResult.url;
          imageKey = uploadResult.key;
        } else {
          setIsSending(false);
          return; // Don't send message if image upload failed
        }
      }

      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: chatTokenQuery.data.token,
          room: currentRoom,
          message: newMessage.trim() || (imageUrl ? "Shared an image" : ""),
          imageUrl,
          imageKey,
          mentions: mentionedUserIds.length > 0 ? mentionedUserIds : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setNewMessage("");
      setShowMentions(false);
      clearSelectedImage();

      // Immediately fetch new messages after sending
      fetchMessageHistory(currentRoom);
    } catch (error) {
      logger.error("[Chat] Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setShowMentions(true);
      setMentionFilter("");
    } else if (lastAtIndex !== -1) {
      const afterAt = value.slice(lastAtIndex + 1);
      if (!afterAt.includes(" ")) {
        setShowMentions(true);
        setMentionFilter(afterAt);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (userName: string) => {
    const lastAtIndex = newMessage.lastIndexOf("@");
    const newValue = newMessage.slice(0, lastAtIndex) + `@${userName} `;
    setNewMessage(newValue);
    setShowMentions(false);
  };

  const switchRoom = (roomId: string) => {
    setCurrentRoom(roomId);
    setMessages([]); // Clear messages while loading new room
    lastMessageIdRef.current = undefined;
    setMobileMenuOpen(false);
    // Clear unread count for new room
    setRooms(prev => prev.map(r =>
      r.id === roomId ? { ...r, unreadCount: 0 } : r
    ));
  };

  const currentRoomData = rooms.find(r => r.id === currentRoom);
  const totalUnread = rooms.reduce((sum, r) => sum + r.unreadCount, 0);

  const filteredMentionUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(mentionFilter.toLowerCase())
  ).slice(0, 5);

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
          {/* Announcement Banner */}
          {visibleAnnouncements && visibleAnnouncements.length > 0 && (
            <div className="mb-3 space-y-2">
              {visibleAnnouncements.slice(0, 2).map((announcement: any) => (
                <div
                  key={announcement.id}
                  className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3"
                >
                  <Bell className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{announcement.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{announcement.content}</p>
                  </div>
                  <button
                    onClick={() => dismissAnnouncement(announcement.id)}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex h-full gap-4">
            {/* Sidebar - Desktop */}
            <div className="hidden md:flex flex-col w-64 bg-card rounded-lg border">
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

              {/* Connection Status */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Circle className={`h-2 w-2 ${isPolling ? 'fill-green-500 text-green-500' : 'fill-yellow-500 text-yellow-500'}`} />
                  {isPolling ? 'Connected' : 'Connecting...'}
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
                    <Circle className={`h-2 w-2 ${isPolling ? 'fill-green-500 text-green-500' : 'fill-yellow-500 text-yellow-500'}`} />
                    {isPolling ? 'Connected' : 'Connecting...'}
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
                            key={msg.id || index}
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
                              {msg.imageUrl && (
                                <img
                                  src={msg.imageUrl}
                                  alt="Shared image"
                                  className="max-w-full rounded mb-2"
                                />
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

                {/* Mention Suggestions */}
                {showMentions && filteredMentionUsers.length > 0 && (
                  <div className="absolute bottom-20 left-4 right-4 bg-card border rounded-lg shadow-lg p-2 max-h-40 overflow-y-auto">
                    {filteredMentionUsers.map(u => (
                      <button
                        key={u.id}
                        onClick={() => insertMention(u.name)}
                        className="w-full text-left px-3 py-2 hover:bg-muted rounded flex items-center gap-2"
                      >
                        <AtSign className="h-4 w-4 text-muted-foreground" />
                        {u.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative inline-block mb-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-32 rounded border"
                    />
                    <button
                      onClick={clearSelectedImage}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {/* Input Area */}
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSending || isUploading}
                    title="Attach image"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder={`Message #${currentRoomData?.name || currentRoom}... (use @ to mention)`}
                    className="flex-1"
                    disabled={isSending || isUploading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    size="icon"
                    disabled={(!newMessage.trim() && !selectedImage) || isSending || isUploading}
                  >
                    {isUploading ? (
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
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
