# L3 Agent UI - Authentication Setup Guide

## Overview

The L3 Agent UI now includes a comprehensive authentication system that integrates with the Google OAuth 2.0 backend. This guide explains how the authentication works and how to set it up.

## Authentication Flow

1. **Initial Load**: App checks for existing JWT token in localStorage
2. **Login Required**: If no valid token, user sees login screen
3. **Google OAuth**: User clicks login → redirected to Google OAuth
4. **Authorization**: Google redirects back with authorization code
5. **Token Exchange**: Backend exchanges code for JWT token
6. **Session Management**: Frontend stores JWT and uses it for API calls
7. **Auto-logout**: Token expires or user manually logs out

## Architecture Components

### Frontend Components

#### `AuthService` (`src/services/authService.ts`)
- Singleton service for authentication operations
- Handles OAuth URL generation and callback processing
- Manages JWT token storage and retrieval
- Provides user session management

#### `SimpleLogin` (`src/components/Auth/SimpleLogin.tsx`)
- Clean, modern login screen
- Integrates with Google OAuth flow
- Displays loading states and error messages
- Responsive design for all screen sizes

#### `UserHeader` (`src/components/Auth/UserHeader.tsx`)
- Shows authenticated user information
- Displays user avatar with initials
- Provides logout functionality
- Shows user role and email

#### `App` Component (Updated)
- Class-based component managing authentication state
- Handles login/logout flows
- Renders appropriate screens based on auth status
- Manages OAuth callback processing

### Backend Integration

#### API Configuration (`src/services/api.ts`)
- Automatically adds `authToken` header to requests
- Integrates with axios interceptors
- Handles authentication-related API errors

## Setup Instructions

### 1. Backend Configuration

Ensure your L3AgentLight backend is configured with:

```properties
# Google OAuth Configuration
google.client.id=your-google-client-id
google.client.secret=your-google-client-secret
google.redirect.uri=http://localhost:5173/

# JWT Configuration
jwt.secret=your-secure-jwt-secret
jwt.expiration.time=3600000
```

### 2. Frontend Environment

Create a `.env` file in your frontend root:

```env
VITE_API_BASE_URL=http://localhost:8080/l3agent
VITE_APP_NAME=L3 Agent
VITE_APP_VERSION=2.0.0
```

### 3. Google OAuth Setup

1. **Google Cloud Console**:
   - Create a new project or use existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials

2. **Authorized Redirect URIs**:
   - Development: `http://localhost:5173/`
   - Production: `https://your-domain.com/`

3. **Domain Restriction**:
   - Backend enforces `@gainsight.com` domain restriction
   - Only Gainsight employees can authenticate

### 4. User Database Setup

Ensure MongoDB has a `user_details` collection with documents like:

```json
{
  "userId": "unique-user-id",
  "userName": "John Doe", 
  "email": "john.doe@gainsight.com",
  "role": "engineer"
}
```

## Security Features

### ✅ Implemented
- Google OAuth 2.0 integration
- JWT token-based sessions
- Domain-restricted authentication (@gainsight.com)
- Automatic token validation on requests
- Secure token storage in localStorage
- CORS configuration for cross-origin requests
- Request/response logging with user context

### ⚠️ Security Recommendations
- Move secrets to environment variables
- Implement refresh token mechanism
- Add rate limiting on login endpoints
- Restrict CORS to specific origins
- Implement session management
- Add security event logging

## Usage

### For Users
1. Navigate to the L3 Agent UI
2. Click "Continue with Google"
3. Authenticate with your @gainsight.com account
4. Use the application normally
5. Click logout when done

### For Developers
```typescript
// Check authentication status
const authService = AuthService.getInstance();
const isAuthenticated = authService.isAuthenticated();

// Get current user
const user = authService.getUser();

// Logout programmatically
await authService.logout();
```

## API Integration

All API calls automatically include the authentication token:

```typescript
// This automatically includes the authToken header
const response = await api.get('/api/v1/analyze');
```

The backend expects the `authToken` header in all non-login requests.

## Troubleshooting

### Common Issues

1. **"Authentication failed"**
   - Check if user exists in MongoDB user_details collection
   - Verify email domain is @gainsight.com
   - Check backend logs for specific error

2. **OAuth redirect issues**
   - Verify redirect URI matches Google OAuth configuration
   - Check if the callback URL is accessible
   - Ensure CORS is properly configured

3. **Token validation errors**
   - Check JWT secret configuration
   - Verify token hasn't expired
   - Check user still exists in database

### Debug Mode
Enable debug logging by checking browser console for:
- API requests with authentication headers
- Auth service initialization
- OAuth callback processing
- Token validation results

## Testing

### Manual Testing
1. Start the backend: `cd ../L3AgentLight && ./mvnw spring-boot:run`
2. Start the frontend: `npm run dev`
3. Navigate to `http://localhost:5173`
4. Test login flow with a @gainsight.com account

### API Testing
```bash
# Test login endpoint
curl -X GET http://localhost:8080/l3agent/v1/login

# Test authenticated endpoint (with token)
curl -X GET http://localhost:8080/l3agent/api/v1/health \
  -H "authToken: your-jwt-token"
```

## Future Enhancements

1. **Refresh Token Support**: Implement refresh tokens for longer sessions
2. **Role-Based Access Control**: Different UI features based on user roles
3. **Session Management**: Track active sessions and allow session termination
4. **Two-Factor Authentication**: Add additional security layer
5. **Social Login Options**: Support for other OAuth providers
6. **Remember Me**: Optional persistent sessions

## Support

For authentication-related issues:
1. Check this guide first
2. Review backend logs for detailed error messages
3. Check browser console for frontend errors
4. Contact the L3 Agent development team 