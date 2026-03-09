import mongoose, { Schema } from "mongoose";
import { IComment } from "@/types";

const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
      maxlength: [5000, "Comment cannot exceed 5000 characters"],
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index for fetching comments by task, ordered by creation time
commentSchema.index({ task: 1, createdAt: 1 });

export const Comment =
  mongoose.models.Comment ||
  mongoose.model<IComment>("Comment", commentSchema);
