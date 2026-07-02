import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models";
import { requireRole, hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authErr = requireRole(req, ["admin"]);
  if (authErr) return authErr;

  try {
    await connectDB();
    const users = await UserModel.find({}, { passwordHash: 0 }).sort({ createdAt: -1 });
    return NextResponse.json(users);
  } catch (err) {
    console.error("[GET /api/admin/users]", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authErr = requireRole(req, ["admin"]);
  if (authErr) return authErr;

  try {
    const { username, email, password, role } = await req.json();

    if (!username || !email || !password || !role) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    await connectDB();

    // Check if username already exists (case-insensitive)
    const existingUsername = await UserModel.findOne({
      username: { $regex: new RegExp(`^${escapeRegex(username.trim())}$`, "i") }
    });
    if (existingUsername) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
    }

    // Check if email already exists
    const existingEmail = await UserModel.findOne({
      email: { $regex: new RegExp(`^${escapeRegex(email.trim())}$`, "i") }
    });
    if (existingEmail) {
      return NextResponse.json({ error: "Email is already in use" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await UserModel.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hashedPassword,
      role,
      isActive: true,
    });

    const userObj = newUser.toObject();
    delete userObj.passwordHash;

    return NextResponse.json(userObj, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/users]", err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
