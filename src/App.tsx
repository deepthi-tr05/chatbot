import React, { useState, useEffect } from "react";
import { 
  isFirebaseConfigured, 
  db, 
  auth, 
  handleFirestoreError, 
  OperationType 
} from "@/src/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";
import { signOut as firebaseSignOut } from "firebase/auth";
import { UserProfile, ChatSession, MessageLine } from "@/src/types";

// Component Elements
import Sidebar from "@/src/components/Sidebar";
import ChatArea from "@/src/components/ChatArea";
import AuthScreen from "@/src/components/AuthScreen";
import ProfileCustomizer from "@/src/components/ProfileCustomizer";

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ userId: string; email: string; displayName: string; isGuest: boolean } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Custom dialogs & state
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageLine[]>([]);
  
  const [isSending, setIsSending] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState(false);

  // 1. Dark Mode initialization and root HTML element binding
  useEffect(() => {
    const savedTheme = localStorage.getItem("voice_chatbot_theme") || "dark";
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    }
  }, []);

  const handleThemeToggle = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("voice_chatbot_theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("voice_chatbot_theme", "dark");
      setIsDarkMode(true);
    }
  };

  // 2. Clear out auth state if Firebase changes or initial auth state loading
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = auth.onAuthStateChanged((user: any) => {
        if (user) {
          // Logged in via Google Auth
          setCurrentUser({
            userId: user.uid,
            email: user.email || "user@domain.com",
            displayName: user.displayName || "Google User",
            isGuest: false,
          });
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  // 3. User profiles loader and cloud-sync handler
  useEffect(() => {
    if (!currentUser) return;

    const profileId = currentUser.userId;

    if (isFirebaseConfigured && !currentUser.isGuest && db) {
      // Sync from Firestore User Profile
      setIsFirebaseSyncing(true);
      const profileDocRef = doc(db, "user_profiles", profileId);
      
      const unsubscribe = onSnapshot(profileDocRef, (snap) => {
        if (snap.exists()) {
          const profileData = snap.data() as UserProfile;
          if (profileData.preferredModel === "gemma2-9b-it" || profileData.preferredModel === "mixtral-8x7b-32768") {
            profileData.preferredModel = "llama-3.3-70b-versatile";
          }
          setUserProfile(profileData);
        } else {
          // Create a new fresh Firestore profile on first login
          const presetProfile: UserProfile = {
            userId: profileId,
            email: currentUser.email,
            displayName: currentUser.displayName,
            avatarIcon: "Robot",
            avatarColor: "from-purple-500 to-indigo-600",
            preferredLanguage: "en-IN",
            preferredModel: "llama-3.3-70b-versatile",
          };
          
          setDoc(profileDocRef, {
            ...presetProfile,
            updatedAt: serverTimestamp(),
          }).catch((err) => {
            handleFirestoreError(err, OperationType.WRITE, `user_profiles/${profileId}`);
          });

          setUserProfile(presetProfile);
        }
        setIsFirebaseSyncing(false);
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, `user_profiles/${profileId}`);
      });

      return () => unsubscribe();
    } else {
      // Sandbox / Guest Local Storage Loader
      const savedProfile = localStorage.getItem(`profile_${profileId}`);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile) as UserProfile;
        if (parsed.preferredModel === "gemma2-9b-it" || parsed.preferredModel === "mixtral-8x7b-32768") {
          parsed.preferredModel = "llama-3.3-70b-versatile";
          localStorage.setItem(`profile_${profileId}`, JSON.stringify(parsed));
        }
        setUserProfile(parsed);
      } else {
        const defaultProfile: UserProfile = {
          userId: profileId,
          email: currentUser.email,
          displayName: currentUser.displayName,
          avatarIcon: "Robot",
          avatarColor: "from-purple-500 to-indigo-600",
          preferredLanguage: "en-IN",
          preferredModel: "llama-3.3-70b-versatile",
        };
        localStorage.setItem(`profile_${profileId}`, JSON.stringify(defaultProfile));
        setUserProfile(defaultProfile);
      }
    }
  }, [currentUser]);

  // 4. Chat session listener (Cloud Sync vs local)
  useEffect(() => {
    if (!currentUser || !userProfile) return;

    if (isFirebaseConfigured && !currentUser.isGuest && db) {
      // Sync User Chats from Firestore
      const chatsQuery = query(
        collection(db, "chats"),
        where("userId", "==", currentUser.userId)
      );

      const unsubscribe = onSnapshot(chatsQuery, (snap) => {
        const sessionsList: ChatSession[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          sessionsList.push({
            chatId: data.chatId,
            userId: data.userId,
            title: data.title,
            createdAt: data.createdAt?.seconds ? data.createdAt.seconds * 1000 : Date.now(),
            updatedAt: data.updatedAt?.seconds ? data.updatedAt.seconds * 1000 : Date.now(),
          });
        });

        // Sort locally by completion time descending
        sessionsList.sort((a, b) => b.updatedAt - a.updatedAt);
        setChatSessions(sessionsList);
        
        // Auto select first conversation if activeChatId is null but sessions exist
        if (sessionsList.length > 0 && !activeChatId) {
          setActiveChatId(sessionsList[0].chatId);
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, "chats");
      });

      return () => unsubscribe();
    } else {
      // Local Guest storage sync
      const loadLocalSessions = () => {
        const key = `chats_${currentUser.userId}`;
        const localChats = localStorage.getItem(key);
        if (localChats) {
          const parsed = JSON.parse(localChats) as ChatSession[];
          parsed.sort((a, b) => b.updatedAt - a.updatedAt);
          setChatSessions(parsed);
          if (parsed.length > 0 && !activeChatId) {
            setActiveChatId(parsed[0].chatId);
          }
        } else {
          setChatSessions([]);
        }
      };
      loadLocalSessions();
      
      // Setup window listeners for cross-tab local syncing
      window.addEventListener("storage", loadLocalSessions);
      return () => window.removeEventListener("storage", loadLocalSessions);
    }
  }, [currentUser, userProfile, activeChatId]);

  // 5. Messages stream listener (Cloud Sync vs local)
  useEffect(() => {
    if (!currentUser || !activeChatId) {
      setMessages([]);
      return;
    }

    if (isFirebaseConfigured && !currentUser.isGuest && db) {
      // Fetch messages subcollection from Firestore
      const msgsPath = `chats/${activeChatId}/messages`;
      const msgsQuery = query(
        collection(db, "chats", activeChatId, "messages"),
        orderBy("createdAt", "asc")
      );

      const unsubscribe = onSnapshot(msgsQuery, (snap) => {
        const msgsList: MessageLine[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          msgsList.push({
            messageId: data.messageId,
            chatId: data.chatId,
            sender: data.sender,
            text: data.text,
            sentiment: data.sentiment || "neutral",
            detectedLanguage: data.detectedLanguage,
            audioBase64: data.audioBase64,
            imageUrl: data.imageUrl,
            createdAt: data.createdAt?.seconds ? data.createdAt.seconds * 1000 : Date.now(),
          });
        });
        setMessages(msgsList);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, msgsPath);
      });

      return () => unsubscribe();
    } else {
      // Guest local storage messages loader
      const localMsgKey = `messages_${currentUser.userId}_${activeChatId}`;
      const savedMessages = localStorage.getItem(localMsgKey);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        setMessages([]);
      }
    }
  }, [currentUser, activeChatId]);

  // Save/Edit user profile
  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    if (!currentUser || !userProfile) return;

    const nextProfile = { ...userProfile, ...updated };
    setUserProfile(nextProfile);

    if (isFirebaseConfigured && !currentUser.isGuest && db) {
      const ref = doc(db, "user_profiles", currentUser.userId);
      setDoc(ref, {
        ...nextProfile,
        updatedAt: serverTimestamp(),
      }, { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `user_profiles/${currentUser.userId}`);
      });
    } else {
      localStorage.setItem(`profile_${currentUser.userId}`, JSON.stringify(nextProfile));
    }
  };

  // Sign in actions handler
  const handleLoginSuccess = (userId: string, email: string, displayName: string, isGuest: boolean) => {
    setCurrentUser({ userId, email, displayName, isGuest });
    setActiveChatId(null);
  };

  // Sign out engine
  const handleSignOut = async () => {
    if (isFirebaseConfigured && !currentUser?.isGuest && auth) {
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        console.error("Firebase signOut failed:", e);
      }
    }
    setCurrentUser(null);
    setUserProfile(null);
    setChatSessions([]);
    setActiveChatId(null);
    setMessages([]);
  };

  // Create a brand new Consultation channel
  const handleNewChat = () => {
    if (!currentUser) return;

    const newId = "chat_" + Math.random().toString(36).substring(2, 9);
    const newSession: ChatSession = {
      chatId: newId,
      userId: currentUser.userId,
      title: "New Dialogue Session",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (isFirebaseConfigured && !currentUser.isGuest && db) {
      const docRef = doc(db, "chats", newId);
      setDoc(docRef, {
        chatId: newId,
        userId: currentUser.userId,
        title: "New Dialogue Session",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `chats/${newId}`);
      });
    } else {
      const key = `chats_${currentUser.userId}`;
      const existing = [...chatSessions, newSession];
      localStorage.setItem(key, JSON.stringify(existing));
      setChatSessions(existing);
    }

    setActiveChatId(newId);
  };

  // Delete an existing conversation thread
  const handleDeleteChat = (targetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;

    if (activeChatId === targetId) {
      setActiveChatId(null);
    }

    if (isFirebaseConfigured && !currentUser.isGuest && db) {
      const ref = doc(db, "chats", targetId);
      deleteDoc(ref).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `chats/${targetId}`);
      });
    } else {
      const key = `chats_${currentUser.userId}`;
      const remainingArr = chatSessions.filter((s) => s.chatId !== targetId);
      localStorage.setItem(key, JSON.stringify(remainingArr));
      
      // Clean up child messages as well from local storage
      const childMsgKey = `messages_${currentUser.userId}_${targetId}`;
      localStorage.removeItem(childMsgKey);
      
      setChatSessions(remainingArr);
    }
  };

  // Send human prompt, compute API values and return structured payload
  const handleSendMessage = async (userText: string) => {
    if (!currentUser || !userProfile || !activeChatId) return;

    const messageId = "msg_" + Math.random().toString(36).substring(2, 9);
    const textPrompt = userText.trim();

    // 1. Create User message bubble
    const userMessage: MessageLine = {
      messageId,
      chatId: activeChatId,
      sender: "user",
      text: textPrompt,
      sentiment: "neutral", // initial assessment
      createdAt: Date.now(),
    };

    // Update messages local array immediately to show typing feedback
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setIsSending(true);

    // Save user message
    if (isFirebaseConfigured && !currentUser.isGuest && db) {
      const ref = doc(db, "chats", activeChatId, "messages", messageId);
      setDoc(ref, {
        messageId,
        chatId: activeChatId,
        sender: "user",
        text: textPrompt,
        sentiment: "neutral",
        createdAt: serverTimestamp(),
      }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `chats/${activeChatId}/messages/${messageId}`);
      });
    } else {
      const localMsgKey = `messages_${currentUser.userId}_${activeChatId}`;
      localStorage.setItem(localMsgKey, JSON.stringify(nextMessages));
    }

    try {
      // 2. Transmit prompt to back-end API proxy
      const conversationHistory = nextMessages.slice(-10); // feed last 10 messages for conversational state
      
      const payloadBody = {
        messages: conversationHistory.map(m => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        })),
        preferredLanguage: userProfile.preferredLanguage,
        preferredModel: userProfile.preferredModel,
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadBody),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || errorData.error || "Conversational prompt failed.");
      }

      const replyData = await res.json();

      // If the LLM generated a dynamic title because it's the first exchange, let's update chat title!
      if (messages.length === 0) {
        const generatedTitle = textPrompt.length > 25 ? textPrompt.substring(0, 25) + "..." : textPrompt;
        
        if (isFirebaseConfigured && !currentUser.isGuest && db) {
          const chatDocRef = doc(db, "chats", activeChatId);
          setDoc(chatDocRef, {
            title: generatedTitle,
            updatedAt: serverTimestamp(),
          }, { merge: true }).catch((err) => {
            handleFirestoreError(err, OperationType.WRITE, `chats/${activeChatId}`);
          });
        } else {
          const chatKey = `chats_${currentUser.userId}`;
          const updatedSessions = chatSessions.map((s) => {
            if (s.chatId === activeChatId) {
              return { ...s, title: generatedTitle, updatedAt: Date.now() };
            }
            return s;
          });
          localStorage.setItem(chatKey, JSON.stringify(updatedSessions));
          setChatSessions(updatedSessions);
        }
      } else {
        // Just update updatedAt timestamp
        if (isFirebaseConfigured && !currentUser.isGuest && db) {
          const chatDocRef = doc(db, "chats", activeChatId);
          setDoc(chatDocRef, {
            updatedAt: serverTimestamp(),
          }, { merge: true }).catch((err) => {
            handleFirestoreError(err, OperationType.WRITE, `chats/${activeChatId}`);
          });
        } else {
          const chatKey = `chats_${currentUser.userId}`;
          const updatedSessions = chatSessions.map((s) => {
            if (s.chatId === activeChatId) {
              return { ...s, updatedAt: Date.now() };
            }
            return s;
          });
          localStorage.setItem(chatKey, JSON.stringify(updatedSessions));
          setChatSessions(updatedSessions);
        }
      }

      // 3. Create Bot reply bubble
      const botMessageId = "msg_reply_" + Math.random().toString(36).substring(2, 9);
      const botMessage: MessageLine = {
        messageId: botMessageId,
        chatId: activeChatId,
        sender: "bot",
        text: replyData.response,
        sentiment: replyData.sentiment || "neutral",
        detectedLanguage: replyData.detectedLanguage,
        imageUrl: replyData.imageUrl, // optional Base64 jpeg representation from Imagen 3
        createdAt: Date.now(),
      };

      const revisedMessages = [...nextMessages, botMessage];
      setMessages(revisedMessages);

      if (isFirebaseConfigured && !currentUser.isGuest && db) {
        const matchRef = doc(db, "chats", activeChatId, "messages", botMessageId);
        setDoc(matchRef, {
          messageId: botMessageId,
          chatId: activeChatId,
          sender: "bot",
          text: replyData.response,
          sentiment: replyData.sentiment || "neutral",
          detectedLanguage: replyData.detectedLanguage || "",
          imageUrl: replyData.imageUrl || "",
          createdAt: serverTimestamp(),
        }).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, `chats/${activeChatId}/messages/${botMessageId}`);
        });
      } else {
        const localMsgKey = `messages_${currentUser.userId}_${activeChatId}`;
        localStorage.setItem(localMsgKey, JSON.stringify(revisedMessages));
      }

    } catch (apiErr: any) {
      console.error("Failed executing response flow:", apiErr);
      
      const errorMsgId = "msg_err_" + Math.random().toString(36).substring(2, 9);
      const errorBubble: MessageLine = {
        messageId: errorMsgId,
        chatId: activeChatId,
        sender: "bot",
        text: `⚠️ [System Warning] Failed to fetch reply: ${apiErr.message}. Make sure GROQ_API_KEY is configured correctly.`,
        sentiment: "neutral",
        createdAt: Date.now(),
      };

      const finalErrSet = [...nextMessages, errorBubble];
      setMessages(finalErrSet);

      if (!isFirebaseConfigured || currentUser.isGuest) {
        localStorage.setItem(`messages_${currentUser.userId}_${activeChatId}`, JSON.stringify(finalErrSet));
      }
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Caches the base64 audio snippet on-demand so voice clips remain persistable.
   */
  const handlePlayTTSComplete = (msgId: string, audioBase64: string) => {
    if (!currentUser || !activeChatId) return;

    const updated = messages.map((m) => {
      if (m.messageId === msgId) {
        return { ...m, audioBase64 };
      }
      return m;
    });

    setMessages(updated);

    if (isFirebaseConfigured && !currentUser.isGuest && db) {
      // We can't update messages collection directly in rules easily because updates are turned off ('allow update: if false').
      // That is correct because messages are immutable once written to prevent tampering.
      // Caching is stored on client-side state dynamically, that is perfect!
    } else {
      localStorage.setItem(`messages_${currentUser.userId}_${activeChatId}`, JSON.stringify(updated));
    }
  };

  // 6. Router Guard check if logged in
  if (!currentUser || !userProfile) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Active Chat Session context
  const activeSession = chatSessions.find((s) => s.chatId === activeChatId);
  const activeTitle = activeSession ? activeSession.title : "Active Dialogue";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-slate-900 duration-300 transition-colors">
      
      {/* Sidebar Navigation */}
      <Sidebar
        sessions={chatSessions}
        activeChatId={activeChatId}
        profile={userProfile}
        isGuest={currentUser.isGuest}
        isDarkMode={isDarkMode}
        onThemeToggle={handleThemeToggle}
        onSelectChat={setActiveChatId}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Focus Stage Stage Area */}
      {activeChatId ? (
        <ChatArea
          activeSessionTitle={activeTitle}
          messages={messages}
          profile={userProfile}
          isSending={isSending}
          onSendMessage={handleSendMessage}
          onPlayTTSComplete={handlePlayTTSComplete}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center select-none transition-colors duration-300">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            No Dialogue Session Selected
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
            Create a new dialogue channel or select an active thread from the list to start translating spoken interactions today.
          </p>
          <button
            onClick={handleNewChat}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow transition duration-150"
          >
            Create Dialogue
          </button>
        </div>
      )}

      {/* Profile Settings Drawer Overlay */}
      {isSettingsOpen && (
        <ProfileCustomizer
          profile={userProfile}
          onSave={handleUpdateProfile}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

    </div>
  );
}
