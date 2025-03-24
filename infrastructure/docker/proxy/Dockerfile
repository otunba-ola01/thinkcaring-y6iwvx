FROM nginx:1.25-alpine

LABEL maintainer="HCBS Revenue Management System" description="NGINX proxy for HCBS Revenue Management System"

# Install required tools for health checks and SSL operations
RUN apk add --no-cache curl openssl

# Remove default NGINX configuration files
RUN rm -rf /etc/nginx/conf.d/* && rm -f /etc/nginx/nginx.conf

# Copy custom NGINX configuration file
COPY proxy/nginx.conf /etc/nginx/nginx.conf

# Create directories for SSL certificates and NGINX cache
RUN mkdir -p /etc/nginx/ssl /var/cache/nginx

# Set proper ownership for security
RUN chown -R nginx:nginx /var/cache/nginx /etc/nginx/ssl

# Set proper permissions for security
RUN chmod -R 770 /var/cache/nginx && chmod -R 750 /etc/nginx/ssl

# Expose HTTP and HTTPS ports
EXPOSE 80 443

# Define health check for container orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD curl -f http://localhost/health || exit 1

# Run NGINX as non-root user for security
USER nginx

# Start NGINX in foreground mode for proper container operation
CMD ["nginx", "-g", "daemon off;"]