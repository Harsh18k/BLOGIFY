const JWT = require('jsonwebtoken');
const secret = 'harshsecretkey';

function generateToken(user) {
    const payload = {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profileImageURL: user.profileImageURL,
        role: user.role
    };
    const token = JWT.sign(payload, secret, { expiresIn: '1h' });
    return token;
}
function verifyToken(token) {
    try {
        const payload = JWT.verify(token, secret);
        return payload;
    } catch (err) {
        return null;
    }
}
module.exports = {
    generateToken,
    verifyToken
};
