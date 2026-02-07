import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const getLessonsByCourse = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const courseIdNum = parseInt(courseId);

    if (isNaN(courseIdNum)) {
      throw new AppError('Invalid course ID', 400);
    }

    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseIdNum },
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    // Check if user is enrolled or is admin
    const isAdmin = req.user.role === 'ADMIN';
    if (!isAdmin) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: req.user.id,
            courseId: courseIdNum,
          },
        },
      });

      if (!enrollment) {
        throw new AppError('Not enrolled in this course', 403);
      }
    }

    const lessons = await prisma.lesson.findMany({
      where: { courseId: courseIdNum },
      include: {
        _count: {
          select: {
            files: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    res.json({
      success: true,
      data: lessons,
    });
  } catch (error) {
    next(error);
  }
};

export const getLessonById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const lessonId = parseInt(id);

    if (isNaN(lessonId)) {
      throw new AppError('Invalid lesson ID', 400);
    }

    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            isPublished: true,
          },
        },
        files: {
          select: {
            id: true,
            filename: true,
            fileType: true,
            fileSize: true,
            processingStatus: true,
            createdAt: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    // Check if user is enrolled or is admin
    const isAdmin = req.user.role === 'ADMIN';
    if (!isAdmin) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: req.user.id,
            courseId: lesson.courseId,
          },
        },
      });

      if (!enrollment) {
        throw new AppError('Not enrolled in this course', 403);
      }
    }

    res.json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    next(error);
  }
};

export const createLesson = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseId, title, description, order, contentText } = req.body;

    if (!courseId || !title) {
      throw new AppError('Course ID and title are required', 400);
    }

    if (typeof order !== 'number') {
      throw new AppError('Lesson order must be a number', 400);
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    // Check if lesson order already exists
    const existingLesson = await prisma.lesson.findFirst({
      where: {
        courseId: courseId,
        order: order,
      },
    });

    if (existingLesson) {
      throw new AppError('Lesson with this order already exists for this course', 409);
    }

    const lesson = await prisma.lesson.create({
      data: {
        courseId,
        title,
        description,
        order,
        contentText,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLesson = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const lessonId = parseInt(id);
    const { title, description, order, contentText } = req.body;

    if (isNaN(lessonId)) {
      throw new AppError('Invalid lesson ID', 400);
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    // If updating order, check if it conflicts with another lesson
    if (order !== undefined && order !== lesson.order) {
      const existingLesson = await prisma.lesson.findFirst({
        where: {
          courseId: lesson.courseId,
          order: order,
          id: { not: lessonId },
        },
      });

      if (existingLesson) {
        throw new AppError('Lesson with this order already exists for this course', 409);
      }
    }

    const updateData: {
      title?: string;
      description?: string | null;
      order?: number;
      contentText?: string | null;
    } = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (order !== undefined) updateData.order = order;
    if (contentText !== undefined) updateData.contentText = contentText;

    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: updateData,
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedLesson,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLesson = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const lessonId = parseInt(id);

    if (isNaN(lessonId)) {
      throw new AppError('Invalid lesson ID', 400);
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    await prisma.lesson.delete({
      where: { id: lessonId },
    });

    res.json({
      success: true,
      message: 'Lesson deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
