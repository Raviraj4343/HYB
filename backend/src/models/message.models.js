import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    chat : {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'Chat',
        required : true,
    },
    sender: {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    content: {
        type : String,
        trim : true,
        required: function () {
       return !this.isDeleted && !this.image;
        }
    },
    image: {
        type : String,
        default: null
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isDeleted:{
        type:Boolean,
        default:false
    },
    deletedAt: {
        type:Date,
        default:null
    }
}, {timestamps : true});


messageSchema.index({chat : 1, createdAt: -1});
messageSchema.index({sender: 1});
export const Message = mongoose.model("Message", messageSchema);
