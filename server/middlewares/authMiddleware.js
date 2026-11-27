
export const protect = (req, res, next) => {
    try {
        const a = req.auth();
        console.log("USER", a.userId);
        console.log("REASON",JSON.stringify(a.debug?.(),null,2));
        console.log('REQUEST:', req.method, req.originalUrl);
        console.log(
            'AUTHORIZATION HEADER:',
            req.headers.authorization ? 'Present' : 'Missing'
        );

        const { userId } = req.auth();

        if (!userId) {
            return res.status(401).json({
                message: 'Unauthorized: Please login first'
            });
        }

        console.log('Authenticated User:', userId);

        next();

    } catch (error) {
        console.error('Authentication Error:', error.message);

        return res.status(401).json({
            message: 'Authentication failed'
        });
    }
};
