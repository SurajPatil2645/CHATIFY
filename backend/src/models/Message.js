import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        emoji: {
            type: String,
            required: true,
        },
    },
    { _id: false }
);

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        text: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: "",
        },
        image: {
            type: String,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: {
            type: Date,
        },
        reactions: [reactionSchema],
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
            default: null,
        },
        isEdited: {
            type: Boolean,
            default: false,
        },
        isDeletedForEveryone: {
            type: Boolean,
            default: false,
        },
        deletedFor: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            }
        ],
    },
    { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);
export default Message;