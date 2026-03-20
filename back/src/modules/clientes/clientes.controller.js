const clientesService = require("./clientes.service");
const { crearClienteSchema } = require("./clientes.schema");


const crear = async (req, res, next) => {

    try {

        const { error } = crearClienteSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const cliente = await clientesService.crearCliente(req.body);

        res.status(201).json({
            success: true,
            data: cliente
        });

    } catch (error) {
        next(error);
    }
};


const listar = async (req, res, next) => {

    try {

        const clientes = await clientesService.listarClientes();

        res.json({
            success: true,
            data: clientes
        });

    } catch (error) {
        next(error);
    }
};


const obtener = async (req, res, next) => {

    try {

        const cliente = await clientesService.obtenerCliente(req.params.id);

        res.json({
            success: true,
            data: cliente
        });

    } catch (error) {
        next(error);
    }
};


const actualizar = async (req, res, next) => {

    try {

        const cliente = await clientesService.actualizarCliente(
            req.params.id,
            req.body
        );

        res.json({
            success: true,
            data: cliente
        });

    } catch (error) {
        next(error);
    }
};


const eliminar = async (req, res, next) => {

    try {

        await clientesService.eliminarCliente(req.params.id);

        res.json({
            success: true,
            message: "Cliente eliminado"
        });

    } catch (error) {
        next(error);
    }
};


module.exports = {
    crear,
    listar,
    obtener,
    actualizar,
    eliminar
};