import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";

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
    const { name, repoUrl, liveUrl, description } = req.body;

    if (
      typeof name !== "string" ||
      typeof repoUrl !== "string" ||
      typeof description !== "string" ||
      !name.trim() ||
      !repoUrl.trim() ||
      !description.trim() ||
      (liveUrl !== undefined && liveUrl !== null && typeof liveUrl !== "string")
    ) {
      return res.status(400).json({
        success: false,
        message: "Project name, repository URL, and description are required.",
      });
    }

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
