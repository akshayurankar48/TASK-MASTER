import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models";
import { signToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { handleApiError, unauthorized } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw unauthorized("Invalid email or password");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw unauthorized("Invalid email or password");
    }

    const token = signToken({ userId: user._id.toString(), email: user.email });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
        token,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
