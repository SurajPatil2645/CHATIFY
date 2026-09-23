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

        const message = await Message.find({
            $or: [
                { senderId: myId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: myId }
            ]
        }).sort({ createdAt: 1 });

        res.status(200).json(message);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
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
            image: imageUrl || null
        });

        await newMessage.save();

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

export const getChatPartners = async (req, res) => {
    try {
        const loggedInUserId = req.user.id;

        // find all the messages where the logged in user is either the sender or the receiver
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