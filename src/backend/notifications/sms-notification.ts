/**
 * SMS Notification Service for HCBS Revenue Management System
 * 
 * This module provides functionality to send individual and bulk SMS messages for
 * system alerts, reminders, and critical notifications while ensuring delivery
 * tracking and HIPAA compliance.
 * 
 * @module notifications/sms-notification
 * @version 1.0.0
 */

import { Twilio } from 'twilio'; // twilio ^4.11.0
import { NotificationContent, NotificationDeliveryResult, DeliveryMethod } from '../types/notification.types';
import logger from '../utils/logger';
import config from '../config';

/**
 * Creates and configures a Twilio client instance
 * @returns Configured Twilio client
 */
const createTwilioClient = (): Twilio => {
  try {
    const smsConfig = config.notifications?.sms;
    
    if (!smsConfig?.accountSid || !smsConfig?.authToken) {
      throw new Error('Missing Twilio credentials in configuration');
    }
    
    return new Twilio(smsConfig.accountSid, smsConfig.authToken);
  } catch (error) {
    logger.error('Failed to create Twilio client', { error });
    throw error;
  }
};

/**
 * Formats notification content into SMS-friendly format
 * @param content Notification content to format
 * @returns Formatted SMS message
 */
const formatSmsContent = (content: NotificationContent): string => {
  // Combine title and message
  let smsContent = content.title ? `${content.title}: ${content.message}` : content.message;
  
  // Remove HTML if present
  smsContent = smsContent.replace(/<[^>]*>?/gm, '');
  
  // Add prefix based on severity if available in data
  if (content.data?.severity) {
    switch (content.data.severity) {
      case 'critical':
        smsContent = `URGENT: ${smsContent}`;
        break;
      case 'high':
        smsContent = `IMPORTANT: ${smsContent}`;
        break;
      default:
        // No prefix for medium or low severity
        break;
    }
  }
  
  // Ensure SMS is within character limits (160 chars is standard SMS length)
  if (smsContent.length > 160) {
    smsContent = smsContent.substring(0, 157) + '...';
  }
  
  return smsContent;
};

/**
 * Validates a phone number format
 * @param phoneNumber Phone number to validate
 * @returns True if phone number format is valid
 */
const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Validate E.164 format (e.g., +12345678900)
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
};

/**
 * Sends an SMS notification to a single recipient
 * @param userId User ID of the recipient
 * @param phoneNumber Recipient's phone number in E.164 format
 * @param content Notification content
 * @param options Additional options for SMS delivery
 * @returns Promise with the delivery result
 */
const sendSms = async (
  userId: string,
  phoneNumber: string,
  content: NotificationContent,
  options: Record<string, any> = {}
): Promise<NotificationDeliveryResult> => {
  logger.debug('Sending SMS notification', { 
    userId, 
    phoneNumber: phoneNumber.substring(0, 6) + '****', 
    options 
  });
  
  try {
    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      logger.error('Invalid phone number format', { 
        userId, 
        phoneNumber: phoneNumber.substring(0, 6) + '****' 
      });
      
      return {
        method: DeliveryMethod.SMS,
        success: false,
        timestamp: new Date(),
        error: 'Invalid phone number format',
        metadata: {
          userId,
          contentType: 'sms'
        }
      };
    }
    
    // Get Twilio client
    const client = createTwilioClient();
    
    // Format message for SMS
    const message = formatSmsContent(content);
    
    // Get sender phone number from config
    const from = config.notifications?.sms?.phoneNumber;
    
    if (!from) {
      throw new Error('Missing sender phone number in configuration');
    }
    
    // Send SMS via Twilio
    const twilioResponse = await client.messages.create({
      body: message,
      from,
      to: phoneNumber,
      statusCallback: options.statusCallback
    });
    
    logger.info('SMS sent successfully', {
      userId,
      messageId: twilioResponse.sid,
      status: twilioResponse.status
    });
    
    // Return delivery result
    return {
      method: DeliveryMethod.SMS,
      success: true,
      timestamp: new Date(),
      error: null,
      metadata: {
        userId,
        messageId: twilioResponse.sid,
        status: twilioResponse.status,
        contentType: 'sms'
      }
    };
  } catch (error) {
    logger.error('Failed to send SMS', { 
      error, 
      userId, 
      phoneNumber: phoneNumber.substring(0, 6) + '****' 
    });
    
    // Return failure result
    return {
      method: DeliveryMethod.SMS,
      success: false,
      timestamp: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        userId,
        contentType: 'sms'
      }
    };
  }
};

/**
 * Sends the same SMS notification to multiple recipients
 * @param recipients Array of recipients with user ID and phone number
 * @param content Notification content
 * @param options Additional options for SMS delivery
 * @returns Promise with an array of delivery results
 */
