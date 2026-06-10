import { getPrismaClient } from './database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const prisma = getPrismaClient();

export interface CreateVerificationRequest {
  userId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string; // ISO date format
    nationality: string;
    countryOfResidence: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
}

export interface VerificationResponse {
  id: string;
  userId: string;
  status: string;
  currentStage: string;
  riskScore: number;
  attemptCount: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new verification
 */
export async function createVerification(
  req: CreateVerificationRequest
): Promise<VerificationResponse> {
  // Validate user exists
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Check if user has an active verification
  const activeVerification = await prisma.verification.findFirst({
    where: {
      userId: req.userId,
      status: {
        in: ['PENDING', 'UNDER_REVIEW'],
      },
    },
  });

  if (activeVerification) {
    throw new ValidationError('User already has an active verification in progress');
  }

  // Validate personal information
  if (!req.personalInfo.firstName || !req.personalInfo.lastName) {
    throw new ValidationError('First name and last name are required');
  }

  if (!req.personalInfo.dateOfBirth) {
    throw new ValidationError('Date of birth is required');
  }

  try {
    new Date(req.personalInfo.dateOfBirth);
  } catch {
    throw new ValidationError('Invalid date of birth format');
  }

  // Create verification record
  const verificationId = uuidv4();
  const verification = await prisma.verification.create({
    data: {
      id: verificationId,
      userId: req.userId,
      status: 'PENDING',
      currentStage: 'DOCUMENT_SUBMISSION',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      personalInfo: {
        create: {
          id: uuidv4(),
          firstName: req.personalInfo.firstName,
          lastName: req.personalInfo.lastName,
          dateOfBirth: new Date(req.personalInfo.dateOfBirth),
          nationality: req.personalInfo.nationality,
          countryOfResidence: req.personalInfo.countryOfResidence,
          phoneNumber: req.personalInfo.phoneNumber,
          address: req.personalInfo.address,
          city: req.personalInfo.city,
          state: req.personalInfo.state,
          postalCode: req.personalInfo.postalCode,
        },
      },
    },
  });

  logger.info('Verification created', {
    verificationId: verification.id,
    userId: req.userId,
  });

  return formatVerificationResponse(verification);
}

/**
 * Get verification by ID
 */
export async function getVerificationById(
  verificationId: string,
  userId?: string
): Promise<VerificationResponse> {
  const verification = await prisma.verification.findUnique({
    where: { id: verificationId },
  });

  if (!verification) {
    throw new NotFoundError('Verification not found');
  }

  // If userId is provided, ensure user owns this verification
  if (userId && verification.userId !== userId) {
    throw new ValidationError('Unauthorized');
  }

  return formatVerificationResponse(verification);
}

/**
 * Get verifications by user ID
 */
export async function getVerificationsByUserId(userId: string): Promise<VerificationResponse[]> {
  const verifications = await prisma.verification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return verifications.map(formatVerificationResponse);
}

/**
 * Update verification status
 */
export async function updateVerificationStatus(
  verificationId: string,
  status: string
): Promise<VerificationResponse> {
  const validStatuses = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED'];

  if (!validStatuses.includes(status)) {
    throw new ValidationError(`Invalid status: ${status}`);
  }

  const verification = await prisma.verification.update({
    where: { id: verificationId },
    data: { status: status as any },
  });

  logger.info('Verification status updated', {
    verificationId,
    status,
  });

  return formatVerificationResponse(verification);
}

/**
 * Submit verification for review
 */
export async function submitVerification(verificationId: string): Promise<VerificationResponse> {
  const verification = await prisma.verification.findUnique({
    where: { id: verificationId },
    include: {
      documents: true,
      personalInfo: true,
    },
  });

  if (!verification) {
    throw new NotFoundError('Verification not found');
  }

  if (verification.status !== 'PENDING') {
    throw new ValidationError('Verification has already been submitted');
  }

  // Validate required documents
  if (verification.documents.length === 0) {
    throw new ValidationError('At least one document is required');
  }

  if (!verification.personalInfo) {
    throw new ValidationError('Personal information is required');
  }

  const updated = await prisma.verification.update({
    where: { id: verificationId },
    data: {
      status: 'UNDER_REVIEW' as any,
      currentStage: 'DOCUMENT_VERIFICATION' as any,
      attemptCount: {
        increment: 1,
      },
      lastAttemptAt: new Date(),
    },
  });

  logger.info('Verification submitted for review', { verificationId });

  return formatVerificationResponse(updated);
}

/**
 * Get verification counts by status
 */
export async function getVerificationStats() {
  const stats = await prisma.verification.groupBy({
    by: ['status'],
    _count: true,
  });

  const statsByStatus = {
    PENDING: 0,
    UNDER_REVIEW: 0,
    APPROVED: 0,
    REJECTED: 0,
    EXPIRED: 0,
    CANCELLED: 0,
  };

  stats.forEach((stat: any) => {
    statsByStatus[stat.status as keyof typeof statsByStatus] = stat._count;
  });

  return statsByStatus;
}

/**
 * Helper function to format verification response
 */
function formatVerificationResponse(verification: any): VerificationResponse {
  return {
    id: verification.id,
    userId: verification.userId,
    status: verification.status,
    currentStage: verification.currentStage,
    riskScore: verification.riskScore,
    attemptCount: verification.attemptCount,
    expiresAt: verification.expiresAt?.toISOString() || null,
    createdAt: verification.createdAt.toISOString(),
    updatedAt: verification.updatedAt.toISOString(),
  };
}
