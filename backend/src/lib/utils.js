import jwt from 'jsonwebtoken';

export const generateToken = (userId, res) => {
    const token = jwt.sign({id: userId}, process.env.JWT_SECRET, {
        expiresIn: '1d',
    });

    res.cookie('token', token, {
        httpOnly: true, //prevent xss attack
        secure: process.env.NODE_ENV === 'development' ? false : true, //https
        sameSite: 'strict', // CSRF attacks
        maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return token;
};