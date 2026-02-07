import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const queryChatbot = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { query, scope, lessonId, courseId } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new AppError('Query is required', 400);
    }

    if (!scope || !['lesson', 'course'].includes(scope)) {
      throw new AppError('Invalid scope. Must be "lesson" or "course"', 400);
    }

    const userId = req.user!.id;
    let validatedLessonId: number | null = null;
    let validatedCourseId: number | null = null;

    if (scope === 'lesson') {
      if (!lessonId) {
        throw new AppError('Lesson ID is required for lesson scope', 400);
      }

      const lesson = await prisma.lesson.findUnique({
        where: { id: parseInt(lessonId) },
        include: { course: true },
      });

      if (!lesson) {
        throw new AppError('Lesson not found', 404);
      }

      const isAdmin = req.user?.role === 'ADMIN';
      if (!isAdmin) {
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
      }

      validatedLessonId = lesson.id;
      validatedCourseId = lesson.courseId;
    } else if (scope === 'course') {
      if (!courseId) {
        throw new AppError('Course ID is required for course scope', 400);
      }

      const course = await prisma.course.findUnique({
        where: { id: parseInt(courseId) },
      });

      if (!course) {
        throw new AppError('Course not found', 404);
      }

      const isAdmin = req.user?.role === 'ADMIN';
      if (!isAdmin) {
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId: course.id,
            },
          },
        });

        if (!enrollment) {
          throw new AppError('Not enrolled in this course', 403);
        }
      }

      validatedCourseId = course.id;
    }

    const enrolledCourses = await prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true },
    });

    const enrolledCourseIds = enrolledCourses.map(e => e.courseId);

    let aiResponse;
    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/chat/query`,
        {
          query,
          scope,
          lessonId: validatedLessonId,
          courseId: validatedCourseId,
          userId,
          enrolledCourseIds,
        },
        {
          timeout: 30000,
        }
      );

      aiResponse = response.data;
    } catch (aiError: any) {
      console.error('AI service error:', aiError.message);
      throw new AppError('Failed to get response from AI service', 503);
    }

    const chatHistory = await prisma.chatHistory.create({
      data: {
        userId,
        lessonId: validatedLessonId,
        courseId: validatedCourseId,
        scope,
        query: query.trim(),
        response: aiResponse.response || '',
        sources: aiResponse.sources || null,
      },
    });

    res.json({
      success: true,
      data: {
        id: chatHistory.id,
        query: chatHistory.query,
        response: chatHistory.response,
        sources: chatHistory.sources,
        createdAt: chatHistory.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getChatHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { lessonId } = req.params;
    const { scope, courseId } = req.query;

    const userId = req.user!.id;

    if (!scope || !['lesson', 'course'].includes(scope as string)) {
      throw new AppError('Invalid scope parameter. Must be "lesson" or "course"', 400);
    }

    let whereCondition: any = {
      userId,
      scope: scope as string,
    };

    if (scope === 'lesson') {
      if (!lessonId) {
        throw new AppError('Lesson ID is required for lesson scope', 400);
      }

      const lesson = await prisma.lesson.findUnique({
        where: { id: parseInt(lessonId) },
      });

      if (!lesson) {
        throw new AppError('Lesson not found', 404);
      }

      const isAdmin = req.user?.role === 'ADMIN';
      if (!isAdmin) {
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
      }

      whereCondition.lessonId = parseInt(lessonId);
    } else if (scope === 'course') {
      if (!courseId) {
        throw new AppError('Course ID is required for course scope', 400);
      }

      const course = await prisma.course.findUnique({
        where: { id: parseInt(courseId as string) },
      });

      if (!course) {
        throw new AppError('Course not found', 404);
      }

      const isAdmin = req.user?.role === 'ADMIN';
      if (!isAdmin) {
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId: course.id,
            },
          },
        });

        if (!enrollment) {
          throw new AppError('Not enrolled in this course', 403);
        }
      }

      whereCondition.courseId = parseInt(courseId as string);
    }

    const history = await prisma.chatHistory.findMany({
      where: whereCondition,
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        query: true,
        response: true,
        sources: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};
