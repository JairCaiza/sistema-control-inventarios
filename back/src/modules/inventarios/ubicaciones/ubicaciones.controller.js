const {
    crearUbicacion,
    listarUbicaciones,
    actualizarUbicacion,
    eliminarUbicacion
} = require("./ubicaciones.service");

const {
    crearUbicacionSchema,
    actualizarUbicacionSchema
} = require("./ubicaciones.schema");


const crear = async (req, res) => {

    try {

        const { error } = crearUbicacionSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const ubicacion = await crearUbicacion(req.body);

        res.status(201).json({
            success: true,
            data: ubicacion
        });

    } catch (error) {

        if (error.code === "23505") {
            return res.status(400).json({
                success: false,
                message: "La ubicación ya existe"
            });
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const listar = async (req, res) => {

    try {

        const ubicaciones = await listarUbicaciones();

        res.json({
            success: true,
            data: ubicaciones
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const actualizar = async (req, res) => {

    try {

        const { error } = actualizarUbicacionSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const ubicacion = await actualizarUbicacion(req.params.id, req.body);

        if (!ubicacion) {
            return res.status(404).json({
                success: false,
                message: "Ubicación no encontrada"
            });
        }

        res.json({
            success: true,
            data: ubicacion
        });

    } catch (error) {

        if (error.code === "23505") {
            return res.status(400).json({
                success: false,
                message: "La ubicación ya existe"
            });
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const eliminar = async (req, res) => {
    try {
        const ubicacion = await eliminarUbicacion(req.params.id);

        if (!ubicacion) {
            return res.status(404).json({
                success: false,
                message: "Ubicación no encontrada",
            });
        }

        res.json({
            success: true,
            message: "Ubicación eliminada correctamente",
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};


module.exports = {
    crear,
    listar,
    actualizar,
    eliminar
};