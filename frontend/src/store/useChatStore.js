import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  typingUsers: {},
  replyingTo: null,
  editingMessage: null,
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => set({ selectedUser, replyingTo: null, editingMessage: null }),
  setReplyingTo: (message) => set({ replyingTo: message, editingMessage: null }),
  setEditingMessage: (message) => set({ editingMessage: message, replyingTo: null }),

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch contacts");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch chats");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages, replyingTo } = get();
    const { authUser } = useAuthStore.getState();
    const currentUserId = authUser?._id || authUser?.user?._id;

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      senderId: currentUserId,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      replyTo: replyingTo ? { _id: replyingTo._id, text: replyingTo.text, image: replyingTo.image, senderId: replyingTo.senderId } : null,
      isRead: false,
      reactions: [],
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    set({ messages: [...messages, optimisticMessage], replyingTo: null });

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, {
        ...messageData,
        replyTo: replyingTo?._id || null,
      });
      set({ messages: messages.concat(res.data) });
    } catch (error) {
      set({ messages });
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  editMessage: async (messageId, text) => {
    const { messages } = get();
    try {
      const res = await axiosInstance.put(`/messages/edit/${messageId}`, { text });
      set({
        messages: messages.map((m) => (m._id === messageId ? res.data : m)),
        editingMessage: null,
      });
      toast.success("Message edited");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to edit message");
    }
  },

  deleteMessage: async (messageId, deleteType) => {
    const { messages } = get();
    try {
      await axiosInstance.delete(`/messages/delete/${messageId}`, { data: { deleteType } });

      if (deleteType === "everyone") {
        set({
          messages: messages.map((m) =>
            m._id === messageId
              ? { ...m, isDeletedForEveryone: true, text: "This message was deleted", image: null }
              : m
          ),
        });
      } else {
        set({
          messages: messages.filter((m) => m._id !== messageId),
        });
      }
      toast.success("Message deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  reactToMessage: async (messageId, emoji) => {
    const { messages } = get();
    try {
      const res = await axiosInstance.put(`/messages/react/${messageId}`, { emoji });
      set({
        messages: messages.map((m) => (m._id === messageId ? res.data : m)),
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add reaction");
    }
  },

  sendTyping: (receiverId) => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.emit("typing", { receiverId });
    }
  },

  sendStopTyping: (receiverId) => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.emit("stopTyping", { receiverId });
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, isSoundEnabled } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Clean up existing listeners
    socket.off("newMessage");
    socket.off("userTyping");
    socket.off("userStoppedTyping");
    socket.off("messagesRead");
    socket.off("messageReaction");
    socket.off("messageEdited");
    socket.off("messageDeleted");

    socket.on("newMessage", (newMessage) => {
      const senderId = String(newMessage.senderId?._id || newMessage.senderId || "");
      const isMessageSentFromSelectedUser = senderId === String(selectedUser._id);

      if (!isMessageSentFromSelectedUser) return;

      set((state) => ({
        messages: [...state.messages, newMessage],
      }));

      if (isSoundEnabled) {
        const notificationSound = new Audio("/sounds/notification.mp3");
        notificationSound.currentTime = 0;
        notificationSound.play().catch((e) => console.log("Audio play failed:", e));
      }
    });

    socket.on("userTyping", ({ senderId }) => {
      if (String(senderId) === String(selectedUser._id)) {
        set((state) => ({
          typingUsers: { ...state.typingUsers, [senderId]: true },
        }));
      }
    });

    socket.on("userStoppedTyping", ({ senderId }) => {
      if (String(senderId) === String(selectedUser._id)) {
        set((state) => ({
          typingUsers: { ...state.typingUsers, [senderId]: false },
        }));
      }
    });

    socket.on("messagesRead", ({ receiverId }) => {
      if (String(receiverId) === String(selectedUser._id)) {
        set((state) => ({
          messages: state.messages.map((m) => ({ ...m, isRead: true })),
        }));
      }
    });

    socket.on("messageReaction", (updatedMessage) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === updatedMessage._id ? updatedMessage : m
        ),
      }));
    });

    socket.on("messageEdited", (updatedMessage) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === updatedMessage._id ? updatedMessage : m
        ),
      }));
    });

    socket.on("messageDeleted", ({ messageId, deleteType }) => {
      if (deleteType === "everyone") {
        set((state) => ({
          messages: state.messages.map((m) =>
            m._id === messageId
              ? { ...m, isDeletedForEveryone: true, text: "This message was deleted", image: null }
              : m
          ),
        }));
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
      socket.off("messagesRead");
      socket.off("messageReaction");
      socket.off("messageEdited");
      socket.off("messageDeleted");
    }
  },
}));