const sendBulkSms = async (
  recipients: Array<{ userId: string, phoneNumber: string }>,
  content: NotificationContent,
  options: Record<string, any> = {}
): Promise<Array<NotificationDeliveryResult>> => {
  logger.debug('Sending bulk SMS notifications', { 
    recipientCount: recipients.length,
    options
  });
  
  try {
    // Get Twilio client
    const client = createTwilioClient();
    
    // Format message for SMS
    const message = formatSmsContent(content);
    
    // Get sender phone number from config
    const from = config.notifications?.sms?.phoneNumber;
    
    if (!from) {
      throw new Error('Missing sender phone number in configuration');
    }
    
    // Get batch size and delay from config or use defaults
    const batchSize = config.notifications?.sms?.batchSize || 50;
    const batchDelay = config.notifications?.sms?.batchDelay || 1000;
    
    // Filter out invalid phone numbers
    const validRecipients = recipients.filter(recipient => validatePhoneNumber(recipient.phoneNumber));
    
    // Split recipients into batches to avoid rate limiting
    const batches = [];
    for (let i = 0; i < validRecipients.length; i += batchSize) {
      batches.push(validRecipients.slice(i, i + batchSize));
    }
    
    const results: NotificationDeliveryResult[] = [];
    
    // Process each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      // Send SMS to each recipient in the batch
      const batchPromises = batch.map(async (recipient) => {
        try {
          const twilioResponse = await client.messages.create({
            body: message,
            from,
            to: recipient.phoneNumber,
            statusCallback: options.statusCallback
          });
          
          logger.info('SMS sent successfully', {
            userId: recipient.userId,
            messageId: twilioResponse.sid,
            status: twilioResponse.status
          });
          
          return {
            method: DeliveryMethod.SMS,
            success: true,
            timestamp: new Date(),
            error: null,
            metadata: {
              userId: recipient.userId,
              messageId: twilioResponse.sid,
              status: twilioResponse.status,
              contentType: 'sms'
            }
          };
        } catch (error) {
          logger.error('Failed to send SMS', { 
            error, 
            userId: recipient.userId, 
            phoneNumber: recipient.phoneNumber.substring(0, 6) + '****'
          });
          
          return {
            method: DeliveryMethod.SMS,
            success: false,
            timestamp: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error',
            metadata: {
              userId: recipient.userId,
              contentType: 'sms'
            }
          };
        }
      });
      
      // Wait for all messages in the batch to be sent
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches to avoid rate limiting (skip delay after the last batch)
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, batchDelay));
      }
    }
    
    logger.info('Bulk SMS sending completed', { 
      totalSent: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
    
    return results;
  } catch (error) {
    logger.error('Failed to send bulk SMS', { error });
    
    // Return failure results for all recipients
    return recipients.map(recipient => ({
      method: DeliveryMethod.SMS,
      success: false,
      timestamp: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        userId: recipient.userId,
        contentType: 'sms'
      }
    }));
  }
};

/**
 * Sends a digest SMS containing summaries of multiple notifications
 * @param userId User ID of the recipient
 * @param phoneNumber Recipient's phone number in E.164 format
 * @param notifications Array of notifications to include in the digest
 * @param options Additional options for SMS delivery
 * @returns Promise with the delivery result
 */
const sendDigestSms = async (
  userId: string,
  phoneNumber: string,
  notifications: Array<NotificationContent>,
  options: Record<string, any> = {}
): Promise<NotificationDeliveryResult> => {
  logger.debug('Sending digest SMS notification', { 
    userId, 
    phoneNumber: phoneNumber.substring(0, 6) + '****',
    notificationCount: notifications.length,
    options
  });
  
  try {
    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      logger.error('Invalid phone number format', { 
        userId, 
        phoneNumber: phoneNumber.substring(0, 6) + '****' 
      });
      
      return {
        method: DeliveryMethod.SMS,
        success: false,
        timestamp: new Date(),
        error: 'Invalid phone number format',
        metadata: {
          userId,
          contentType: 'digest_sms'
        }
      };
    }
    
    // Get Twilio client
    const client = createTwilioClient();
    
    // Format digest message
    let digestMessage = `You have ${notifications.length} new notification${notifications.length === 1 ? '' : 's'}:\n`;
    
    // Add brief summaries of each notification (limited to first 5 for SMS length constraints)
    const maxNotificationsInDigest = Math.min(notifications.length, 5);
    
    for (let i = 0; i < maxNotificationsInDigest; i++) {
      const notification = notifications[i];
      // Add a brief summary of the notification
      digestMessage += `\n${i + 1}. ${notification.title}`;
    }
    
    // If there are more notifications than we can include, add a note
    if (notifications.length > maxNotificationsInDigest) {
      digestMessage += `\n\n+ ${notifications.length - maxNotificationsInDigest} more. Check the app for all notifications.`;
    }
    
    // Get sender phone number from config
    const from = config.notifications?.sms?.phoneNumber;
    
    if (!from) {
      throw new Error('Missing sender phone number in configuration');
    }
    
    // Send digest SMS via Twilio
    const twilioResponse = await client.messages.create({
      body: digestMessage,
      from,
      to: phoneNumber,
      statusCallback: options.statusCallback
    });
    
    logger.info('Digest SMS sent successfully', {
      userId,
      messageId: twilioResponse.sid,
      status: twilioResponse.status,
      notificationCount: notifications.length
    });
    
    // Return delivery result
    return {
      method: DeliveryMethod.SMS,
      success: true,
      timestamp: new Date(),
      error: null,
      metadata: {
        userId,
        messageId: twilioResponse.sid,
        status: twilioResponse.status,
        contentType: 'digest_sms',
        notificationCount: notifications.length
      }
    };
  } catch (error) {
    logger.error('Failed to send digest SMS', { 
      error, 
      userId, 
      phoneNumber: phoneNumber.substring(0, 6) + '****',
      notificationCount: notifications.length
    });
    
    // Return failure result
    return {
      method: DeliveryMethod.SMS,
      success: false,
      timestamp: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        userId,
        contentType: 'digest_sms',
        notificationCount: notifications.length
      }
    };
  }
};

/**
 * Service for sending SMS notifications to users
 */
export const SmsService = {
  sendSms,
  sendBulkSms,
  sendDigestSms
};