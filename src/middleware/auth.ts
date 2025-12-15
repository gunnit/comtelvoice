import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../db/services/auth.js';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      email: string;
    };
  }
}

// Paths that don't require authentication
const PUBLIC_PATHS = [
  '/',
  '/incoming-call',
  '/outbound-call',
  '/call-status',
  '/transfer-complete',
  '/transfer-status',
  '/media-stream',
  '/api/auth/login',
  '/api/auth/register',
];

// Paths that start with these prefixes are public (for WebSocket upgrade)
const PUBLIC_PREFIXES = [
  '/media-stream',
];

/**
 * Authentication middleware for Fastify
 * Checks Authorization header for Bearer token and validates it
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const path = request.url.split('?')[0];

  // Skip auth for public paths
  if (PUBLIC_PATHS.includes(path)) {
    return;
  }

  // Skip auth for public prefixes
  for (const prefix of PUBLIC_PREFIXES) {
    if (path.startsWith(prefix)) {
      return;
    }
  }

  // Skip auth for non-API paths (static files, etc.)
  if (!path.startsWith('/api/')) {
    return;
  }

  // Check Authorization header
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      success: false,
      error: 'Autenticazione richiesta',
    });
  }

  const token = authHeader.substring(7);

  // Verify JWT
  const payload = authService.verifyToken(token);
  if (!payload) {
    return reply.status(401).send({
      success: false,
      error: 'Token non valido o scaduto',
    });
  }

  // Validate session exists in database (allows logout/revocation)
  const isValidSession = await authService.validateSession(token);
  if (!isValidSession) {
    return reply.status(401).send({
      success: false,
      error: 'Sessione scaduta. Effettua nuovamente il login.',
    });
  }

  // Attach user to request
  request.user = payload;
}
