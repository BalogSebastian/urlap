import mongoose, { Schema, models } from "mongoose";

const AdminUserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const AdminUser = models.AdminUser || mongoose.model("AdminUser", AdminUserSchema);

export default AdminUser;

