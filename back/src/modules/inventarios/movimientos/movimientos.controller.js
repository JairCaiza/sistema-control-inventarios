const { crearMovimiento } = require("./movimientos.service");
const { crearMovimientoSchema } = require("./movimientos.schema");

const crear = async (req, res) => {

    try {

        const { error } = crearMovimientoSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const movimiento = await crearMovimiento(req.body);

        res.status(201).json({
            success: true,
            data: movimiento
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
const { obtenerHistorialPorActivo } = require("./movimientos.service");

const historial = async (req, res) => {

    try {

        const { activo_id } = req.params;

        const movimientos = await obtenerHistorialPorActivo(activo_id);

        res.json({
            success: true,
            data: movimientos
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};

module.exports = {
    crear, historial
};