import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const getAllCourses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const isAdmin = req.user?.role === 'ADMIN';
    
    const courses = await prisma.course.findMany({
      where: isAdmin ? {} : { isPublished: true },
      include: {
        _count: {
          select: {
            lessons: true,
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const courseId = parseInt(id);

    if (isNaN(courseId)) {
      throw new AppError('Invalid course ID', 400);
    }

    const isAdmin = req.user?.role === 'ADMIN';
    
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          orderBy: {
            order: 'asc',
          },
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    // If not published and user is not admin, deny access
    if (!course.isPublished && !isAdmin) {
      throw new AppError('Course not found', 404);
    }

    res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

export const createCourse = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, description, thumbnailUrl, instructorId, isPublished } = req.body;

    if (!title || !description) {
      throw new AppError('Title and description are required', 400);
    }

    if (!instructorId) {
      throw new AppError('Instructor ID is required', 400);
    }

    // Verify instructor exists
    const instructor = await prisma.user.findUnique({
      where: { id: instructorId },
    });

    if (!instructor) {
      throw new AppError('Instructor not found', 404);
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        thumbnailUrl,
        instructorId,
        isPublished: isPublished || false,
      },
      include: {
        _count: {
          select: {
            lessons: true,
            enrollments: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const courseId = parseInt(id);
    const { title, description, thumbnailUrl, instructorId, isPublished } = req.body;

    if (isNaN(courseId)) {
      throw new AppError('Invalid course ID', 400);
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    // If updating instructor, verify they exist
    if (instructorId !== undefined) {
      const instructor = await prisma.user.findUnique({
        where: { id: instructorId },
      });

      if (!instructor) {
        throw new AppError('Instructor not found', 404);
      }
    }

    const updateData: {
      title?: string;
      description?: string;
      thumbnailUrl?: string | null;
      instructorId?: number;
      isPublished?: boolean;
    } = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
    if (instructorId !== undefined) updateData.instructorId = instructorId;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: updateData,
      include: {
        _count: {
          select: {
            lessons: true,
            enrollments: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedCourse,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const courseId = parseInt(id);

    if (isNaN(courseId)) {
      throw new AppError('Invalid course ID', 400);
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    await prisma.course.delete({
      where: { id: courseId },
    });

    res.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const enrollCourse = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const courseId = parseInt(id);

    if (isNaN(courseId)) {
      throw new AppError('Invalid course ID', 400);
    }

    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    // Check if course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    if (!course.isPublished) {
      throw new AppError('Course is not available for enrollment', 400);
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: req.user.id,
          courseId: courseId,
        },
      },
    });

    if (existingEnrollment) {
      throw new AppError('Already enrolled in this course', 409);
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: req.user.id,
        courseId: courseId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnailUrl: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
};
