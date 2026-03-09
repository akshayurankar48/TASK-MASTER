import mongoose, { Schema } from "mongoose";
import { ITask, TASK_STATUS, TASK_PRIORITY } from "@/types";

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [500, "Title cannot exceed 500 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    status: {
      type: String,
      enum: Object.values(TASK_STATUS),
      default: TASK_STATUS.TODO,
    },
    priority: {
      type: String,
      enum: Object.values(TASK_PRIORITY),
      default: TASK_PRIORITY.MEDIUM,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    assignees: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dueDate: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for dashboard performance
taskSchema.index({ project: 1, createdAt: -1 });
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ project: 1, assignees: 1 });
taskSchema.index({ title: "text", description: "text" });

export const Task =
  mongoose.models.Task || mongoose.model<ITask>("Task", taskSchema);
