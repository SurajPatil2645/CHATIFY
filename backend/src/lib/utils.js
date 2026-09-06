import jwt from 'jsonwebtoken';
import { ENV } from './env.js';

export const generateToken = (userId, res) => {
    const token = jwt.sign({id: userId}, ENV.JWT_SECRET, {
        expiresIn: '1d',
    });

    res.cookie('token', token, {
        httpOnly: true, //prevent xss attack
        secure: ENV.NODE_ENV === 'development' ? false : true, //https
        sameSite: 'strict', // CSRF attacks
        maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return token;
};