import { Request, Response } from '../types/request.types'; // Import extended Express Request interface with authentication data
import { dashboardService } from '../services/dashboard.service'; // Import dashboard service for handling dashboard data retrieval and processing
import { SuccessResponse } from '../types/response.types'; // Import response helper function for standardized API responses
import { TimeFrame } from '../types/reports.types'; // Import time frame enum for filtering dashboard data
import { DateRange } from '../types/common.types'; // Import date range interface for custom date filtering
import { logger } from '../utils/logger'; // Import logging functionality
import { dateUtils } from '../utils/date'; // Import date utility functions for handling date ranges
import express from 'express'; // Web framework for Node.js // version 4.18.2

/**
 * Controller for handling dashboard-related HTTP requests in the HCBS Revenue Management System.
 * This controller implements endpoints for retrieving financial metrics, revenue data, claims status,
 * alerts, and other dashboard components to provide a comprehensive financial overview for HCBS providers.
 */
class DashboardController {

  /**
   * Retrieves comprehensive metrics for the dashboard including revenue, claims, alerts, and recent claims
   * @param req Express Request
   * @param res Express Response
   * @returns Promise<void> - No return value, sends HTTP response
   */
  public async getDashboardMetrics(req: Request, res: Response): Promise<void> {
    try {
      // LD1: Extract query parameters from request
      const { timeFrame, startDate, endDate } = req.query;

      // LD1: Extract organization ID from authenticated user
      const organizationId = req.user?.organizationId;

      // LD1: Prepare filters object with organization ID and other filters
      const filters: any = {
        organizationId,
        timeFrame,
        startDate,
        endDate
      };

      // LD1: Log the filters being used
      logger.info('Getting dashboard metrics with filters', { filters });

      // LD1: Call dashboardService.getDashboardMetrics with filters
      const dashboardMetrics = await dashboardService.getDashboardMetrics(filters);

      // LD1: Log the successful retrieval of dashboard metrics
      logger.info('Successfully retrieved dashboard metrics');

      // LD1: Return success response with dashboard metrics data
      return SuccessResponse(dashboardMetrics, 'Dashboard metrics retrieved successfully').send(res);
    } catch (error: any) {
      // LD1: Log the error
      logger.error('Error getting dashboard metrics', { error });

      // LD1: Handle errors with appropriate status codes and messages
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard metrics',
        error: error.message
      });
    }
  }

  /**
   * Retrieves revenue metrics for the dashboard including total revenue, revenue by program, and revenue by payer
   * @param req Express Request
   * @param res Express Response
   * @returns Promise<void> - No return value, sends HTTP response
   */
  public async getRevenueMetrics(req: Request, res: Response): Promise<void> {
    try {
      // LD1: Extract time frame or date range from query parameters
      const { timeFrame, startDate, endDate } = req.query;

      // LD1: Extract organization ID from authenticated user
      const organizationId = req.user?.organizationId;

      // LD1: Prepare filters object with organization ID and other filters
      const filters: any = {
        organizationId
      };

      // LD1: Log the filters being used
      logger.info('Getting revenue metrics with filters', { filters, timeFrame, startDate, endDate });

      // LD1: Convert time frame to date range if needed using dateUtils
      let timeFrameOrDateRange: TimeFrame | DateRange | undefined = timeFrame as TimeFrame;
      if (startDate && endDate) {
        timeFrameOrDateRange = {
          startDate: startDate as string,
          endDate: endDate as string
        };
      }

      // LD1: Call dashboardService.getRevenueMetrics with time frame/date range and filters
      const revenueMetrics = await dashboardService.getRevenueMetrics(timeFrameOrDateRange, filters);

      // LD1: Log the successful retrieval of revenue metrics
      logger.info('Successfully retrieved revenue metrics');

      // LD1: Return success response with revenue metrics data
      return SuccessResponse(revenueMetrics, 'Revenue metrics retrieved successfully').send(res);
    } catch (error: any) {
      // LD1: Log the error
      logger.error('Error getting revenue metrics', { error });

      // LD1: Handle errors with appropriate status codes and messages
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve revenue metrics',
        error: error.message
      });
    }
  }

  /**
   * Retrieves claims metrics for the dashboard including claims by status and aging claims
   * @param req Express Request
   * @param res Express Response
   * @returns Promise<void> - No return value, sends HTTP response
   */
  public async getClaimsMetrics(req: Request, res: Response): Promise<void> {
    try {
      // LD1: Extract time frame or date range from query parameters
      const { timeFrame, startDate, endDate } = req.query;

      // LD1: Extract organization ID from authenticated user
      const organizationId = req.user?.organizationId;

      // LD1: Prepare filters object with organization ID and other filters
      const filters: any = {
        organizationId
      };

      // LD1: Log the filters being used
      logger.info('Getting claims metrics with filters', { filters, timeFrame, startDate, endDate });

      // LD1: Convert time frame to date range if needed using dateUtils
      let timeFrameOrDateRange: TimeFrame | DateRange | undefined = timeFrame as TimeFrame;
      if (startDate && endDate) {
        timeFrameOrDateRange = {
          startDate: startDate as string,
          endDate: endDate as string
        };
      }

      // LD1: Call dashboardService.getClaimsMetrics with time frame/date range and filters
      const claimsMetrics = await dashboardService.getClaimsMetrics(timeFrameOrDateRange, filters);

      // LD1: Log the successful retrieval of claims metrics
      logger.info('Successfully retrieved claims metrics');

      // LD1: Return success response with claims metrics data
      return SuccessResponse(claimsMetrics, 'Claims metrics retrieved successfully').send(res);
    } catch (error: any) {
      // LD1: Log the error
      logger.error('Error getting claims metrics', { error });

      // LD1: Handle errors with appropriate status codes and messages
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve claims metrics',
        error: error.message
      });
    }
  }

  /**
   * Retrieves alert notifications for the dashboard
   * @param req Express Request
   * @param res Express Response
   * @returns Promise<void> - No return value, sends HTTP response
   */
  public async getAlertNotifications(req: Request, res: Response): Promise<void> {
    try {
      // LD1: Extract query parameters from request
      const {  } = req.query;

      // LD1: Extract organization ID from authenticated user
      const organizationId = req.user?.organizationId;

      // LD1: Prepare filters object with organization ID and other filters
      const filters: any = {
        organizationId
      };

      // LD1: Log the filters being used
      logger.info('Getting alert notifications with filters', { filters });

      // LD1: Call dashboardService.getAlertNotifications with filters
      const alertNotifications = await dashboardService.getAlertNotifications(filters);

      // LD1: Log the successful retrieval of alert notifications
      logger.info('Successfully retrieved alert notifications');

      // LD1: Return success response with alert notifications data
      return SuccessResponse(alertNotifications, 'Alert notifications retrieved successfully').send(res);
    } catch (error: any) {
      // LD1: Log the error
      logger.error('Error getting alert notifications', { error });

      // LD1: Handle errors with appropriate status codes and messages
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve alert notifications',
        error: error.message
      });
    }
  }

  /**
   * Retrieves recent claims for the dashboard
   * @param req Express Request
   * @param res Express Response
   * @returns Promise<void> - No return value, sends HTTP response
   */
  public async getRecentClaims(req: Request, res: Response): Promise<void> {
    try {
      // LD1: Extract limit parameter from query (default to 5)
      const { limit } = req.query;
      const parsedLimit = limit ? parseInt(limit as string, 10) : 5;

      // LD1: Extract organization ID from authenticated user
      const organizationId = req.user?.organizationId;

      // LD1: Prepare filters object with organization ID and other filters
      const filters: any = {
        organizationId
      };

      // LD1: Log the filters being used
      logger.info('Getting recent claims with filters', { filters, limit });

      // LD1: Call dashboardService.getRecentClaims with filters and limit
      const recentClaims = await dashboardService.getRecentClaims(filters, parsedLimit);

      // LD1: Log the successful retrieval of recent claims
      logger.info('Successfully retrieved recent claims');

      // LD1: Return success response with recent claims data
      return SuccessResponse(recentClaims, 'Recent claims retrieved successfully').send(res);
    } catch (error: any) {
      // LD1: Log the error
      logger.error('Error getting recent claims', { error });

      // LD1: Handle errors with appropriate status codes and messages
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve recent claims',
        error: error.message
      });
    }
  }

  /**
   * Retrieves revenue breakdown by program for the dashboard
   * @param req Express Request
   * @param res Express Response
   * @returns Promise<void> - No return value, sends HTTP response
   */
  public async getRevenueByProgram(req: Request, res: Response): Promise<void> {
    try {
      // LD1: Extract time frame or date range from query parameters
      const { timeFrame, startDate, endDate } = req.query;

      // LD1: Extract organization ID from authenticated user
      const organizationId = req.user?.organizationId;

      // LD1: Prepare filters object with organization ID and other filters
      const filters: any = {
        organizationId
      };

      // LD1: Log the filters being used
      logger.info('Getting revenue by program with filters', { filters, timeFrame, startDate, endDate });

      // LD1: Convert time frame to date range if needed using dateUtils
      let timeFrameOrDateRange: TimeFrame | DateRange | undefined = timeFrame as TimeFrame;
      if (startDate && endDate) {
        timeFrameOrDateRange = {
          startDate: startDate as string,
          endDate: endDate as string
        };
      }

      // LD1: Call dashboardService.getRevenueByProgram with time frame/date range and filters
      const revenueByProgram = await dashboardService.getRevenueByProgram(timeFrameOrDateRange, filters);

      // LD1: Log the successful retrieval of revenue by program
      logger.info('Successfully retrieved revenue by program');

      // LD1: Return success response with revenue by program data
      return SuccessResponse(revenueByProgram, 'Revenue by program retrieved successfully').send(res);
    } catch (error: any) {
      // LD1: Log the error
      logger.error('Error getting revenue by program', { error });

      // LD1: Handle errors with appropriate status codes and messages
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve revenue by program',
        error: error.message
      });
    }
  }

  /**
   * Retrieves revenue breakdown by payer for the dashboard
   * @param req Express Request
   * @param res Express Response
   * @returns Promise<void> - No return value, sends HTTP response
   */
  public async getRevenueByPayer(req: Request, res: Response): Promise<void> {
    try {
      // LD1: Extract time frame or date range from query parameters
      const { timeFrame, startDate, endDate } = req.query;

      // LD1: Extract organization ID from authenticated user
      const organizationId = req.user?.organizationId;

      // LD1: Prepare filters object with organization ID and other filters
      const filters: any = {
        organizationId
      };

      // LD1: Log the filters being used
      logger.info('Getting revenue by payer with filters', { filters, timeFrame, startDate, endDate });

      // LD1: Convert time frame to date range if needed using dateUtils
      let timeFrameOrDateRange: TimeFrame | DateRange | undefined = timeFrame as TimeFrame;
      if (startDate && endDate) {
        timeFrameOrDateRange = {
          startDate: startDate as string,
          endDate: endDate as string
        };
      }

      // LD1: Call dashboardService.getRevenueByPayer with time frame/date range and filters
      const revenueByPayer = await dashboardService.getRevenueByPayer(timeFrameOrDateRange, filters);

      // LD1: Log the successful retrieval of revenue by payer
      logger.info('Successfully retrieved revenue by payer');

      // LD1: Return success response with revenue by payer data
      return SuccessResponse(revenueByPayer, 'Revenue by payer retrieved successfully').send(res);
    } catch (error: any) {
      // LD1: Log the error
      logger.error('Error getting revenue by payer', { error });

      // LD1: Handle errors with appropriate status codes and messages
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve revenue by payer',
        error: error.message
      });
    }
  }

  /**
   * Retrieves aging receivables data for the dashboard
   * @param req Express Request
   * @param res Express Response
   * @returns Promise<void> - No return value, sends HTTP response
   */
  public async getAgingReceivables(req: Request, res: Response): Promise<void> {
    try {
      // LD1: Extract query parameters from request
      const {  } = req.query;

      // LD1: Extract organization ID from authenticated user
      const organizationId = req.user?.organizationId;

      // LD1: Prepare filters object with organization ID and other filters
      const filters: any = {
        organizationId
      };

      // LD1: Log the filters being used
      logger.info('Getting aging receivables with filters', { filters });

      // LD1: Call dashboardService.getAgingReceivables with filters
      const agingReceivables = await dashboardService.getAgingReceivables(filters);

      // LD1: Log the successful retrieval of aging receivables
      logger.info('Successfully retrieved aging receivables');

      // LD1: Return success response with aging receivables data
      return SuccessResponse(agingReceivables, 'Aging receivables retrieved successfully').send(res);
    } catch (error: any) {
      // LD1: Log the error
      logger.error('Error getting aging receivables', { error });

      // LD1: Handle errors with appropriate status codes and messages
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve aging receivables',
        error: error.message
      });
    }
  }

  /**
   * Retrieves claims breakdown by status for the dashboard
   * @param req Express Request
   * @param res Express Response
   * @returns Promise<void> - No return value, sends HTTP response
   */
  public async getClaimsByStatus(req: Request, res: Response): Promise<void> {
    try {
      // LD1: Extract time frame or date range from query parameters
      const { timeFrame, startDate, endDate } = req.query;

      // LD1: Extract organization ID from authenticated user
      const organizationId = req.user?.organizationId;

      // LD1: Prepare filters object with organization ID and other filters
      const filters: any = {
        organizationId
      };

      // LD1: Log the filters being used
      logger.info('Getting claims by status with filters', { filters, timeFrame, startDate, endDate });

      // LD1: Convert time frame to date range if needed using dateUtils
      let timeFrameOrDateRange: TimeFrame | DateRange | undefined = timeFrame as TimeFrame;
      if (startDate && endDate) {
        timeFrameOrDateRange = {
          startDate: startDate as string,
          endDate: endDate as string
        };
      }

      // LD1: Call dashboardService.getClaimsByStatus with time frame/date range and filters
      const claimsByStatus = await dashboardService.getClaimsByStatus(timeFrameOrDateRange, filters);

      // LD1: Log the successful retrieval of claims by status
      logger.info('Successfully retrieved claims by status');

      // LD1: Return success response with claims by status data
      return SuccessResponse(claimsByStatus, 'Claims by status retrieved successfully').send(res);
    } catch (error: any) {
      // LD1: Log the error
      logger.error('Error getting claims by status', { error });

      // LD1: Handle errors with appropriate status codes and messages
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve claims by status',
        error: error.message
      });
    }
  }

  /**
   * Retrieves unbilled services metrics for the dashboard
   * @param req Express Request
   * @param res Express Response
   * @returns Promise<void> - No return value, sends HTTP response
   */
  public async getUnbilledServices(req: Request, res: Response): Promise<void> {
    try {
      // LD1: Extract query parameters from request
      const {  } = req.query;

      // LD1: Extract organization ID from authenticated user
      const organizationId = req.user?.organizationId;

      // LD1: Prepare filters object with organization ID and other filters
      const filters: any = {
        organizationId
      };

      // LD1: Log the filters being used
      logger.info('Getting unbilled services with filters', { filters });

      // LD1: Call dashboardService.getUnbilledServices with filters
      const unbilledServices = await dashboardService.getUnbilledServices(filters);

      // LD1: Log the successful retrieval of unbilled services
      logger.info('Successfully retrieved unbilled services');

      // LD1: Return success response with unbilled services metrics
      return SuccessResponse(unbilledServices, 'Unbilled services retrieved successfully').send(res);
    } catch (error: any) {
      // LD1: Log the error
      logger.error('Error getting unbilled services', { error });

      // LD1: Handle errors with appropriate status codes and messages
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve unbilled services',
        error: error.message
      });
    }
  }
}

// LD1: Export controller instance for use in routes
const dashboardController = new DashboardController();
export default dashboardController;