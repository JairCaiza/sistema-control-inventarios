const { crearActivo, listarActivos } = require("./activos.service");
const { crearActivoSchema } = require("./activos.schema");

const crear = async (req, res) => {

    try {

        const { error } = crearActivoSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const activo = await crearActivo(req.body);

        res.status(201).json({
            success: true,
            data: activo
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const listar = async (req, res) => {

    try {

        const activos = await listarActivos();

        res.json({
            success: true,
            data: activos
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    crear,
    listar
};