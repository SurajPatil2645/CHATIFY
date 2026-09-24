import Message from '../models/Message.js';
import User from '../models/User.js';
import cloudinary from "../lib/cloudinary.js";
import { io, getReceiverSocketId } from '../lib/socket.js';

export const getAllContacts = async (req, res) => {
    try {
        const loggedInUserId = req.user.id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select('-password');
        res.status(200).json(filteredUsers);
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getMessagesByUserId = async (req, res) => {
    try {
        const myId = req.user.id;
        const { id: otherUserId } = req.params;

        // Auto-mark incoming unread messages as read
        await Message.updateMany(
            { senderId: otherUserId, receiverId: myId, isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
        );

        // Notify the sender that messages have been read
        const senderSocketId = getReceiverSocketId(otherUserId);
        if (senderSocketId) {
            io.to(senderSocketId).emit("messagesRead", { senderId: otherUserId, receiverId: myId });
        }

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: myId }
            ],
            deletedFor: { $ne: myId }
        })
        .populate({
            path: 'replyTo',
            select: 'text image senderId'
        })
        .sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, image, replyTo } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user.id;

        if (!text?.trim() && !image) {
            return res.status(400).json({
                message: "Message text or image is required"
            });
        }

        if (senderId === receiverId) {
            return res.status(400).json({
                message: "You cannot send a message to yourself"
            });
        }

        const receiver = await User.findById(receiverId);

        if (!receiver) {
            return res.status(404).json({
                message: "Receiver not found"
            });
        }

        let imageUrl;

        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text: text?.trim() || "",
            image: imageUrl || null,
            replyTo: replyTo || null,
        });

        await newMessage.save();

        if (replyTo) {
            await newMessage.populate({ path: 'replyTo', select: 'text image senderId' });
        }

        // Send message in real time
        const receiverSocketId = getReceiverSocketId(receiverId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);

    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const myId = req.user.id;
        const { id: senderId } = req.params;

        await Message.updateMany(
            { senderId, receiverId: myId, isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
        );

        const senderSocketId = getReceiverSocketId(senderId);
        if (senderSocketId) {
            io.to(senderSocketId).emit("messagesRead", { senderId, receiverId: myId });
        }

        res.status(200).json({ message: "Messages marked as read" });
    } catch (error) {
        console.error("Error marking messages as read:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const reactToMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user.id;

        if (!emoji) {
            return res.status(400).json({ message: "Emoji is required" });
        }

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        const existingReactionIndex = message.reactions.findIndex(
            (r) => r.userId.toString() === userId
        );

        if (existingReactionIndex > -1) {
            if (message.reactions[existingReactionIndex].emoji === emoji) {
                // Remove reaction if same emoji selected again (toggle off)
                message.reactions.splice(existingReactionIndex, 1);
            } else {
                // Change reaction emoji
                message.reactions[existingReactionIndex].emoji = emoji;
            }
        } else {
            // Add new reaction
            message.reactions.push({ userId, emoji });
        }

        await message.save();

        const populatedMessage = await Message.findById(messageId).populate({
            path: 'replyTo',
            select: 'text image senderId'
        });

        // Notify both parties
        const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
        const senderSocketId = getReceiverSocketId(message.senderId.toString());

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageReaction", populatedMessage);
        }
        if (senderSocketId && senderSocketId !== receiverSocketId) {
            io.to(senderSocketId).emit("messageReaction", populatedMessage);
        }

        res.status(200).json(populatedMessage);
    } catch (error) {
        console.error("Error reacting to message:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const editMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const { text } = req.body;
        const userId = req.user.id;

        if (!text?.trim()) {
            return res.status(400).json({ message: "Text cannot be empty" });
        }

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        if (message.senderId.toString() !== userId) {
            return res.status(403).json({ message: "You can only edit your own messages" });
        }

        message.text = text.trim();
        message.isEdited = true;
        await message.save();

        const populatedMessage = await Message.findById(messageId).populate({
            path: 'replyTo',
            select: 'text image senderId'
        });

        const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageEdited", populatedMessage);
        }

        res.status(200).json(populatedMessage);
    } catch (error) {
        console.error("Error editing message:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const { deleteType } = req.body; // "me" | "everyone"
        const userId = req.user.id;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        if (deleteType === "everyone") {
            if (message.senderId.toString() !== userId) {
                return res.status(403).json({ message: "You can only delete your own messages for everyone" });
            }

            message.isDeletedForEveryone = true;
            message.text = "This message was deleted";
            message.image = null;
            await message.save();

            const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("messageDeleted", { messageId, deleteType: "everyone" });
            }
        } else {
            // Delete for me
            if (!message.deletedFor.includes(userId)) {
                message.deletedFor.push(userId);
                await message.save();
            }
        }

        res.status(200).json({ messageId, deleteType });
    } catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getChatPartners = async (req, res) => {
    try {
        const loggedInUserId = req.user.id;

        const messages = await Message.find({
            $or: [
                { senderId: loggedInUserId },
                { receiverId: loggedInUserId }
            ]
        });

        const chatPartenerIds = [
            ...new Set(
                messages.map((message) =>
                    message.senderId.toString() === loggedInUserId ? message.receiverId.toString() : message.senderId.toString()
                ),
            )
        ];

        const chatPartners = await User.find({ _id: { $in: chatPartenerIds } }).select('-password');

        res.status(200).json(chatPartners);
    } catch (error) {
        console.error('Error fetching chat partners:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};