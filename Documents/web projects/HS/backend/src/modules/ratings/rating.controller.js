import { ratingService } from './rating.service.js';
import { ratingValidation } from './rating.validation.js';
import { validateBody } from '../../middleware/validate.middleware.js';

export const ratingController = {
  create: [
    validateBody(ratingValidation.create),
    async (req, res, next) => {
      try {
        const result = await ratingService.createRating({
          patientId: req.auth.userId,
          payload: req.body,
        });

        res.status(201).json({
          success: true,
          data: result,
          message: 'Rating created successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ],

  update: [
    validateBody(ratingValidation.update),
    async (req, res, next) => {
      try {
        const result = await ratingService.updateRating({
          ratingId: req.params.ratingId,
          patientId: req.auth.userId,
          payload: req.body,
        });

        res.json({
          success: true,
          data: result,
          message: 'Rating updated successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ],

  delete: async (req, res, next) => {
    try {
      await ratingService.deleteRating({
        ratingId: req.params.ratingId,
        patientId: req.auth.userId,
      });

      res.json({
        success: true,
        data: null,
        message: 'Rating deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  getByDoctor: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await ratingService.getRatingsByDoctor({
        doctorId: req.params.doctorId,
        page,
        limit,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  getStats: async (req, res, next) => {
    try {
      const result = await ratingService.getDoctorStats({
        doctorId: req.params.doctorId,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
