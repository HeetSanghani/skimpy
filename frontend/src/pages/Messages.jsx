import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

const BASE_URL = "http://localhost:8000";

function getUserId() {
  const saved = localStorage.getItem("user_id");
  if (saved) return saved;
  const gen = `guest-${Math.random().toString(36).slice(2, 9)}`;
  localStorage.setItem("user_id", gen);
  return gen;
}

export default function Messages() {
  const [searchParams] = useSearchParams();
  const vendorUserId = searchParams.get("vendor_user_id") || searchParams.get("vendor_id");
  const vendorId = searchParams.get("vendor_id");
  const productId = searchParams.get("product_id");
  const userId = useMemo(getUserId, []);

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [vendor, setVendor] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    async function ensureConversation() {
      if (!vendorUserId) return;
      const res = await fetch(
        `${BASE_URL}/Chat/start?buyer_id=${encodeURIComponent(userId)}&vendor_user_id=${encodeURIComponent(
          vendorUserId
        )}${productId ? `&product_id=${encodeURIComponent(productId)}` : ""}`,
        { method: "POST" }
      );
      const conv = await res.json();
      setConversation(conv);
    }
    ensureConversation();
  }, [vendorUserId, productId, userId]);

  // Load vendor info for header
  useEffect(() => {
    async function loadVendor() {
      if (!vendorId) return;
      try {
        const res = await fetch(`${BASE_URL}/Vendor?vendor_id=${encodeURIComponent(vendorId)}`);
        const data = await res.json();
        setVendor(data);
      } catch (e) {
        // ignore
      }
    }
    loadVendor();
  }, [vendorId]);

  useEffect(() => {
    if (!conversation?.id) return;
    let timer;
    const load = async () => {
      const res = await fetch(`${BASE_URL}/Chat/messages?conversation_id=${conversation.id}`);
      const data = await res.json();
      setMessages(data);
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    load();
    timer = setInterval(load, 2000);
    return () => clearInterval(timer);
  }, [conversation?.id]);

  const send = async () => {
    if (!text.trim() || !conversation?.id) return;
    await fetch(
      `${BASE_URL}/Chat/message?conversation_id=${conversation.id}&sender_id=${encodeURIComponent(
        userId
      )}&text=${encodeURIComponent(text.trim())}`,
      { method: "POST" }
    );
    setText("");
  };

  return (
    <div className="w-full p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Messages</h2>
        {vendor && (
          <div className="mt-2">
            <p className="text-lg font-semibold text-gray-900">{vendor.shop_name}</p>
            {(vendor.description || vendor.shop_description) && (
              <p className="text-gray-600 text-sm">
                {vendor.description || vendor.shop_description}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="border rounded-xl overflow-hidden shadow-sm">
        <div className="h-[60vh] overflow-y-auto p-4 bg-gray-50">
          {messages.map((m) => (
            <div key={m.id} className={`flex mb-2 ${m.sender_id === userId ? "justify-end" : "justify-start"}`}>
              <div
                className={`${
                  m.sender_id === userId ? "bg-black text-white" : "bg-white border"
                } px-3 py-2 rounded-2xl max-w-[75%] text-sm`}
              >
                {m.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="p-3 flex gap-2 border-t bg-white">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Write a message..."
            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
          <button onClick={send} className="px-4 py-2 rounded-full bg-black text-white">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}


