import mongoose from "mongoose";

const {Schema, model} = mongoose;

const userSchema = new Schema({
    firstName: {
        type: String, 
        required: true, 
        trim: true,
        minlength: [2, 'First name must be at least 2 characters']
    },
    lastName: {type: String, required: false, trim: true},
    email: {
        type: String, 
        required: true, 
        unique: true, 
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
    },
    password: {
        type: String, 
        required: true,
        minlength: [6, 'Password must be at least 6 characters']
    },
    role: {type: String, required: true, enum: ['admin', 'manager', 'accountant', 'mechanic', 'receptionist', 'workshop', 'user'], default: 'user'},
    mustChangePassword: {type: Boolean, default: true},
    profilePicture: {type: String},
    profilePicturePublicId: {type: String},
    phone: {type: String, trim: true},
});

const User = model("User", userSchema);

export default User;