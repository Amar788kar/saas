# Multi-stage build for Go backend
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install git and build essentials
RUN apk add --no-cache git ca-certificates tzdata

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/crm-api cmd/api/main.go

# Production minimal container
FROM alpine:3.20

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata curl

# Copy compiled binary and migrations
COPY --from=builder /app/crm-api /app/crm-api
COPY --from=builder /app/migrations /app/migrations

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/api/v1/health || exit 1

ENTRYPOINT ["/app/crm-api"]
