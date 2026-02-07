import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const getMyProgress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const progress = await prisma.progress.findMany({
      where: { userId },
      include: {
        lesson: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastViewed: 'desc',
      },
    });

    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

export const markLessonComplete = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { lessonId } = req.params;
    const lessonIdNum = parseInt(lessonId);

    if (isNaN(lessonIdNum)) {
      throw new AppError('Invalid lesson ID', 400);
    }

    const userId = req.user!.id;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonIdNum },
    });

    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new AppError('Not enrolled in this course', 403);
    }

    const progress = await prisma.progress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId: lessonIdNum,
        },
      },
      update: {
        completed: true,
        completedAt: new Date(),
        lastViewed: new Date(),
      },
      create: {
        userId,
        lessonId: lessonIdNum,
        completed: true,
        completedAt: new Date(),
        lastViewed: new Date(),
      },
    });

    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLastViewed = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { lessonId } = req.params;
    const lessonIdNum = parseInt(lessonId);

    if (isNaN(lessonIdNum)) {
      throw new AppError('Invalid lesson ID', 400);
    }

    const userId = req.user!.id;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonIdNum },
    });

    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new AppError('Not enrolled in this course', 403);
    }

    const progress = await prisma.progress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId: lessonIdNum,
        },
      },
      update: {
        lastViewed: new Date(),
      },
      create: {
        userId,
        lessonId: lessonIdNum,
        lastViewed: new Date(),
      },
    });

    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};
