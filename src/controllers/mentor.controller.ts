import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";

// get-all-project

export async function getAllProjects(req: Request, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const status = req.query.status;

    if (
      status !== undefined &&
      status !== "PENDING" &&
      status !== "APPROVED" &&
      status !== "REJECTED"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid project status filter.",
      });
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: status ? { status } : {},
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          repoUrl: true,
          liveUrl: true,
          description: true,
          status: true,
          createdAt: true,
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.project.count({
        where: status ? { status } : {},
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all projects error:", error);

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred.",
    });
  }
}

// review-project

export async function reviewProject(req: Request, res: Response) {
  const { status } = req.body;

  if (status !== "APPROVED" && status !== "REJECTED") {
    return res.status(400).json({
      success: false,
      message: "Status must be APPROVED or REJECTED.",
    });
  }

  try {
    const projectId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const mentorId = (
      req as Request & {
        user?: { id: string; role: "STUDENT" | "MENTOR" };
      }
    ).user?.id;

    if (!mentorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }
    const { status } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required.",
      });
    }

    const updated = await prisma.project.updateMany({
      where: {
        id: projectId,
        status: "PENDING",
      },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedById: mentorId,
      },
    });

    if (updated.count === 0) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, status: true },
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found.",
        });
      }

      return res.status(409).json({
        success: false,
        message: "This project has already been reviewed.",
      });
    }

    const updatedProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        status: true,
        reviewedAt: true,
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Project ${status.toLowerCase()} successfully.`,
      data: updatedProject,
    });
  } catch (error) {
    console.error("Review project error:", error);

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred.",
    });
  }
}

// statistics
export async function getMentorStats(_req: Request, res: Response) {
  try {
    const [total, pending, approved, rejected] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { status: "PENDING" } }),
      prisma.project.count({ where: { status: "APPROVED" } }),
      prisma.project.count({ where: { status: "REJECTED" } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected,
      },
    });
  } catch (error) {
    console.error("Get mentor stats error:", error);

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred.",
    });
  }
}
