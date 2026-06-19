FROM node:20-slim

# Install native dependencies required by sharp and other packages
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libvips-dev \
    libvips42 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 3000

CMD ["node", "server.js"]
