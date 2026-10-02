# CareSync API Documentation

## Base URL
- Development: `http://localhost:3000`
- Production: `https://api.yourdomain.com`

## Authentication
All endpoints (except `/auth/register`, `/auth/login`) require a Bearer token:
```
Authorization: Bearer <access_token>
```

---

## Authentication Endpoints

### POST `/auth/register`
Register a new user
```json
Request:
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "role": "PATIENT"
}

Response:
{
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "PATIENT"
  }
}
```

### POST `/auth/login`
Login user
```json
Request:
{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response:
{
  "data": {
    "accessToken": "jwt_token...",
    "refreshToken": "refresh_token...",
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "PATIENT"
    }
  }
}
```

### POST `/auth/refresh`
Refresh access token
```json
Request:
{
  "refreshToken": "refresh_token..."
}

Response:
{
  "data": {
    "accessToken": "new_jwt_token..."
  }
}
```

### GET `/auth/me`
Get current user
```json
Response:
{
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "PATIENT"
  }
}
```

---

## Search & Discovery Endpoints

### GET `/api/doctors`
List all doctors
```
Query Parameters:
- specialty: Filter by specialty
- clinic: Filter by clinic
- status: Filter by status
- page: Pagination (default 1)
- limit: Items per page (default 10)

Response:
{
  "data": [
    {
      "id": "doc_123",
      "name": "Dr. Sharma",
      "specialty": "Cardiology",
      "clinic": "City Clinic",
      "status": "AVAILABLE",
      "rating": 4.8,
      "fee": 500
    }
  ],
  "total": 150,
  "page": 1
}
```

### GET `/api/doctors/:id`
Get doctor details
```json
Response:
{
  "data": {
    "id": "doc_123",
    "name": "Dr. Sharma",
    "email": "dr.sharma@clinic.com",
    "specialty": "Cardiology",
    "clinic": "City Clinic",
    "status": "AVAILABLE",
    "rating": 4.8,
    "yearsExperience": 15,
    "fee": 500,
    "statusHistory": [
      {
        "status": "AVAILABLE",
        "changedAt": "2024-10-01T12:00:00Z"
      }
    ]
  }
}
```

### GET `/api/specialties`
List all specialties
```json
Response:
{
  "data": [
    {
      "id": "spec_1",
      "name": "Cardiology",
      "description": "Heart and cardiovascular system"
    }
  ]
}
```

### GET `/api/doctors/:id/available-slots`
Get available slots
```
Query Parameters:
- date: YYYY-MM-DD format
- limit: How many slots (default 5)

Response:
{
  "data": [
    {
      "slotId": "slot_123",
      "startTime": "2024-10-05T14:00:00Z",
      "endTime": "2024-10-05T14:30:00Z",
      "available": true
    }
  ]
}
```

---

## Appointment Endpoints

### POST `/api/appointments`
Book appointment
```json
Request:
{
  "doctorId": "doc_123",
  "slotId": "slot_123",
  "patientNotes": "Regular checkup"
}

Response:
{
  "data": {
    "id": "apt_123",
    "doctorId": "doc_123",
    "patientId": "patient_123",
    "scheduledAt": "2024-10-05T14:00:00Z",
    "status": "SCHEDULED",
    "fee": 500,
    "queueToken": 5
  }
}
```

### GET `/api/appointments`
List user's appointments
```
Query Parameters:
- status: SCHEDULED, COMPLETED, CANCELLED
- page: Pagination

Response:
{
  "data": [
    {
      "id": "apt_123",
      "doctor": {
        "id": "doc_123",
        "name": "Dr. Sharma"
      },
      "scheduledAt": "2024-10-05T14:00:00Z",
      "status": "SCHEDULED",
      "fee": 500
    }
  ]
}
```

### PATCH `/api/appointments/:id`
Update appointment
```json
Request:
{
  "status": "CANCELLED"
}

Response:
{
  "data": {
    "id": "apt_123",
    "status": "CANCELLED"
  }
}
```

### POST `/api/appointments/:id/cancel`
Cancel appointment (triggers refund)
```json
Response:
{
  "data": {
    "id": "apt_123",
    "status": "CANCELLED",
    "refundId": "ref_123"
  }
}
```

