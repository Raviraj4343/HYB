import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    request: {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Request",
        required : true
    },
    participants : {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            }
        ],
        validate: {
            validator: function(value){
                return (
            Array.isArray(value) &&
            value.length === 2 &&
            value[0].toString() !== value[1].toString()
                 );
            },
            message:"Chat must have exactly 2 participants"
        }
    }
}, {timestamps : true});

// Ensure participants order is normalized so the unique index on {request, participants}
// works irrespective of the order callers provide the participant ids.
chatSchema.pre('validate', function (next) {
    try {
        if (Array.isArray(this.participants)) {
            this.participants = this.participants
                .map((p) => (p && p._id ? p._id.toString() : p?.toString?.()))
                .filter(Boolean)
                .map((s) => mongoose.Types.ObjectId(s))
                .sort((a, b) => (a.toString() > b.toString() ? 1 : -1));
        }
    } catch (err) {
        // ignore and continue; validation will catch issues
    }
    next();
});

chatSchema.index(
  { request: 1, participants: 1 },
  { unique: true }
);

chatSchema.index({request : 1});
chatSchema.index({participants : 1});

export const Chat = mongoose.model("Chat", chatSchema);