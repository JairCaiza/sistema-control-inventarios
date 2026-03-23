const contratosService = require("./contratos.service");
const { crearContratoSchema, agregarActivoSchema } = require("./contratos.schema");

const crear = async (req, res, next) => {

    try {

        const { error } = crearContratoSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const contrato = await contratosService.crearContrato(req.body);

        res.status(201).json({
            success: true,
            data: contrato
        });

    } catch (error) {
        next(error);
    }
};


const listar = async (req, res, next) => {

    try {

        const contratos = await contratosService.listarContratos();

        res.json({
            success: true,
            data: contratos
        });

    } catch (error) {
        next(error);
    }

};

const agregarActivo = async (req, res, next) => {

    try {

        const { error } = agregarActivoSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const contrato_id = req.params.id;

        await contratosService.agregarActivoContrato(
            contrato_id,
            req.body
        );

        res.json({
            success: true,
            message: "Activo agregado al contrato"
        });

    } catch (error) {

        next(error);

    }

};

module.exports = {
    crear,
    listar, agregarActivo
};