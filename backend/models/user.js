import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: {
        type: String,
        required: function() {
            return !this.googleId;
        }
    },
    name: {
        type: String,
        required: function() {
            return !this.googleId;
        }
    },
    googleId: { type: String, default: null },
    isAdmin: { type: Boolean, default: false },
    isConfirmed: { type: Boolean, default: false },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
}, { timestamps: true });

// Pre-save hook to set isConfirmed to true if googleId is present
userSchema.pre('save', function(next) {
    if (this.googleId) {
        this.isConfirmed = true;
    }
    next();
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
