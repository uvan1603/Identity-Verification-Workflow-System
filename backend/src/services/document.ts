import { getPrismaClient } from './database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const prisma = getPrismaClient();

export interface UploadDocumentRequest {
  verificationId: string;
  type: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  fileHash?: string;
}

export interface DocumentResponse {
  id: string;
  verificationId: string;
  type: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  status: string;
  verificationStatus: string;
  uploadedAt: string;
}

const ALLOWED_DOCUMENT_TYPES = [
  'PASSPORT',
  'NATIONAL_ID',
  'DRIVERS_LICENSE',
  'VISA',
  'RESIDENCE_PERMIT',
  'UTILITY_BILL',
  'BANK_STATEMENT',
  'GOVERNMENT_LETTER',
  'OTHER',
];

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/pdf',
  'application/pdf',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Upload a document for a verification
 */
export async function uploadDocument(
  req: UploadDocumentRequest
): Promise<DocumentResponse> {
  // Validate verification exists
  const verification = await prisma.verification.findUnique({
    where: { id: req.verificationId },
  });

  if (!verification) {
    throw new NotFoundError('Verification not found');
  }

  // Validate document type
  if (!ALLOWED_DOCUMENT_TYPES.includes(req.type)) {
    throw new ValidationError(`Invalid document type. Allowed types: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`);
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(req.mimeType)) {
    throw new ValidationError(`Invalid MIME type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }

  // Validate file size
  if (req.fileSize > MAX_FILE_SIZE) {
    throw new ValidationError(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Check for duplicate documents by file hash
  const fileHash = req.fileHash || crypto.randomBytes(16).toString('hex');
  
  const existingDocument = await prisma.document.findUnique({
    where: { fileHash },
  });

  if (existingDocument) {
    throw new ValidationError('Document has already been uploaded');
  }

  // Create document record
  const document = await prisma.document.create({
    data: {
      id: uuidv4(),
      verificationId: req.verificationId,
      type: req.type as any,
      fileName: req.fileName,
      fileUrl: req.fileUrl,
      fileHash,
      mimeType: req.mimeType,
      fileSize: req.fileSize,
      status: 'PENDING_REVIEW' as any,
      verificationStatus: 'PENDING' as any,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },
  });

  logger.info('Document uploaded', {
    documentId: document.id,
    verificationId: req.verificationId,
    type: req.type,
  });

  return formatDocumentResponse(document);
}

/**
 * Get document by ID
 */
export async function getDocumentById(
  documentId: string,
  verificationId?: string
): Promise<DocumentResponse> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new NotFoundError('Document not found');
  }

  if (verificationId && document.verificationId !== verificationId) {
    throw new ValidationError('Unauthorized');
  }

  return formatDocumentResponse(document);
}

/**
 * Get documents by verification ID
 */
export async function getDocumentsByVerificationId(
  verificationId: string
): Promise<DocumentResponse[]> {
  const documents = await prisma.document.findMany({
    where: { verificationId },
    orderBy: { uploadedAt: 'desc' },
  });

  return documents.map(formatDocumentResponse);
}

/**
 * Update document status
 */
export async function updateDocumentStatus(
  documentId: string,
  status: string
): Promise<DocumentResponse> {
  const validStatuses = ['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED', 'UNDER_REVIEW'];

  if (!validStatuses.includes(status)) {
    throw new ValidationError(`Invalid status: ${status}`);
  }

  const document = await prisma.document.update({
    where: { id: documentId },
    data: { status: status as any },
  });

  logger.info('Document status updated', {
    documentId,
    status,
  });

  return formatDocumentResponse(document);
}

/**
 * Delete document
 */
export async function deleteDocument(documentId: string): Promise<void> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new NotFoundError('Document not found');
  }

  // Delete from database
  await prisma.document.delete({
    where: { id: documentId },
  });

  logger.info('Document deleted', { documentId });
}

/**
 * Verify document authenticity
 */
export async function verifyDocument(
  documentId: string,
  isExpired: boolean,
  hasValidSignature: boolean
): Promise<DocumentResponse> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new NotFoundError('Document not found');
  }

  // Create or update document verification record
  await prisma.documentVerification.upsert({
    where: { documentId },
    create: {
      id: uuidv4(),
      documentId,
      isExpired,
      hasValidSignature,
      hasSecurityFeatures: true,
      confidence: hasValidSignature ? 0.95 : 0.5,
    },
    update: {
      isExpired,
      hasValidSignature,
      hasSecurityFeatures: true,
      confidence: hasValidSignature ? 0.95 : 0.5,
    },
  });

  // Update document status based on verification result
  const newStatus = (isExpired
    ? 'REJECTED'
    : hasValidSignature ? 'APPROVED' : 'UNDER_REVIEW') as any;

  const updated = await prisma.document.update({
    where: { id: documentId },
    data: {
      status: newStatus,
      verificationStatus: (hasValidSignature ? 'APPROVED' : 'REQUIRES_RESUBMISSION') as any,
    },
  });

  logger.info('Document verified', {
    documentId,
    isExpired,
    hasValidSignature,
  });

  return formatDocumentResponse(updated);
}

/**
 * Helper function to format document response
 */
function formatDocumentResponse(document: any): DocumentResponse {
  return {
    id: document.id,
    verificationId: document.verificationId,
    type: document.type,
    fileName: document.fileName,
    fileUrl: document.fileUrl,
    mimeType: document.mimeType,
    fileSize: document.fileSize,
    status: document.status,
    verificationStatus: document.verificationStatus,
    uploadedAt: document.uploadedAt.toISOString(),
  };
}
