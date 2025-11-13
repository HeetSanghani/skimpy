import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const BASE_URL = "http://localhost:8000";

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
      alert("Please log in first!");
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
    <div className="fixed inset-0 flex items-center justify-center bg-[#F5F5F7]">
      <div className="w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl border border-[#E8E8E8] flex flex-col bg-white">
        {/* ===== Header ===== */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#14274E] text-white shadow-md">
          <div className="flex items-center space-x-3">
            <img
              src={seller?.profile_image || "https://via.placeholder.com/80"}
              alt="profile"
              className="w-12 h-12 rounded-full border border-[#9BA4B4] shadow-md object-cover"
            />
            <div>
              <h2 className="text-lg font-semibold">
                {seller?.shop_name || "Seller Shop"}
              </h2>
              <p className="text-sm text-[#9BA4B4]">Online</p>
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
                  className={`flex mb-3 ${
                    isMine ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2 rounded-2xl border shadow-md max-w-[75%] ${
                      isMine
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
                      className={`flex justify-end items-center text-[10px] mt-1 ${
                        isMine ? "text-gray-300" : "text-gray-500"
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
