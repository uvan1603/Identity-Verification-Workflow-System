import { Router, Request, Response, NextFunction } from 'express';
import * as verificationService from '../services/verification.js';
import * as documentService from '../services/document.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, authorize } from '../middleware/auth.js';
import Joi from 'joi';

const router: Router = Router();

// Middleware: require authentication for all routes
router.use(authenticate);

// Validation schemas
const createVerificationSchema = Joi.object({
  personalInfo: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    dateOfBirth: Joi.date().iso().required(),
    nationality: Joi.string().required(),
    countryOfResidence: Joi.string().required(),
    phoneNumber: Joi.string().optional(),
    address: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    postalCode: Joi.string().optional(),
  }).required(),
});

const uploadDocumentSchema = Joi.object({
  type: Joi.string().valid(
    'PASSPORT',
    'NATIONAL_ID',
    'DRIVERS_LICENSE',
    'VISA',
    'RESIDENCE_PERMIT',
    'UTILITY_BILL',
    'BANK_STATEMENT',
    'GOVERNMENT_LETTER',
    'OTHER'
  ).required(),
  fileName: Joi.string().required(),
  fileUrl: Joi.string().uri().required(),
  mimeType: Joi.string().required(),
  fileSize: Joi.number().required(),
});

/**
 * POST /api/v1/verifications
 * Create a new verification
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = createVerificationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const result = await verificationService.createVerification({
      userId: req.user!.userId,
      personalInfo: value.personalInfo,
    });

    res.status(201).json(result);
  })
);

/**
 * GET /api/v1/verifications
 * Get all verifications for current user
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const verifications = await verificationService.getVerificationsByUserId(
      req.user!.userId
    );
    res.status(200).json(verifications);
  })
);

/**
 * GET /api/v1/verifications/:id
 * Get a specific verification
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const verification = await verificationService.getVerificationById(
      req.params.id,
      req.user!.userId
    );
    res.status(200).json(verification);
  })
);

/**
 * POST /api/v1/verifications/:id/submit
 * Submit verification for review
 */
router.post(
  '/:id/submit',
  asyncHandler(async (req: Request, res: Response) => {
    const verification = await verificationService.getVerificationById(
      req.params.id,
      req.user!.userId
    );

    const result = await verificationService.submitVerification(req.params.id);
    res.status(200).json(result);
  })
);

/**
 * POST /api/v1/verifications/:id/documents
 * Upload a document for a verification
 */
router.post(
  '/:verificationId/documents',
  asyncHandler(async (req: Request, res: Response) => {
    // Ensure user owns this verification
    await verificationService.getVerificationById(
      req.params.verificationId,
      req.user!.userId
    );

    const { error, value } = uploadDocumentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const result = await documentService.uploadDocument({
      verificationId: req.params.verificationId,
      ...value,
    });

    res.status(201).json(result);
  })
);

/**
 * GET /api/v1/verifications/:id/documents
 * Get all documents for a verification
 */
router.get(
  '/:verificationId/documents',
  asyncHandler(async (req: Request, res: Response) => {
    // Ensure user owns this verification
    await verificationService.getVerificationById(
      req.params.verificationId,
      req.user!.userId
    );

    const documents = await documentService.getDocumentsByVerificationId(
      req.params.verificationId
    );

    res.status(200).json(documents);
  })
);

/**
 * GET /api/v1/verifications/:verificationId/documents/:documentId
 * Get a specific document
 */
router.get(
  '/:verificationId/documents/:documentId',
  asyncHandler(async (req: Request, res: Response) => {
    // Ensure user owns this verification
    await verificationService.getVerificationById(
      req.params.verificationId,
      req.user!.userId
    );

    const document = await documentService.getDocumentById(
      req.params.documentId,
      req.params.verificationId
    );

    res.status(200).json(document);
  })
);

/**
 * DELETE /api/v1/verifications/:verificationId/documents/:documentId
 * Delete a document
 */
router.delete(
  '/:verificationId/documents/:documentId',
  asyncHandler(async (req: Request, res: Response) => {
    // Ensure user owns this verification
    await verificationService.getVerificationById(
      req.params.verificationId,
      req.user!.userId
    );

    await documentService.deleteDocument(req.params.documentId);
    res.status(204).send();
  })
);

/**
 * GET /api/v1/verifications/stats
 * Get verification statistics (admin only)
 */
router.get(
  '/stats/overview',
  authorize('COMPLIANCE_MANAGER', 'ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await verificationService.getVerificationStats();
    res.status(200).json(stats);
  })
);

export default router;
