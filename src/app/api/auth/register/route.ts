import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models";
import { signToken } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, password } = registerSchema.parse(body);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Email already registered",
            code: "CONFLICT",
          },
        },
        { status: 409 }
      );
    }

    const user = await User.create({ name, email, password });

    const token = signToken({ userId: user._id.toString(), email: user.email });

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
