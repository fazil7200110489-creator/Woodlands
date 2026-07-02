import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models";
import { requireRole, hashPassword, getSessionFromRequest } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only Admin can update other users. Other roles can ONLY update themselves.
  const isUpdatingSelf = session.sub === params.id;
  if (session.role !== "admin" && !isUpdatingSelf) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { username, email, password, role, isActive } = await req.json();
    await connectDB();

    const user = await UserModel.findById(params.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent non-admins from updating role or active status
    if (session.role !== "admin") {
      if (role !== undefined && role !== user.role) {
        return NextResponse.json({ error: "Forbidden: Only admins can change user roles" }, { status: 403 });
      }
      if (isActive !== undefined && isActive !== user.isActive) {
        return NextResponse.json({ error: "Forbidden: Only admins can change user status" }, { status: 403 });
      }
    }

    // Check username duplication
    if (username && username.trim() !== user.username) {
      const existingUsername = await UserModel.findOne({
        username: { $regex: new RegExp(`^${escapeRegex(username.trim())}$`, "i") },
        _id: { $ne: user._id }
      });
      if (existingUsername) {
        return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
      }
      user.username = username.trim();
    }

    // Check email duplication
    if (email && email.trim().toLowerCase() !== user.email) {
      const existingEmail = await UserModel.findOne({
        email: { $regex: new RegExp(`^${escapeRegex(email.trim())}$`, "i") },
        _id: { $ne: user._id }
      });
      if (existingEmail) {
        return NextResponse.json({ error: "Email is already in use" }, { status: 400 });
      }
      user.email = email.trim().toLowerCase();
    }

    // Update role
    if (role) {
      user.role = role;
    }

    // Update active status
    if (typeof isActive === "boolean") {
      user.isActive = isActive;
    }

    // Reset password if provided
    if (password) {
      user.passwordHash = await hashPassword(password);
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.passwordHash;

    return NextResponse.json(userObj);
  } catch (err) {
    console.error("[PATCH /api/admin/users/[id]]", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const authErr = requireRole(req, ["admin"]);
  if (authErr) return authErr;

  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    // Prevent deleting oneself
    if (session.sub === params.id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    const userToDelete = await UserModel.findById(params.id);
    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // "Only Super Admin can delete another Admin"
    // Since only 'admin' role can execute this endpoint, and the caller has role 'admin', they are a Super Admin.
    // However, if the caller is not an 'admin' (which they cannot be due to requireRole), they cannot delete anyone.
    // If the target is an admin, the caller (which is an admin) can delete them.
    if (userToDelete.role === "admin" && session.role !== "admin") {
      return NextResponse.json({ error: "Only administrators can delete another admin" }, { status: 403 });
    }

    await UserModel.findByIdAndDelete(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/users/[id]]", err);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
