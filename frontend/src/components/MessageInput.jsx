import { useRef, useState, useEffect } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import { ImageIcon, SendIcon, XIcon, SmileIcon, CornerDownRightIcon, Edit3Icon } from "lucide-react";

const COMMON_EMOJIS = ["😀", "😂", "😍", "🔥", "👍", "❤️", "🎉", "😮", "😢", "🙌", "💯", "✨", "😊", "😎", "🚀", "🙏", "👏", "🥳", "👀", "💪"];

function MessageInput() {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const {
    sendMessage,
    editMessage,
    selectedUser,
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    sendTyping,
    sendStopTyping,
    isSoundEnabled,
  } = useChatStore();

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text || "");
    } else {
      setText("");
    }
  }, [editingMessage]);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    if (isSoundEnabled) playRandomKeyStrokeSound();

    if (selectedUser) {
      sendTyping(selectedUser._id);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendStopTyping(selectedUser._id);
      }, 1500);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (isSoundEnabled) playRandomKeyStrokeSound();

    if (selectedUser) {
      sendStopTyping(selectedUser._id);
    }

    if (editingMessage) {
      editMessage(editingMessage._id, text.trim());
      setEditingMessage(null);
    } else {
      sendMessage({
        text: text.trim(),
        image: imagePreview,
      });
    }

    setText("");
    setImagePreview(null);
    setShowEmojiPicker(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="p-4 border-t border-slate-700/50 relative">
      {/* EMOJI PICKER POPOVER */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-6 bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl z-50 w-64 grid grid-cols-5 gap-2">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => addEmoji(emoji)}
              className="text-xl hover:bg-slate-700 rounded-lg p-1.5 transition-colors text-center"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* REPLY BANNER */}
      {replyingTo && (
        <div className="max-w-3xl mx-auto mb-3 bg-slate-800/80 border-l-4 border-cyan-500 rounded-r-lg p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden text-sm">
            <CornerDownRightIcon className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="truncate">
              <span className="text-cyan-400 font-medium text-xs block">Replying to message</span>
              <span className="text-slate-300 truncate block">
                {replyingTo.text || (replyingTo.image ? "📷 Shared image" : "")}
              </span>
            </div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-slate-400 hover:text-slate-200 p-1"
            type="button"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* EDIT BANNER */}
      {editingMessage && (
        <div className="max-w-3xl mx-auto mb-3 bg-slate-800/80 border-l-4 border-amber-500 rounded-r-lg p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden text-sm">
            <Edit3Icon className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="truncate">
              <span className="text-amber-400 font-medium text-xs block">Editing message</span>
              <span className="text-slate-300 truncate block">{editingMessage.text}</span>
            </div>
          </div>
          <button
            onClick={() => setEditingMessage(null)}
            className="text-slate-400 hover:text-slate-200 p-1"
            type="button"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* IMAGE PREVIEW */}
      {imagePreview && (
        <div className="max-w-3xl mx-auto mb-3 flex items-center">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-slate-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 hover:bg-slate-700"
              type="button"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* FORM INPUT BAR */}
      <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex items-center space-x-3">
        <button
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          className={`bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded-lg p-2.5 transition-colors ${
            showEmojiPicker ? "text-cyan-400 bg-slate-800" : ""
          }`}
        >
          <SmileIcon className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg py-2.5 px-4 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
          placeholder={editingMessage ? "Edit message..." : "Type a message..."}
        />

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />

        {!editingMessage && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg p-2.5 transition-colors ${
              imagePreview ? "text-cyan-400" : ""
            }`}
          >
            <ImageIcon className="w-5 h-5" />
          </button>
        )}

        <button
          type="submit"
          disabled={!text.trim() && !imagePreview}
          className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg px-4 py-2.5 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
export default MessageInput;