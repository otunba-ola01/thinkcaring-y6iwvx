import nodemailer from 'nodemailer'; // nodemailer ^6.9.1
import handlebars from 'handlebars'; // handlebars ^4.7.7
import * as fs from 'fs';
import * as path from 'path';
import { NotificationContent, NotificationDeliveryResult, DeliveryMethod } from '../types/notification.types';
import { logger } from '../utils/logger';
import config from '../config';

/**
 * Creates and configures a nodemailer transporter instance
 * @returns Configured email transporter
 */
const createTransporter = () => {
  // Get email configuration with fallbacks
  const emailConfig = config?.notifications?.email || {};
  
  // Create transporter with fallback values for required fields
  const transporter = nodemailer.createTransport({
    host: emailConfig.host || process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(String(emailConfig.port || process.env.EMAIL_PORT || '587')),
    secure: emailConfig.secure !== undefined ? emailConfig.secure : process.env.EMAIL_SECURE === 'true',
    auth: {
      user: emailConfig.user || process.env.EMAIL_USER || '',
      pass: emailConfig.password || process.env.EMAIL_PASSWORD || '',
    },
    // Additional configurations
    ...(emailConfig.options || {})
  });
  
  return transporter;
};

/**
 * Compiles an email template with handlebars
 * @param templateName - Name of the template to compile
 * @param data - Data to use in template compilation
 * @returns Compiled HTML content
 */
const compileTemplate = (templateName: string, data: object): string => {
  try {
    // Get the template path
    const templatesDir = path.join(__dirname, '..', '..', 'templates', 'email');
    const templatePath = path.join(templatesDir, `${templateName}.hbs`);
    
    // Read and compile the template
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);
    
    // Apply the data to the template
    return template(data);
  } catch (error) {
    logger.error('Error compiling email template', { templateName, error });
    // Fallback to a simple text representation if template compilation fails
    return `
      <h2>${(data as any).title || 'Notification'}</h2>
      <div>${(data as any).message || ''}</div>
    `;
  }
};

/**
 * Formats notification content into email-friendly format
 * @param content - Notification content to format
 * @returns Formatted email content with subject and body
 */
