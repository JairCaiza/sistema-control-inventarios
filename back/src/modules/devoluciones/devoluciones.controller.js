const {
    registrarDevolucionSchema
} = require("./devoluciones.schema");

const devolucionesService =
    require("./devoluciones.service");

/* =====================================================
   CONFIGURACIÓN JOI
===================================================== */

const OPCIONES_JOI = {
    abortEarly: false,
    stripUnknown: true,
    convert: true
};

/* =====================================================
   FORMATEAR ERRORES JOI
===================================================== */

const formatearErroresJoi = (
    error
) => {

    if (
        !error ||
        !Array.isArray(
            error.details
        )
    ) {
        return [];
    }

    return error.details.map(
        (detalle) => ({
            campo:
                detalle.path.length > 0
                    ? detalle.path.join(".")
                    : null,

            mensaje:
                detalle.message
        })
    );
};

/* =====================================================
   REGISTRAR DEVOLUCIÓN
===================================================== */

const registrar = async (
    req,
    res,
    next
) => {

    try {

        /* =============================================
           VALIDAR BODY
        ============================================= */

        const {
            error,
            value
        } =
            registrarDevolucionSchema
                .validate(
                    req.body,
                    OPCIONES_JOI
                );

        if (error) {

            return res
                .status(400)
                .json({
                    success: false,

                    message:
                        "Los datos enviados para registrar la devolución no son válidos.",

                    errors:
                        formatearErroresJoi(
                            error
                        )
                });
        }

        /* =============================================
           REGISTRAR
        ============================================= */

        const result =
            await devolucionesService
                .registrar(
                    value
                );

        return res
            .status(201)
            .json({
                success: true,

                message:
                    result.mensaje ||
                    "Devolución registrada correctamente.",

                data:
                    result
            });

    } catch (error) {

        /*
         * Dejamos que el middleware global
         * maneje errores de negocio y BD.
         */
        next(error);
    }
};

/* =====================================================
   LISTAR DEVOLUCIONES
===================================================== */

const listar = async (
    req,
    res,
    next
) => {

    try {

        const data =
            await devolucionesService
                .listar();

        return res
            .status(200)
            .json({
                success: true,

                message:
                    "Devoluciones obtenidas correctamente.",

                total:
                    data.length,

                data
            });

    } catch (error) {

        next(error);
    }
};

/* =====================================================
   OBTENER DEVOLUCIÓN POR ID
===================================================== */

const obtenerPorId = async (
    req,
    res,
    next
) => {

    try {

        const {
            id
        } = req.params;

        if (!id) {

            return res
                .status(400)
                .json({
                    success: false,

                    message:
                        "Debe enviar el identificador de la devolución."
                });
        }

        const data =
            await devolucionesService
                .obtenerPorId(
                    id
                );

        return res
            .status(200)
            .json({
                success: true,

                message:
                    "Devolución obtenida correctamente.",

                data
            });

    } catch (error) {

        next(error);
    }
};

/* =====================================================
   RESUMEN GENERAL DE DEVOLUCIONES
===================================================== */

const resumen = async (
    req,
    res,
    next
) => {

    try {

        const data =
            await devolucionesService
                .obtenerResumen();

        return res
            .status(200)
            .json({
                success: true,

                message:
                    "Resumen de devoluciones obtenido correctamente.",

                data
            });

    } catch (error) {

        next(error);
    }
};

/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
    registrar,
    listar,
    obtenerPorId,
    resumen
};