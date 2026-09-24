import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import { CheckIcon, CheckCheckIcon, CornerDownRightIcon, MoreVerticalIcon, SmileIcon, Trash2Icon, Edit3Icon, ReplyIcon } from "lucide-react";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

function ChatContainer() {
  const {
    selectedUser,
    getMessagesByUserId,
    messages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
    reactToMessage,
    deleteMessage,
    setReplyingTo,
    setEditingMessage,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [activeReactionPickerId, setActiveReactionPickerId] = useState(null);

  useEffect(() => {
    getMessagesByUserId(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser, getMessagesByUserId, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const currentUserId = String(authUser?._id || authUser?.user?._id || "");

  return (
    <>
      <ChatHeader />
      <div className="flex-1 px-6 overflow-y-auto py-8">
        {messages.length > 0 && !isMessagesLoading ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => {
              const senderId = String(msg.senderId?._id || msg.senderId || "");
              const isSentByMe = senderId === currentUserId;

              // Group reactions by emoji
              const reactionCounts = (msg.reactions || []).reduce((acc, curr) => {
                acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
                return acc;
              }, {});

              return (
                <div
                  key={msg._id}
                  className={`chat relative group ${isSentByMe ? "chat-end" : "chat-start"}`}
                >
                  <div className="relative">
                    {/* QUICK ACTION BAR ON HOVER */}
                    {!msg.isDeletedForEveryone && (
                      <div
                        className={`absolute top-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 border border-slate-700 rounded-full px-2 py-1 flex items-center gap-1 z-20 shadow-lg ${
                          isSentByMe ? "right-2" : "left-2"
                        }`}
                      >
                        <button
                          title="React"
                          onClick={() => setActiveReactionPickerId((prev) => (prev === msg._id ? null : msg._id))}
                          className="text-slate-400 hover:text-cyan-400 p-1"
                        >
                          <SmileIcon className="w-4 h-4" />
                        </button>

                        <button
                          title="Reply"
                          onClick={() => setReplyingTo(msg)}
                          className="text-slate-400 hover:text-cyan-400 p-1"
                        >
                          <ReplyIcon className="w-4 h-4" />
                        </button>

                        {isSentByMe && (
                          <button
                            title="Edit"
                            onClick={() => setEditingMessage(msg)}
                            className="text-slate-400 hover:text-amber-400 p-1"
                          >
                            <Edit3Icon className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          title="More options"
                          onClick={() => setActiveMenuId((prev) => (prev === msg._id ? null : msg._id))}
                          className="text-slate-400 hover:text-slate-200 p-1"
                        >
                          <MoreVerticalIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* EMOJI REACTION POPUP */}
                    {activeReactionPickerId === msg._id && (
                      <div
                        className={`absolute -top-12 z-30 bg-slate-800 border border-slate-700 rounded-full px-3 py-1.5 flex gap-2 shadow-xl ${
                          isSentByMe ? "right-0" : "left-0"
                        }`}
                      >
                        {QUICK_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              reactToMessage(msg._id, emoji);
                              setActiveReactionPickerId(null);
                            }}
                            className="hover:scale-125 transition-transform text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* MORE OPTIONS MENU */}
                    {activeMenuId === msg._id && (
                      <div
                        className={`absolute top-6 z-30 bg-slate-800 border border-slate-700 rounded-xl p-1.5 shadow-xl text-xs w-40 space-y-1 ${
                          isSentByMe ? "right-0" : "left-0"
                        }`}
                      >
                        <button
                          onClick={() => {
                            deleteMessage(msg._id, "me");
                            setActiveMenuId(null);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-slate-700 rounded-lg text-slate-300 flex items-center gap-2"
                        >
                          <Trash2Icon className="w-3.5 h-3.5 text-rose-400" /> Delete for me
                        </button>

                        {isSentByMe && !msg.isDeletedForEveryone && (
                          <button
                            onClick={() => {
                              deleteMessage(msg._id, "everyone");
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-700 rounded-lg text-rose-400 flex items-center gap-2"
                          >
                            <Trash2Icon className="w-3.5 h-3.5" /> Delete for everyone
                          </button>
                        )}
                      </div>
                    )}

                    {/* MESSAGE BUBBLE */}
                    <div
                      className={`chat-bubble relative ${
                        isSentByMe ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-200"
                      }`}
                    >
                      {/* QUOTED REPLY PREVIEW */}
                      {msg.replyTo && (
                        <div className="mb-2 p-2 rounded bg-black/20 border-l-2 border-cyan-400 text-xs">
                          <span className="font-semibold text-cyan-300 block mb-0.5">Replying to</span>
                          <p className="opacity-90 truncate">{msg.replyTo.text || "Shared image"}</p>
                        </div>
                      )}

                      {/* IMAGE CONTENT */}
                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="Shared"
                          className="rounded-lg h-48 object-cover mb-1"
                        />
                      )}

                      {/* TEXT CONTENT */}
                      {msg.isDeletedForEveryone ? (
                        <p className="italic opacity-60 text-sm flex items-center gap-1">
                          🚫 {msg.text}
                        </p>
                      ) : (
                        <p className="break-words">
                          {msg.text}
                          {msg.isEdited && (
                            <span className="text-[10px] opacity-60 ml-1.5">(edited)</span>
                          )}
                        </p>
                      )}

                      {/* FOOTER: TIME + READ RECEIPTS */}
                      <div className="flex items-center justify-end gap-1 text-[10px] opacity-75 mt-1">
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                        {isSentByMe && !msg.isDeletedForEveryone && (
                          <span className="ml-1">
                            {msg.isRead ? (
                              <CheckCheckIcon className="w-3.5 h-3.5 text-cyan-200" />
                            ) : (
                              <CheckCheckIcon className="w-3.5 h-3.5 opacity-60" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* REACTIONS DISPLAY BADGES */}
                    {Object.keys(reactionCounts).length > 0 && (
                      <div
                        className={`flex gap-1 mt-1 ${
                          isSentByMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        {Object.entries(reactionCounts).map(([emoji, count]) => (
                          <span
                            key={emoji}
                            className="inline-flex items-center gap-1 bg-slate-800/90 border border-slate-700 text-xs rounded-full px-2 py-0.5 shadow-sm text-slate-200"
                          >
                            <span>{emoji}</span>
                            {count > 1 && <span className="text-[10px] font-bold">{count}</span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messageEndRef} />
          </div>
        ) : isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : (
          <NoChatHistoryPlaceholder name={selectedUser.fullname} />
        )}
      </div>

      <MessageInput />
    </>
  );
}

export default ChatContainer;