const formatEmailContent = (content: NotificationContent): { subject: string; html: string } => {
  // Use notification title as email subject
  const subject = content.title;
  
  // Format the message with basic HTML formatting
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0F52BA;">${content.title}</h2>
      <div style="margin: 20px 0; line-height: 1.5;">${content.message}</div>
      ${Object.keys(content.data || {}).length > 0 ? 
        `<div style="margin-top: 20px; padding: 15px; background-color: #f5f7fa; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #616E7C;">Additional Information</h3>
          <pre style="white-space: pre-wrap;">${JSON.stringify(content.data, null, 2)}</pre>
        </div>` : ''
      }
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E4E7EB; color: #616E7C; font-size: 12px;">
        This is an automated message from HCBS Revenue Management System. Please do not reply to this email.
      </div>
    </div>
  `;
  
  return { subject, html };
};

/**
 * Sends an email notification to a single recipient
 * @param userId - ID of the user receiving the notification
 * @param email - Email address to send to
 * @param content - Notification content
 * @param options - Additional options for email sending
 * @returns Promise resolving to delivery result
 */
const sendEmail = async (
  userId: string,
  email: string,
  content: NotificationContent,
  options: { templateName?: string; attachments?: any[] } = {}
): Promise<NotificationDeliveryResult> => {
  try {
    // Validate email
    if (!validateEmailAddress(email)) {
      logger.warn('Invalid email address for notification', { userId, email });
      return {
        method: DeliveryMethod.EMAIL,
        success: false,
        timestamp: new Date(),
        error: 'Invalid email address',
        metadata: { userId, email }
      };
    }
    
    // Get transporter
    const transporter = createTransporter();
    
    // Format content or use template
    let emailContent;
    if (options.templateName) {
      // Use the specified template with content data
      const html = compileTemplate(options.templateName, {
        ...content,
        userId,
        date: new Date().toLocaleDateString()
      });
      emailContent = { subject: content.title, html };
    } else {
      // Format directly from notification content
      emailContent = formatEmailContent(content);
    }
    
    // Prepare email options
    const mailOptions = {
      from: config?.notifications?.email?.from || process.env.EMAIL_FROM || 'noreply@thinkcaring.com',
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      attachments: options.attachments || []
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    logger.info('Email notification sent successfully', { 
      userId, 
      email, 
      subject: emailContent.subject,
      messageId: info.messageId 
    });
    
    // Return success result
    return {
      method: DeliveryMethod.EMAIL,
      success: true,
      timestamp: new Date(),
      error: null,
      metadata: { 
        userId,
        email,
        messageId: info.messageId
      }
    };
  } catch (error) {
    logger.error('Failed to send email notification', { 
      userId, 
      email, 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return failure result
    return {
      method: DeliveryMethod.EMAIL,
      success: false,
      timestamp: new Date(),
      error: error instanceof Error ? error.message : String(error),
      metadata: { userId, email }
    };
  }
};

/**
 * Sends the same email notification to multiple recipients
 * @param recipients - Array of recipients with userId and email
 * @param content - Notification content
 * @param options - Additional options for email sending
 * @returns Promise resolving to array of delivery results
 */
const sendBulkEmail = async (
  recipients: Array<{ userId: string; email: string }>,
  content: NotificationContent,
  options: { templateName?: string; attachments?: any[]; batchSize?: number; delayBetweenBatches?: number } = {}
): Promise<Array<NotificationDeliveryResult>> => {
  try {
    // Validate recipients
    const validRecipients = recipients.filter(r => validateEmailAddress(r.email));
    
    if (validRecipients.length === 0) {
      logger.warn('No valid recipients for bulk email', { totalRecipients: recipients.length });
      return [];
    }
    
    // Get email configuration
    const emailConfig = config?.notifications?.email || {};
    
    // Determine batch size from options or config
    const batchSize = options.batchSize || emailConfig.batchSize || 50;
    const delayBetweenBatches = options.delayBetweenBatches || emailConfig.delayBetweenBatches || 1000;
    
    // Split recipients into batches
    const batches = [];
    for (let i = 0; i < validRecipients.length; i += batchSize) {
      batches.push(validRecipients.slice(i, i + batchSize));
    }
    
    logger.info('Processing bulk email', { 
      totalRecipients: validRecipients.length,
      batches: batches.length,
      batchSize
    });
    
    // Process batches
    const results: Array<NotificationDeliveryResult> = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      // Process batch concurrently
      const batchResults = await Promise.all(
        batch.map(recipient => 
          sendEmail(recipient.userId, recipient.email, content, options)
        )
      );
      
      results.push(...batchResults);
      
      // Delay between batches (except after the last batch)
      if (i < batches.length - 1 && delayBetweenBatches > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }
    
    // Log summary
    const successful = results.filter(r => r.success).length;
    logger.info('Bulk email completed', { 
      totalSent: results.length,
      successful,
      failed: results.length - successful
    });
    
    return results;
  } catch (error) {
    logger.error('Error in bulk email sending', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return recipients.map(recipient => ({
      method: DeliveryMethod.EMAIL,
      success: false,
      timestamp: new Date(),
      error: error instanceof Error ? error.message : String(error),
      metadata: { userId: recipient.userId, email: recipient.email }
    }));
  }
};

/**
 * Sends a digest email containing multiple notifications
 * @param userId - ID of the user receiving the digest
 * @param email - Email address to send to
 * @param notifications - Array of notifications to include in digest
 * @param options - Additional options for email sending
 * @returns Promise resolving to delivery result
 */
const sendDigestEmail = async (
  userId: string,
  email: string,
  notifications: Array<NotificationContent>,
  options: { templateName?: string; groupBy?: string } = {}
): Promise<NotificationDeliveryResult> => {
  try {
    // Validate email
    if (!validateEmailAddress(email)) {
      logger.warn('Invalid email address for digest', { userId, email });
      return {
        method: DeliveryMethod.EMAIL,
        success: false,
        timestamp: new Date(),
        error: 'Invalid email address',
        metadata: { userId, email }
      };
    }
    
    if (notifications.length === 0) {
      logger.warn('No notifications to send in digest', { userId, email });
      return {
        method: DeliveryMethod.EMAIL,
        success: false,
        timestamp: new Date(),
        error: 'No notifications to send in digest',
        metadata: { userId, email }
      };
    }
    
    // Get transporter
    const transporter = createTransporter();
    
    // Use a specific digest template or default
    const templateName = options.templateName || 'digest';
    
    // Group notifications if needed
    let groupedNotifications = notifications;
    if (options.groupBy) {
      const grouped: Record<string, Array<NotificationContent>> = {};
      
      // Group notifications by the specified property
      notifications.forEach(notification => {
        const groupKey = notification.data?.[options.groupBy!] || 'Other';
        if (!grouped[groupKey]) {
          grouped[groupKey] = [];
        }
        grouped[groupKey].push(notification);
      });
      
      // Convert to array format for the template
      groupedNotifications = Object.entries(grouped).map(([key, items]) => ({
        groupName: key,
        items
      }));
    }
    
    // Compile the digest template
    const html = compileTemplate(templateName, {
      userId,
      date: new Date().toLocaleDateString(),
      notifications: groupedNotifications,
      isGrouped: !!options.groupBy,
      total: notifications.length
    });
    
    // Prepare email options
    const mailOptions = {
      from: config?.notifications?.email?.from || process.env.EMAIL_FROM || 'noreply@thinkcaring.com',
      to: email,
      subject: `Notification Digest: ${notifications.length} new notifications`,
      html
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    logger.info('Digest email sent successfully', { 
      userId, 
      email, 
      notificationCount: notifications.length,
      messageId: info.messageId 
    });
    
    // Return success result
    return {
      method: DeliveryMethod.EMAIL,
      success: true,
      timestamp: new Date(),
      error: null,
      metadata: { 
        userId,
        email,
        messageId: info.messageId,
        notificationCount: notifications.length
      }
    };
  } catch (error) {
    logger.error('Failed to send digest email', { 
      userId, 
      email, 
      notificationCount: notifications.length,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return failure result
    return {
      method: DeliveryMethod.EMAIL,
      success: false,
      timestamp: new Date(),
      error: error instanceof Error ? error.message : String(error),
      metadata: { userId, email, notificationCount: notifications.length }
    };
  }
};

/**
 * Validates an email address format
 * @param email - Email address to validate
 * @returns True if email format is valid
 */
const validateEmailAddress = (email: string): boolean => {
  // Basic regex for email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Export the email notification service
export const EmailService = {
  sendEmail,
  sendBulkEmail,
  sendDigestEmail
};

export default EmailService;