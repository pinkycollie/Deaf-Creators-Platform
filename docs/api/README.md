# API Documentation

This document provides an overview of the V0 Deaf Creator Platform API.

## Base URL

```
Production: https://api.deafcreator.com/v1
Staging: https://staging-api.deafcreator.com/v1
Development: http://localhost:3000/api
```

## Authentication

All API requests require authentication using JWT tokens.

### Headers

```http
Authorization: Bearer <token>
X-Tenant-ID: <tenant_uuid>
Content-Type: application/json
```

## Endpoints

### Video API

#### Upload Video

```http
POST /api/upload
Content-Type: multipart/form-data

{
  "file": <video_file>,
  "title": "string",
  "description": "string",
  "tags": ["string"],
  "visibility": "public|private|unlisted"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "uploadUrl": "string",
    "status": "processing"
  }
}
```

#### Get Video

```http
GET /api/video/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "fileUrl": "string",
    "thumbnailUrl": "string",
    "duration": 120,
    "status": "ready",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Video Rooms

#### Create Room

```http
POST /api/video/rooms
```

**Request:**
```json
{
  "name": "string",
  "isPrivate": false,
  "maxParticipants": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roomId": "string",
    "joinUrl": "string",
    "token": "string"
  }
}
```

#### Join Room

```http
POST /api/video/rooms/:roomId/join
```

### Gesture Recognition

#### Analyze Gesture

```http
POST /api/video/gestures/analyze
Content-Type: multipart/form-data

{
  "video": <video_file>,
  "model": "asl_v1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "gestures": [
      {
        "timestamp": 1.5,
        "duration": 0.8,
        "gesture": "hello",
        "confidence": 0.95
      }
    ]
  }
}
```

### Content API

#### List Content

```http
GET /api/content?page=1&limit=20&status=published
```

#### Create Content

```http
POST /api/content
```

**Request:**
```json
{
  "title": "string",
  "description": "string",
  "contentType": "video|image|article",
  "tags": ["string"],
  "visibility": "public|private"
}
```

### Marketplace API

#### List NFTs

```http
GET /api/marketplace/nfts?page=1&limit=20
```

#### Mint NFT

```http
POST /api/nft/mint
```

**Request:**
```json
{
  "contentId": "uuid",
  "price": "0.1",
  "currency": "ETH",
  "royaltyPercentage": 10
}
```

### Creator Dispatch API

#### List Available Creators

```http
GET /api/dispatch/creators?skills=asl,editing&availability=available
```

#### Create Request

```http
POST /api/dispatch/requests
```

**Request:**
```json
{
  "title": "string",
  "description": "string",
  "requirements": {
    "skills": ["asl", "editing"],
    "duration": 60,
    "deadline": "2024-12-31T00:00:00Z"
  },
  "budget": {
    "amount": 500,
    "currency": "USD"
  }
}
```

### Video Matching API

#### Search Videos

```http
POST /api/matching/search
```

**Request:**
```json
{
  "query": "string",
  "filters": {
    "tags": ["string"],
    "duration": { "min": 30, "max": 300 },
    "quality": "hd"
  },
  "limit": 20
}
```

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limiting

API requests are rate limited per tenant:

| Plan | Requests/min | Requests/day |
|------|--------------|--------------|
| Free | 60 | 1,000 |
| Pro | 300 | 10,000 |
| Enterprise | Custom | Custom |

Rate limit headers are included in all responses:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1609459200
```

## Webhooks

Configure webhooks to receive real-time notifications:

```http
POST /api/webhooks
```

**Request:**
```json
{
  "url": "https://your-server.com/webhook",
  "events": ["video.processed", "nft.sold", "content.published"]
}
```

### Webhook Events

- `video.uploaded` - Video upload completed
- `video.processed` - Video processing finished
- `video.transcribed` - Captions generated
- `content.published` - Content made public
- `nft.minted` - NFT successfully minted
- `nft.sold` - NFT transaction completed
- `creator.assigned` - Creator assigned to request
