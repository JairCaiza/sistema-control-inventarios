const {
    registrarDevolucionSchema
} = require("./devoluciones.schema");

const devolucionesService = require("./devoluciones.service");

const registrar = async (req, res, next) => {
    try {
        const { error } = registrarDevolucionSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const result = await devolucionesService.registrar(req.body);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        next(error);
    }
};
const listar = async (req, res, next) => {
    try {
        const data = await devolucionesService.listar();

        res.json({
            success: true,
            data
        });

    } catch (error) {
        next(error);
    }
};

const obtenerPorId = async (req, res, next) => {
    try {
        const data = await devolucionesService.obtenerPorId(req.params.id);

        res.json({
            success: true,
            data
        });

    } catch (error) {
        next(error);
    }
};
module.exports = {
    registrar,
    listar,
    obtenerPorId

};