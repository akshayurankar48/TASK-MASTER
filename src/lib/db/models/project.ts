import mongoose, { Schema } from "mongoose";
import { IProject } from "@/types";

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      maxlength: [200, "Project name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
projectSchema.index({ owner: 1 });
projectSchema.index({ members: 1 });

export const Project =
  mongoose.models.Project ||
  mongoose.model<IProject>("Project", projectSchema);
