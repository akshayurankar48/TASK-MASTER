import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models";
import { getAuthUser } from "@/lib/auth";
import { handleApiError, unauthorized } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const authUser = getAuthUser(request);
    if (!authUser) {
      throw unauthorized();
    }

    const user = await User.findById(authUser.userId);
    if (!user) {
      throw unauthorized("User not found");
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
