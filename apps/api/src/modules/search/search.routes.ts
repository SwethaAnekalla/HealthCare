import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { optionalAuth } from '../../middleware/auth';
import { searchService } from './search.service';
import { errors } from '../../lib/error';

const router = Router();

/**
 * GET /search/doctors
 * Search for doctors
 */
router.get(
  '/doctors',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const {
      q,
      specialty,
      clinic,
      experience,
      minRating,
      page = 1,
      limit = 20,
    } = req.query;

    const filters = {};
    if (specialty) Object.assign(filters, { specialtyId: specialty });
    if (clinic) Object.assign(filters, { clinicId: clinic });
    if (experience) Object.assign(filters, { experience: parseInt(experience as string) });
    if (minRating) Object.assign(filters, { minRating: parseFloat(minRating as string) });

    const result = await searchService.searchDoctors(
      (q as string) || '',
      filters,
      parseInt(page as string),
      parseInt(limit as string),
    );

    res.json({
      success: true,
      data: result,
    });
  }),
);

/**
 * GET /search/doctors/:id
 * Get doctor profile details
 */
router.get(
  '/doctors/:id',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const doctor = await searchService.getDoctorProfile(req.params.id);

    if (!doctor) {
      throw errors.NOT_FOUND('Doctor');
    }

    res.json({
      success: true,
      data: doctor,
    });
  }),
);

/**
 * GET /search/doctors/:id/slots
 * Get available slots for a doctor
 */
router.get(
  '/doctors/:id/slots',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { clinicId, date, mode } = req.query;

    if (!clinicId || !date) {
      throw errors.VALIDATION_ERROR('clinicId and date are required');
    }

    const slots = await searchService.getAvailableSlots(
      req.params.id,
      clinicId as string,
      date as string,
      (mode as string) || 'IN_CLINIC',
    );

    res.json({
      success: true,
      data: slots,
    });
  }),
);

/**
 * GET /search/specialties
 * Search specialties
 */
router.get(
  '/specialties',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { q, includeRare = true } = req.query;

    const specialties = await searchService.searchSpecialties(
      (q as string) || '',
      includeRare !== 'false',
    );

    res.json({
      success: true,
      data: specialties,
    });
  }),
);

/**
 * GET /search/clinics
 * Search clinics
 */
router.get(
  '/clinics',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { q, city, page = 1, limit = 20 } = req.query;

    const clinics = await searchService.searchClinics(
      (q as string) || '',
      (city as string) || '',
      parseInt(page as string),
      parseInt(limit as string),
    );

    res.json({
      success: true,
      data: clinics,
    });
  }),
);

/**
 * GET /search/suggest
 * Get autocomplete suggestions
 */
router.get(
  '/suggest',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { q, type = 'all' } = req.query;

    if (!q) {
      throw errors.VALIDATION_ERROR('Query parameter required');
    }

    const suggestions = await searchService.getSuggestions(
      q as string,
      (type as any) || 'all',
    );

    res.json({
      success: true,
      data: suggestions,
    });
  }),
);

export default router;
