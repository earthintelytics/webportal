# ==============================================================================
# Farmintelytics Web Portal Development Container Image Definition
# React + Vite Client Dashboard & Super Admin Console
# ==============================================================================

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies with legacy peer deps support
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy application source code
COPY . .

# Expose Vite development server port
EXPOSE 5173

# Start development server bound to all network interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
