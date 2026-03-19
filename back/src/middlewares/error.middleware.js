const errorHandler = (err, req, res, next) => {
    console.error('🔥 Error:', err.message);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor'
    });
};

module.exports = errorHandler;
