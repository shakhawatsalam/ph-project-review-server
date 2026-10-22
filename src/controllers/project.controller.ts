import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { z } from "zod";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: "STUDENT" | "MENTOR";
  };
}
// create-project
export async function createProject(req: AuthenticatedRequest, res: Response) {
  const studentId = req.user?.id;

  if (!studentId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }
  try {

    const projectSchema = z.object({
      name: z.string().trim().min(1, "Project name is required."),
      repoUrl: z.string().trim().url("Enter a valid repository URL."),
      liveUrl: z
        .union([
          z.string().trim().url("Enter a valid live URL."),
          z.literal(""),
        ])
        .nullish(),
      description: z.string().trim().min(1, "Description is required."),
    });

    const validation = projectSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid project submission.",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const { name, repoUrl, liveUrl, description } = validation.data;

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        repoUrl: repoUrl.trim(),
        liveUrl:
          typeof liveUrl === "string" && liveUrl.trim() ? liveUrl.trim() : null,
        description: description.trim(),
        studentId,
      },
      select: {
        id: true,
        name: true,
        repoUrl: true,
        liveUrl: true,
        description: true,
        status: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Project submitted successfully.",
      data: project,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted a project.",
      });
    }

    console.error("Create project error:", error);

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred.",
    });
  }
}

// get-my-project
export async function getMyProject(req: AuthenticatedRequest, res: Response) {
  try {
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const project = await prisma.project.findUnique({
      where: { studentId },
      select: {
        id: true,
        name: true,
        repoUrl: true,
        liveUrl: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        reviewedAt: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "You have not submitted a project yet.",
      });
    }

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("Get my project error:", error);

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred.",
    });
  }
}
