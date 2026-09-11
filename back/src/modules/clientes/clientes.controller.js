const clientesService = require("./clientes.service");

const {
    crearClienteSchema,
    actualizarClienteSchema
} = require("./clientes.schema");

/* =====================================================
   MANEJAR ERRORES
===================================================== */

const manejarError = (
    error,
    res,
    mensajePredeterminado
) => {
    console.error(
        mensajePredeterminado,
        error
    );

    /* =================================================
       UUID INVÁLIDO
    ================================================= */

    if (error.code === "22P02") {
        return res.status(400).json({
            success: false,
            message:
                "El identificador del cliente no es válido"
        });
    }

    /* =================================================
       UNIQUE
    ================================================= */

    if (error.code === "23505") {
        /*
         * PostgreSQL puede llegar aquí si dos
         * solicitudes intentan registrar el mismo
         * dato prácticamente al mismo tiempo.
         */
        if (
            error.constraint ===
            "clientes_identificacion_key"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Ya existe un cliente con esa identificación"
            });
        }

        if (
            error.constraint ===
            "uq_clientes_correo"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Ya existe un cliente con ese correo electrónico"
            });
        }

        return res.status(409).json({
            success: false,
            message:
                "Ya existe un cliente con esos datos"
        });
    }

    /* =================================================
       FOREIGN KEY
    ================================================= */

    if (error.code === "23503") {
        return res.status(409).json({
            success: false,
            message:
                "No se puede completar la operación porque el cliente tiene registros relacionados"
        });
    }

    /* =================================================
       ERROR DE NEGOCIO DEL SERVICE
    ================================================= */

    return res
        .status(
            error.statusCode ||
            500
        )
        .json({
            success: false,

            message:
                error.message ||
                mensajePredeterminado
        });
};

/* =====================================================
   CREAR
===================================================== */

const crear = async (
    req,
    res
) => {
    try {
        const {
            error,
            value
        } =
            crearClienteSchema.validate(
                req.body,
                {
                    abortEarly: false,
                    stripUnknown: true
                }
            );

        if (error) {
            return res.status(400).json({
                success: false,

                message:
                    "Los datos enviados no son válidos",

                errors:
                    error.details.map(
                        (detalle) =>
                            detalle.message
                    )
            });
        }

        const cliente =
            await clientesService
                .crearCliente(
                    value
                );

        return res
            .status(201)
            .json({
                success: true,

                message:
                    "Cliente creado correctamente",

                data:
                    cliente
            });

    } catch (error) {

        return manejarError(
            error,
            res,
            "Error al crear el cliente"
        );
    }
};

/* =====================================================
   LISTAR
===================================================== */

const listar = async (
    req,
    res
) => {
    try {
        const clientes =
            await clientesService
                .listarClientes();

        return res
            .status(200)
            .json({
                success: true,

                total:
                    clientes.length,

                data:
                    clientes
            });

    } catch (error) {

        return manejarError(
            error,
            res,
            "Error al listar los clientes"
        );
    }
};

/* =====================================================
   OBTENER
===================================================== */

const obtener = async (
    req,
    res
) => {
    try {
        const cliente =
            await clientesService
                .obtenerCliente(
                    req.params.id
                );

        return res
            .status(200)
            .json({
                success: true,

                data:
                    cliente
            });

    } catch (error) {

        return manejarError(
            error,
            res,
            "Error al obtener el cliente"
        );
    }
};

/* =====================================================
   ACTUALIZAR
===================================================== */

const actualizar = async (
    req,
    res
) => {
    try {
        const {
            error,
            value
        } =
            actualizarClienteSchema
                .validate(
                    req.body,
                    {
                        abortEarly: false,
                        stripUnknown: true
                    }
                );

        if (error) {
            return res.status(400).json({
                success: false,

                message:
                    "Los datos enviados no son válidos",

                errors:
                    error.details.map(
                        (detalle) =>
                            detalle.message
                    )
            });
        }

        const cliente =
            await clientesService
                .actualizarCliente(
                    req.params.id,
                    value
                );

        return res
            .status(200)
            .json({
                success: true,

                message:
                    "Cliente actualizado correctamente",

                data:
                    cliente
            });

    } catch (error) {

        return manejarError(
            error,
            res,
            "Error al actualizar el cliente"
        );
    }
};

/* =====================================================
   ELIMINAR
===================================================== */

const eliminar = async (
    req,
    res
) => {
    try {
        const cliente =
            await clientesService
                .eliminarCliente(
                    req.params.id
                );

        return res
            .status(200)
            .json({
                success: true,

                message:
                    "Cliente eliminado correctamente",

                data:
                    cliente
            });

    } catch (error) {

        return manejarError(
            error,
            res,
            "Error al eliminar el cliente"
        );
    }
};

/* =====================================================
   EXPORTACIONES
===================================================== */

module.exports = {
    crear,
    listar,
    obtener,
    actualizar,
    eliminar
};