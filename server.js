// Cài đặt dotenv: npm install dotenv [cite: 337]
require("dotenv").config(); 
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Kết nối MongoDB sử dụng biến môi trường [cite: 347]
const mongoURI = process.env.MONGO_URI;

mongoose
    .connect(mongoURI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB Error:", err));

// Định nghĩa Schema
const UserSchema = new mongoose.Schema({ 
    name: {
        type: String,
        required: [true, 'Tên không được để trống'],
        minlength: [2, 'Tên phải có ít nhất 2 ký tự']
    },
    age: {
        type: Number,
        required: [true, 'Tuổi không được để trống'],
        min: [0, 'Tuổi phải >= 0'],
        validate: {
            validator: Number.isInteger,
            message: "Tuổi phải là số nguyên"
        }
    },
    email: {
        type: String,
        required: [true, 'Email không được để trống'],
        unique: true,
        match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
    },
    address: {
        type: String
    }
});
const User = mongoose.model("User", UserSchema);

// API Endpoints
app.get("/api/users", async (req, res) => { 
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const search = req.query.search || "";
        
        const filter = search
            ? {
            $or: [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { address: { $regex: search, $options: "i" } }
            ]
            }
        : {};
        
        const skip = (page - 1) * limit;
        
        const [users, total] = await Promise.all([
            User.find(filter).skip(skip).limit(limit),
            User.countDocuments(filter)
        ]);

        // Tính toán totalPages để tránh lỗi undefined
        const totalPages = Math.ceil(total / limit);

        res.json({
            page,
            limit,
            total,
            totalPages,
            data: users
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/users", async (req, res) => { 
    try {
        const { name, age, email, address } = req.body;
        const newUser = await User.create({ name, age, email, address });
        res.status(201).json({
            message: "Tạo người dùng thành công",
            data: newUser
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put("/api/users/:id", async (req, res) => { 
    try {
        const { id } = req.params;
        const { name, age, email, address } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { name, age, email, address },
            { new: true, runValidators: true }
        );
        if (!updatedUser) {
            return res.status(404).json({ error: "Không tìm thấy người dùng" });
        }
        res.json({
            message: "Cập nhật người dùng thành công",
            data: updatedUser
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete("/api/users/:id", async (req, res) => { 
    try {
        const { id } = req.params;
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
            return res.status(404).json({ error: "Không tìm thấy người dùng" });
        }
        res.json({ message: "Xóa người dùng thành công" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Start server với cổng từ biến môi trường [cite: 350]
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});