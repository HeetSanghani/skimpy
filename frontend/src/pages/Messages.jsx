import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";

const BASE_URL = "http://localhost:8000";
const POLL_INTERVAL = 3000;

// ✅ Local SVG Fallback
const DEFAULT_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22200%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AHelvetica%2C%20monospace%3Bfont-size%3A14pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23eee%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2260%22%20y%3D%22105%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E";

// ✅ Normalize backend image paths
const normalizeImage = (img) => {
  if (!img) return DEFAULT_IMAGE;
  if (typeof img !== "string") return DEFAULT_IMAGE;
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  if (img.startsWith("data:image")) return img;
  return `${BASE_URL}${img.startsWith("/") ? img : `/${img}`}`;
};

const MessageStatusIcon = ({ status }) => {
  if (!status) return null;
  const color = status === "seen" ? "text-sky-400" : "text-gray-400";
  return (
    <svg
      className={`ml-1 h-3.5 w-3.5 ${color}`}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.5 8.5 6 11l7-7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1 8.5 3.5 11l1.8-1.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const formatTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function Messages() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [currentUserId, setCurrentUserId] = useState(() => {
    const stored = localStorage.getItem("user_id");
    return stored && stored.trim() ? stored.trim() : null;
  });

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const [showChat, setShowChat] = useState(false); // mobile: show chat panel vs sidebar
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token) return;
    let isMounted = true;

    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/user/settings/get-account-details`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const resolved = res.data?.user_id
          ? String(res.data.user_id).trim()
          : "";
        if (isMounted && resolved) {
          setCurrentUserId(resolved);
          localStorage.setItem("user_id", resolved);
        }
      } catch (err) {
        console.error("Error resolving current user:", err);
        if (isMounted) {
          setError("Unable to load your account. Please re-login.");
        }
      }
    };

    fetchCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const fetchConversations = useCallback(async () => {
    if (!token) return;
    setLoadingConversations(true);
    try {
      const res = await axios.get(`${BASE_URL}/Chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(res.data) ? res.data : [];
      setConversations(list);
      if (!activeConversationId && list.length > 0) {
        setActiveConversationId(list[0].id);
      }
    } catch (err) {
      console.error("Error loading conversations:", err);
      setError("Failed to load conversations");
    } finally {
      setLoadingConversations(false);
    }
  }, [token, activeConversationId]);

  const fetchMessages = useCallback(
    async (conversationId) => {
      if (!token || !conversationId) return;
      setLoadingMessages(true);
      try {
        const res = await axios.get(`${BASE_URL}/Chat/messages`, {
          params: { conversation_id: conversationId },
          headers: { Authorization: `Bearer ${token}` },
        });
        const normalized = (res.data || []).map((m) => ({
          id: m.id || m._id,
          sender_id: String(m.sender_id),
          text: m.text,
          created_at: m.created_at || new Date().toISOString(),
          read_by: Array.isArray(m.read_by) ? m.read_by.map(String) : [],
        }));
        setMessages(normalized);
        await fetchConversations();
      } catch (err) {
        console.error("Error loading messages:", err);
        setError("Failed to load messages");
      } finally {
        setLoadingMessages(false);
      }
    },
    [token, fetchConversations]
  );

  const handleSelectConversation = (conversationId) => {
    setActiveConversationId(conversationId);
    setShowChat(true); // on mobile, switch to chat panel
  };

  const handleSendMessage = async () => {
    if (
      !messageInput.trim() ||
      !activeConversationId ||
      !currentUserId ||
      !token
    ) {
      return;
    }

    const text = messageInput.trim();
    const optimisticMessage = {
      id: "temp-" + Date.now(),
      sender_id: currentUserId,
      text,
      created_at: new Date().toISOString(),
      read_by: [String(currentUserId)],
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageInput("");

    try {
      await axios.post(
        `${BASE_URL}/Chat/message`,
        {},
        {
          params: {
            conversation_id: activeConversationId,
            text,
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchMessages(activeConversationId);
      await fetchConversations();
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    }
  };

  useEffect(() => {
    if (!currentUserId) return;
    fetchConversations();
  }, [currentUserId, fetchConversations]);

  useEffect(() => {
    if (!currentUserId) return;
    const interval = setInterval(() => {
      fetchConversations();
    }, POLL_INTERVAL * 2);
    return () => clearInterval(interval);
  }, [currentUserId, fetchConversations]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    fetchMessages(activeConversationId);
  }, [activeConversationId, fetchMessages]);

  useEffect(() => {
    if (!activeConversationId) return;
    const interval = setInterval(() => {
      fetchMessages(activeConversationId);
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [activeConversationId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeConversation = useMemo(
    () => conversations.find((conv) => conv.id === activeConversationId),
    [conversations, activeConversationId]
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F5F5F7' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '8px' }} className="sm:p-3">
        <div style={{ flex: 1, display: 'flex', maxWidth: '1152px', margin: '0 auto', width: '100%', overflow: 'hidden', borderRadius: '16px', border: '1px solid #E8E8E8', background: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
          {/* Sidebar — full width on mobile when showChat=false, fixed 300px on md+ */}
          <aside className={`
            flex-col border-r border-[#E0E0E0] bg-[#F4F4F2] overflow-hidden flex-shrink-0
            w-full md:w-[300px]
            ${showChat ? 'hidden md:flex' : 'flex'}
          `}>
            <div style={{ borderBottom: '1px solid #E0E0E0', padding: '16px 20px', flexShrink: 0 }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#14274E', margin: 0 }}>Chats</h2>
              <p style={{ fontSize: '12px', color: '#707070', margin: '4px 0 0' }}>
                {loadingConversations
                  ? "Loading conversations..."
                  : `${conversations.length} conversation${conversations.length === 1 ? "" : "s"
                  }`}
              </p>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {conversations.length === 0 && !loadingConversations ? (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center text-sm text-[#707070]">
                  <p>No chats yet.</p>
                  <p>Start a conversation with a seller to see it here.</p>
                </div>
              ) : (
                conversations.map((conversation) => {
                  const metadata = conversation.metadata || {};
                  const vendor = metadata.vendor || {};
                  const peer = metadata.peer || {};
                  const lastMessage = conversation.last_message;
                  const isActive = conversation.id === activeConversationId;
                  const displayName = vendor.shop_name || peer.display_name || peer.user_id || "Conversation";
                  const unread = conversation.unread_count || 0;
                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => handleSelectConversation(conversation.id)}
                      className={`flex w-full flex-col items-start gap-1 px-5 py-4 text-left transition ${isActive
                        ? "bg-white"
                        : "hover:bg-[#ECECEC] focus:bg-[#ECECEC]"
                        }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-semibold text-[#14274E]">
                          {/* Avatar in sidebar */}
                          <img
                            src={normalizeImage(vendor.avatar || peer.avatar)}
                            alt="avatar"
                            className="w-8 h-8 rounded-full object-cover border border-[#DDDDDD]"
                          />
                          <span>{displayName}</span>
                          {unread > 0 && !isActive && (
                            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
                              {unread > 99 ? "99+" : unread}
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] uppercase tracking-wide text-[#9BA4B4]">
                          {formatDate(
                            (lastMessage && lastMessage.created_at) ||
                            conversation.updated_at
                          )}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-xs text-[#606060]">
                        {conversation.last_text || "Say hello 👋"}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Chat panel — hidden on mobile when showChat=false */}
          <section className={`
            flex-col overflow-hidden flex-1
            ${showChat ? 'flex' : 'hidden md:flex'}
          `}>
            {activeConversation ? (
              <>
                <div className="flex items-center justify-between border-b border-[#E0E0E0] px-4 py-3 sm:px-6 sm:py-4">
                  <div className="flex items-center gap-3">
                    {/* Back button — mobile only */}
                    <button
                      onClick={() => setShowChat(false)}
                      className="md:hidden p-1.5 rounded-lg hover:bg-[#ECECEC] text-[#14274E] transition mr-1"
                      aria-label="Back to conversations"
                    >
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <img
                      src={normalizeImage(
                        activeConversation.metadata?.vendor?.avatar ||
                        activeConversation.metadata?.peer?.avatar
                      )}
                      alt="avatar"
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-[#DDDDDD]"
                    />
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-[#14274E] truncate max-w-[160px] sm:max-w-none">
                        {activeConversation.metadata?.vendor?.shop_name ||
                          activeConversation.metadata?.peer?.display_name ||
                          activeConversation.metadata?.peer?.user_id ||
                          "Chat"}
                      </h3>
                      <p className="text-xs text-[#707070]">
                        Secure 1-to-1 messaging
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', background: '#F4F4F2', padding: '20px 24px' }}>
                  {loadingMessages && messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-[#707070]">
                      Loading messages...
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isMine =
                        String(message.sender_id).trim() ===
                        String(currentUserId).trim();
                      const peerId =
                        activeConversation.metadata?.peer?.user_id ||
                        activeConversation.metadata?.vendor?.user_id ||
                        activeConversation.other_participants?.find(
                          (pid) => String(pid) !== String(currentUserId)
                        ) ||
                        "";
                      const isSeen =
                        isMine &&
                        peerId &&
                        Array.isArray(message.read_by) &&
                        message.read_by.map(String).includes(String(peerId));
                      const status = isMine
                        ? isSeen
                          ? "seen"
                          : "delivered"
                        : null;
                      return (
                        <div
                          key={message.id}
                          className={`mb-3 flex ${isMine ? "justify-end" : "justify-start"
                            }`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl border px-4 py-2 shadow-md ${isMine
                              ? "bg-gradient-to-br from-[#394867] to-[#14274E] text-white border-[#14274E] shadow-lg"
                              : "bg-[#E8E8E8] text-[#14274E] border-[#DDDDDD] shadow-md"
                              }`}
                            style={{
                              wordWrap: "break-word",
                              overflowWrap: "break-word",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            <p className="text-sm leading-snug">{message.text}</p>
                            <div
                              className={`mt-1 flex items-center justify-end text-[10px] ${isMine ? "text-gray-300" : "text-gray-500"
                                }`}
                            >
                              <span>{formatTime(message.created_at)}</span>
                              {isMine && <MessageStatusIcon status={status} />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-[#E0E0E0] bg-[#EEEEEE] px-6 py-4">
                  <div className="flex items-center gap-3">
                    <input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 rounded-full border border-[#BBBFCA] bg-white px-4 py-2 text-[#14274E] shadow-sm focus:outline-none focus:ring-1 focus:ring-[#394867]"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="rounded-full bg-[#394867] px-6 py-2 text-white transition hover:bg-[#2A4759] shadow-lg"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F4F2', textAlign: 'center', fontSize: '14px', color: '#707070' }}>
                {loadingConversations
                  ? "Loading conversations..."
                  : "Select a conversation to start chatting."}
              </div>
            )}
          </section>
        </div>
        {error && (
          <div style={{ padding: '8px 24px', textAlign: 'center', fontSize: '14px', color: '#dc2626' }}>{error}</div>
        )}
      </div>
    </div>
  );
}