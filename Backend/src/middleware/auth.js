import jwt from 'jsonwebtoken'

// Middleware to verify JWT and authenticate user
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Check for Bearer token
    if (!authHeader?.startsWith('Bearer')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify token and attach decoded user to request
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        next(); // Proceed to next middleware/controller
    } catch {
        // Token invalid or expired
        res.status(401).json({ message: 'Invalid or expired token' });
    }
}

export default authenticate;