---

## Feature Endpoints: Doctor Status

### POST `/features/doctor-status/update`
Update doctor status
```json
Request:
{
  "status": "RUNNING_LATE",
  "reason": "Traffic jam"
}

Response:
{
  "data": {
    "doctorId": "doc_123",
    "status": "RUNNING_LATE",
    "updatedAt": "2024-10-01T12:30:00Z"
  }
}
```

### GET `/features/doctor-status/:doctorId`
Get doctor status
```json
Response:
{
  "data": {
    "doctorId": "doc_123",
    "status": "RUNNING_LATE",
    "lastUpdated": "2024-10-01T12:30:00Z",
    "history": [
      {
        "status": "AVAILABLE",
        "changedAt": "2024-10-01T09:00:00Z"
      }
    ]
  }
}
```

---

## Feature Endpoints: Queue

### POST `/features/queue/check-in`
Check in for appointment
```json
Request:
{
  "appointmentId": "apt_123"
}

Response:
{
  "data": {
    "queueEntryId": "queue_123",
    "tokenNumber": 5,
    "position": 5,
    "etaMinutes": 40
  }
}
```

### GET `/features/queue/:clinicId`
Get queue status
```json
Response:
{
  "data": {
    "clinicId": "clinic_123",
    "currentToken": 3,
    "totalTokens": 10,
    "queue": [
      {
        "position": 1,
        "tokenNumber": 4,
        "patientName": "John Doe",
        "etaMinutes": 5
      }
    ]
  }
}
```

### GET `/features/queue/position/:appointmentId`
Get queue position
```json
Response:
{
  "data": {
    "position": 5,
    "etaMinutes": 40,
    "totalInQueue": 10
  }
}
```

### POST `/features/queue/next`
Call next patient (doctor only)
```json
Response:
{
  "data": {
    "nextTokenNumber": 4,
    "nextPatientName": "John Doe"
  }
}
```

---

## Feature Endpoints: Refunds

### POST `/features/refunds`
Request refund
```json
Request:
{
  "appointmentId": "apt_123",
  "reason": "Doctor cancelled"
}

Response:
{
  "data": {
    "id": "ref_123",
    "appointmentId": "apt_123",
    "amount": 500,
    "status": "REQUESTED",
    "requestedAt": "2024-10-01T12:00:00Z"
  }
}
```

### GET `/features/refunds`
List refunds
```
Query Parameters:
- status: REQUESTED, APPROVED, PROCESSING, CREDITED, REJECTED
- page: Pagination

Response:
{
  "data": [
    {
      "id": "ref_123",
      "appointmentId": "apt_123",
      "amount": 500,
      "status": "APPROVED",
      "timeline": [
        {
          "status": "REQUESTED",
          "timestamp": "2024-10-01T12:00:00Z"
        }
      ]
    }
  ]
}
```

### PATCH `/features/refunds/:id/approve` (Admin only)
Approve refund
```json
Response:
{
  "data": {
    "id": "ref_123",
    "status": "APPROVED"
  }
}
```

### PATCH `/features/refunds/:id/reject` (Admin only)
Reject refund
```json
Request:
{
  "reason": "Not eligible for refund"
}

Response:
{
  "data": {
    "id": "ref_123",
    "status": "REJECTED"
  }
}
```

---

## Feature Endpoints: Support Chat

### POST `/features/support/tickets`
Create support ticket
```json
Request:
{
  "category": "REFUND",
  "message": "Where is my refund?"
}

Response:
{
  "data": {
    "id": "ticket_123",
    "status": "WAITING_FOR_AGENT",
    "createdAt": "2024-10-01T12:00:00Z"
  }
}
```

### GET `/features/support/tickets`
List tickets
```
Query Parameters:
- status: WAITING_FOR_AGENT, WITH_AGENT, RESOLVED
- page: Pagination

Response:
{
  "data": [
    {
      "id": "ticket_123",
      "category": "REFUND",
      "status": "WITH_AGENT",
      "messages": 5,
      "lastMessage": "2024-10-01T12:30:00Z"
    }
  ]
}
```

