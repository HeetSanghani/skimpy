import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from 'react-hot-toast';

const BASE_URL = "http://localhost:8000";

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

export default function ChatPage() {
  const { sellerId } = useParams(); // vendor_id from URL
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [currentUserId, setCurrentUserId] = useState(() => {
    const stored = localStorage.getItem("user_id");
    return stored && stored.trim() ? stored.trim() : null;
  });

  const [seller, setSeller] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!token) {
      toast.error("Please log in first!");
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
        const resolvedId = res.data?.user_id
          ? String(res.data.user_id).trim()
          : "";
        if (isMounted && resolvedId) {
          setCurrentUserId(resolvedId);
          localStorage.setItem("user_id", resolvedId);
        }
      } catch (err) {
        console.error("Error resolving current user:", err);
      }
    };

    fetchCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchSeller = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/Vendor?vendor_id=${sellerId}`);
        setSeller(res.data);
      } catch (err) {
        console.error("Error fetching seller:", err);
      }
    };
    fetchSeller();
  }, [sellerId]);

  const fetchMessages = useCallback(
    async (convId) => {
      if (!token) return;
      try {
        const res = await axios.get(`${BASE_URL}/Chat/messages`, {
          params: { conversation_id: convId },
          headers: { Authorization: `Bearer ${token}` },
        });

        const formatted = (res.data || []).map((m) => ({
          id: m.id || m._id,
          sender_id: String(m.sender_id),
          text: m.text,
          created_at: m.created_at || new Date().toISOString(),
          read_by: Array.isArray(m.read_by) ? m.read_by.map(String) : [],
        }));

        setMessages(formatted);
      } catch (err) {
        console.error("Error loading messages:", err);
      }
    },
    [token]
  );

  useEffect(() => {
    if (!sellerId || !currentUserId || !token) return;

    const initChat = async () => {
      try {
        const convRes = await axios.post(
          `${BASE_URL}/Chat/start`,
          {},
          {
            params: {
              buyer_id: currentUserId,
              vendor_user_id: sellerId,
            },
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const convId = convRes.data.id;
        setConversationId(convId);
        setParticipants(
          (convRes.data.participants || []).map((p) => String(p))
        );

        await fetchMessages(convId);
      } catch (err) {
        console.error("Error loading chat:", err);
      }
    };

    initChat();
  }, [sellerId, currentUserId, token, fetchMessages]);

  useEffect(() => {
    if (!conversationId) return;
    const interval = setInterval(() => {
      fetchMessages(conversationId);
    }, 3000);
    return () => clearInterval(interval);
  }, [conversationId, fetchMessages]);

  const otherParticipantIds = participants.filter(
    (pid) => String(pid) !== String(currentUserId)
  );
  const primaryPeerId =
    otherParticipantIds[0] || (sellerId ? String(sellerId) : "");

  const sendMessage = async () => {
    if (!input.trim() || !conversationId || !currentUserId || !token) return;

    const text = input.trim();
    const newMessage = {
      id: "temp-" + Date.now(),
      sender_id: String(currentUserId),
      text,
      created_at: new Date().toISOString(),
      read_by: [String(currentUserId)],
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    try {
      await axios.post(
        `${BASE_URL}/Chat/message`,
        {},
        {
          params: {
            conversation_id: conversationId,
            text,
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchMessages(conversationId);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!currentUserId) {
    return (
      <div className="h-screen flex justify-center items-center text-gray-600">
        Loading chat...
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#F5F5F7] p-0 md:p-4 lg:p-6">
      <div className="w-full max-w-7xl h-full md:h-[85vh] md:rounded-2xl shadow-none md:shadow-2xl border-0 md:border border-[#E8E8E8] flex flex-col bg-white overflow-hidden">
        {/* ===== Header ===== */}
        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 bg-[#14274E] text-white shadow-md z-10 shrink-0">
          <div className="flex items-center space-x-3">
            <button onClick={() => navigate(-1)} className="md:hidden p-1 -ml-2 text-gray-300 hover:text-white">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <img
              src={normalizeImage(seller?.image || seller?.profile_image)}
              alt="profile"
              className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-[#9BA4B4] shadow-md object-cover bg-white"
            />
            <div>
              <h2 className="text-base md:text-lg font-semibold truncate max-w-[200px]">
                {seller?.shop_name || "Seller Shop"}
              </h2>
              <p className="text-xs md:text-sm text-[#9BA4B4] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Online
              </p>
            </div>
          </div>
        </div>

        {/* ===== Messages Section ===== */}
        <div className="flex-1 overflow-y-auto px-6 py-5 bg-[#F4F4F2]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#9BA4B4] select-none">
              <p>No messages yet. Start chatting!</p>
            </div>
          ) : (
            messages.map((m) => {
              const isMine =
                String(m.sender_id).trim() === String(currentUserId).trim();
              const isSeen =
                isMine &&
                primaryPeerId &&
                Array.isArray(m.read_by) &&
                m.read_by.map(String).includes(String(primaryPeerId));
              const status = isMine ? (isSeen ? "seen" : "delivered") : null;

              return (
                <div
                  key={m.id}
                  className={`flex mb-3 ${isMine ? "justify-end" : "justify-start"
                    }`}
                >
                  <div
                    className={`px-4 py-2 rounded-2xl border shadow-md max-w-[75%] ${isMine
                      ? "bg-gradient-to-br from-[#394867] to-[#14274E] text-white border-[#14274E] shadow-lg"
                      : "bg-[#E8E8E8] text-[#14274E] border-[#DDDDDD] shadow-md"
                      }`}
                    style={{
                      wordWrap: "break-word",
                      overflowWrap: "break-word",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    <p className="text-sm leading-snug">{m.text}</p>
                    <div
                      className={`flex justify-end items-center text-[10px] mt-1 ${isMine ? "text-gray-300" : "text-gray-500"
                        }`}
                    >
                      <span>{formatTime(m.created_at)}</span>
                      {isMine && <MessageStatusIcon status={status} />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ===== Input Bar ===== */}
        <div className="flex items-center bg-[#EEEEEE] border-t border-[#DDDDDD] px-5 py-4 shadow-md">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your message..."
            className="flex-grow px-4 py-2 border border-[#BBBFCA] rounded-full focus:outline-none focus:ring-1 focus:ring-[#394867] bg-white text-[#14274E] shadow-sm"
          />
          <button
            onClick={sendMessage}
            className="ml-3 px-6 py-2 rounded-full bg-[#394867] text-white hover:bg-[#2A4759] shadow-lg transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
