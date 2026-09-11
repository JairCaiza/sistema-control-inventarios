const jwt = require("jsonwebtoken");

/* =====================================================
   GENERAR TOKEN JWT
===================================================== */

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,

            roles: user.roles
        },

        process.env.JWT_SECRET,

        {
            expiresIn:
                process.env.JWT_EXPIRES_IN
        }
    );
};

module.exports = generateToken;