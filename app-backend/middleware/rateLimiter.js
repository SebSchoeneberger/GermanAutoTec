import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: {
        status: 'error',
        message: 'Too many login attempts, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/** Limits brute force on QR / punch endpoint (per IP). */
export const timePunchLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: {
        status: 'error',
        message: 'Too many check-in attempts. Wait a minute and try again.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

export const timeCorrectionCreateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    message: {
        status: 'error',
        message: 'Too many correction requests. Wait a minute and try again.'
    },
    standardHeaders: true,
    legacyHeaders: false
});