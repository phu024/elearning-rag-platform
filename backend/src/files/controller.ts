import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import * as minioUtils from '../utils/minio';
import axios from 'axios';
import { FileType, ProcessingStatus } from '@prisma/client';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const getFileTypeFromExtension = (filename: string): FileType => {
  const ext = filename.toLowerCase().split('.').pop();
  const typeMap: { [key: string]: FileType } = {
    'pdf': FileType.PDF,
    'docx': FileType.DOCX,
    'doc': FileType.DOCX,
    'pptx': FileType.PPTX,
    'ppt': FileType.PPTX,
    'xlsx': FileType.XLSX,
    'xls': FileType.XLSX,
    'txt': FileType.TXT,
    'mp4': FileType.VIDEO,
    'avi': FileType.VIDEO,
    'mov': FileType.VIDEO,
    'mp3': FileType.AUDIO,
    'wav': FileType.AUDIO,
    'jpg': FileType.IMAGE,
    'jpeg': FileType.IMAGE,
    'png': FileType.IMAGE,
    'gif': FileType.IMAGE,
  };
  return typeMap[ext || ''] || FileType.OTHER;
};

const getMimeType = (filename: string): string => {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeMap: { [key: string]: string } = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc': 'application/msword',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'ppt': 'application/vnd.ms-powerpoint',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel',
    'txt': 'text/plain',
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
  };
  return mimeMap[ext || ''] || 'application/octet-stream';
};

export const uploadFile = async (
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

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonIdNum },
      include: { course: true },
    });

    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    const fileType = getFileTypeFromExtension(req.file.originalname);
    const allowedTypes: FileType[] = [
      FileType.PDF, FileType.DOCX, FileType.PPTX, FileType.XLSX,
      FileType.TXT, FileType.VIDEO, FileType.AUDIO, FileType.IMAGE
    ];

    if (!allowedTypes.includes(fileType)) {
      throw new AppError('File type not supported', 400);
    }

    const mimeType = getMimeType(req.file.originalname);
    const folderPath = `course-${lesson.courseId}/lesson-${lessonIdNum}`;
    const key = `${folderPath}/${Date.now()}-${req.file.originalname}`;

    const { url, key: minioKey } = await minioUtils.uploadFile(
      key,
      req.file.buffer,
      mimeType
    );

    const file = await prisma.file.create({
      data: {
        lessonId: lessonIdNum,
        filename: req.file.originalname,
        fileType,
        minioUrl: url,
        minioKey,
        fileSize: BigInt(req.file.size),
        processingStatus: ProcessingStatus.PENDING,
      },
    });

    try {
      await axios.post(`${AI_SERVICE_URL}/process`, {
        fileId: file.id,
        lessonId: lessonIdNum,
        courseId: lesson.courseId,
        fileUrl: url,
        fileType,
        filename: req.file.originalname,
      }, {
        timeout: 5000,
      });

      await prisma.file.update({
        where: { id: file.id },
        data: { processingStatus: ProcessingStatus.PROCESSING },
      });
    } catch (aiError) {
      console.error('Failed to send processing job to AI service:', aiError);
    }

    res.status(201).json({
      success: true,
      data: file,
    });
  } catch (error) {
    next(error);
  }
};

export const getFileById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const fileId = parseInt(id);

    if (isNaN(fileId)) {
      throw new AppError('Invalid file ID', 400);
    }

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        lesson: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!file) {
      throw new AppError('File not found', 404);
    }

    const isAdmin = req.user?.role === 'ADMIN';
    if (!isAdmin) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: req.user!.id,
            courseId: file.lesson.courseId,
          },
        },
      });

      if (!enrollment) {
        throw new AppError('Not enrolled in this course', 403);
      }
    }

    const signedUrl = await minioUtils.getFileUrl(file.minioKey);

    res.json({
      success: true,
      data: {
        ...file,
        fileSize: file.fileSize.toString(),
        signedUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const fileId = parseInt(id);

    if (isNaN(fileId)) {
      throw new AppError('Invalid file ID', 400);
    }

    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new AppError('File not found', 404);
    }

    await minioUtils.deleteFile(file.minioKey);

    await prisma.file.delete({
      where: { id: fileId },
    });

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getFileStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const fileId = parseInt(id);

    if (isNaN(fileId)) {
      throw new AppError('Invalid file ID', 400);
    }

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        filename: true,
        processingStatus: true,
        errorMessage: true,
        lesson: {
          select: {
            id: true,
            courseId: true,
          },
        },
      },
    });

    if (!file) {
      throw new AppError('File not found', 404);
    }

    const isAdmin = req.user?.role === 'ADMIN';
    if (!isAdmin) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: req.user!.id,
            courseId: file.lesson.courseId,
          },
        },
      });

      if (!enrollment) {
        throw new AppError('Not enrolled in this course', 403);
      }
    }

    res.json({
      success: true,
      data: file,
    });
  } catch (error) {
    next(error);
  }
};