### POST `/features/support/tickets/:id/messages`
Send message
```json
Request:
{
  "message": "Can you help me?"
}

Response:
{
  "data": {
    "messageId": "msg_123",
    "content": "Can you help me?",
    "sender": "PATIENT",
    "timestamp": "2024-10-01T12:00:30Z"
  }
}
```

### GET `/features/support/tickets/:id/messages`
Get chat messages
```json
Response:
{
  "data": [
    {
      "messageId": "msg_123",
      "content": "Can you help me?",
      "sender": "PATIENT",
      "timestamp": "2024-10-01T12:00:30Z"
    }
  ]
}
```

### POST `/features/support/tickets/:id/escalate` (Agent only)
Escalate to agent
```json
Response:
{
  "data": {
    "id": "ticket_123",
    "status": "WITH_AGENT",
    "agentId": "agent_456"
  }
}
```

---

## Feature Endpoints: Symptom Matching

### POST `/features/symptom-match`
Match symptoms to specialists
```json
Request:
{
  "symptoms": "Chest pain, shortness of breath",
  "age": 45,
  "gender": "M"
}

Response:
{
  "data": {
    "matches": [
      {
        "specialty": "Cardiology",
        "confidence": 0.95,
        "reason": "Chest pain is a primary symptom",
        "doctors": [
          {
            "id": "doc_123",
            "name": "Dr. Sharma",
            "fee": 500,
            "available": true
          }
        ]
      }
    ],
    "redFlags": ["Chest pain"],
    "emergencyGuidance": "Call 911 if symptoms persist"
  }
}
```

---

## Feature Endpoints: Price Match

### GET `/features/pricing/fees/:doctorId`
Get doctor fees
```json
Response:
{
  "data": {
    "doctorId": "doc_123",
    "currentFee": 500,
    "history": [
      {
        "fee": 450,
        "validFrom": "2024-09-01",
        "validUntil": "2024-10-01"
      }
    ]
  }
}
```

### POST `/features/pricing/disputes`
File price dispute
```json
Request:
{
  "appointmentId": "apt_123",
  "claimedFee": 450,
  "evidenceUrl": "https://..."
}

Response:
{
  "data": {
    "id": "dispute_123",
    "appointmentId": "apt_123",
    "lockedFee": 500,
    "claimedFee": 450,
    "status": "PENDING",
    "createdAt": "2024-10-01T12:00:00Z"
  }
}
```

### GET `/features/pricing/disputes` (Admin only)
List disputes
```json
Response:
{
  "data": [
    {
      "id": "dispute_123",
      "appointmentId": "apt_123",
      "patientName": "John Doe",
      "lockedFee": 500,
      "claimedFee": 450,
      "status": "PENDING",
      "evidence": "url"
    }
  ]
}
```

### PATCH `/features/pricing/disputes/:id/resolve` (Admin only)
Resolve dispute
```json
Request:
{
  "approved": true,
  "refundAmount": 50
}

Response:
{
  "data": {
    "id": "dispute_123",
    "status": "RESOLVED",
    "refundId": "ref_123"
  }
}
```

---

## Error Handling

All errors follow this format:
```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Email is required",
    "status": 400
  }
}
```

### Common Error Codes
- `INVALID_INPUT`: 400
- `UNAUTHORIZED`: 401
- `FORBIDDEN`: 403
- `NOT_FOUND`: 404
- `CONFLICT`: 409
- `INTERNAL_ERROR`: 500

---

## Rate Limiting

- Default: 100 requests per minute per IP
- Authentication endpoints: 10 requests per minute
- Real-time: Unlimited (WebSocket)

---

## WebSocket Events (Real-Time)

### Doctor Status
```
event: doctor:status:changed
payload: {
  doctorId: string,
  status: string,
  updatedAt: date
}
```

### Queue Updates
```
event: queue:updated
payload: {
  clinicId: string,
  currentToken: number,
  totalTokens: number
}
```

### Chat Messages
```
event: chat:message:received
payload: {
  ticketId: string,
  userId: string,
  message: string,
  isAgent: boolean
}
```

### Notifications
```
event: notification:sent
payload: {
  type: string,
  title: string,
  message: string
}
```

---

**Last Updated**: October 1, 2024  
**Status**: Complete & Production Ready
