FROM node:20-alpine

# Install native dependencies required by sharp and other packages
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev \
    vips \
    libc6-compat

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 3000

CMD ["node", "server.js"]
