const {
    crearAporteSocioSchema,
    actualizarAporteSocioSchema,
    cambiarEstadoAporteSchema
} = require("./aporteSocio.schema");

const {
    crearAporteSocio,
    listarAportesSocios,
    obtenerMisAportes,
    obtenerMovimientoPorId,
    actualizarAporteSocio,
    cambiarEstadoAporteSocio,
    eliminarAporteSocio,
    obtenerResumenAportes
} = require("./aporteSocio.service");

/* =====================================================
   FUNCIONES AUXILIARES
===================================================== */

/**
 * Convierte los errores de Joi en una lista
 * de mensajes legibles para el frontend.
 */
const obtenerErroresJoi = (error) => {
    return error.details.map(
        (detalle) => detalle.message
    );
};

/**
 * Envía una respuesta de error uniforme.
 */
const responderError = (
    res,
    error,
    mensajePredeterminado
) => {
    console.error(error);

    /*
     * Errores personalizados generados
     * dentro del servicio.
     */
    if (error.statusCode) {
        return res
            .status(error.statusCode)
            .json({
                success: false,
                message: error.message
            });
    }

    /*
     * Registro duplicado o restricción UNIQUE.
     */
    if (error.code === "23505") {
        return res
            .status(409)
            .json({
                success: false,
                message:
                    "Ya existe un registro con la información proporcionada."
            });
    }

    /*
     * Violación de clave foránea.
     */
    if (error.code === "23503") {
        return res
            .status(400)
            .json({
                success: false,
                message:
                    "No se pudo completar la operación porque existe una referencia relacionada no válida."
            });
    }

    /*
     * Violación de restricción CHECK.
     */
    if (error.code === "23514") {
        return res
            .status(400)
            .json({
                success: false,
                message:
                    "Los datos enviados no cumplen las reglas del sistema."
            });
    }

    /*
     * Valor nulo en columna obligatoria.
     */
    if (error.code === "23502") {
        return res
            .status(400)
            .json({
                success: false,
                message:
                    "Falta información obligatoria para completar la operación."
            });
    }

    return res
        .status(500)
        .json({
            success: false,
            message: mensajePredeterminado
        });
};

/* =====================================================
   CREAR APORTE O RETIRO
===================================================== */

const crear = async (req, res) => {
    try {
        const {
            error,
            value
        } = crearAporteSocioSchema.validate(
            req.body,
            {
                abortEarly: false,
                stripUnknown: true
            }
        );

        if (error) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Existen errores en los datos enviados.",
                    errores:
                        obtenerErroresJoi(error)
                });
        }

        const movimiento =
            await crearAporteSocio(value);

        const mensaje =
            movimiento.tipo === "aporte"
                ? "El aporte del socio se registró correctamente."
                : "El retiro del socio se registró correctamente.";

        return res
            .status(201)
            .json({
                success: true,
                message: mensaje,
                data: movimiento
            });

    } catch (error) {
        return responderError(
            res,
            error,
            "Ocurrió un error al registrar el aporte o retiro."
        );
    }
};

/* =====================================================
   LISTAR APORTES Y RETIROS
===================================================== */

const listar = async (req, res) => {
    try {
        const filtros = {
            buscar:
                req.query.buscar,

            socio_id:
                req.query.socio_id,

            cuenta_id:
                req.query.cuenta_id,

            tipo:
                req.query.tipo,

            estado:
                req.query.estado,

            fecha_desde:
                req.query.fecha_desde,

            fecha_hasta:
                req.query.fecha_hasta
        };

        const movimientos =
            await listarAportesSocios(
                filtros
            );

        return res
            .status(200)
            .json({
                success: true,
                message:
                    "Movimientos de socios obtenidos correctamente.",
                total:
                    movimientos.length,
                data:
                    movimientos
            });

    } catch (error) {
        return responderError(
            res,
            error,
            "Ocurrió un error al obtener los aportes y retiros."
        );
    }
};

/* =====================================================
   MIS APORTES Y RETIROS
   PORTAL DEL SOCIO
===================================================== */

/**
 * Obtiene exclusivamente los movimientos
 * correspondientes al socio autenticado.
 *
 * No recibe socio_id desde el frontend.
 *
 * La relación se obtiene mediante:
 *
 * req.user.id
 *      ↓
 * socios.usuario_id
 *      ↓
 * aportes_socios.socio_id
 */
const misAportes = async (
    req,
    res
) => {
    try {
        const usuarioId =
            req.user.id;

        const movimientos =
            await obtenerMisAportes(
                usuarioId
            );

        return res
            .status(200)
            .json({
                success: true,
                message:
                    "Tus aportes y retiros fueron obtenidos correctamente.",
                total:
                    movimientos.length,
                data:
                    movimientos
            });

    } catch (error) {
        return responderError(
            res,
            error,
            "Ocurrió un error al obtener tus aportes y retiros."
        );
    }
};

/* =====================================================
   OBTENER APORTE O RETIRO POR ID
===================================================== */

const obtenerPorId = async (
    req,
    res
) => {
    try {
        const { id } =
            req.params;

        const movimiento =
            await obtenerMovimientoPorId(
                id
            );

        return res
            .status(200)
            .json({
                success: true,
                message:
                    "Movimiento obtenido correctamente.",
                data:
                    movimiento
            });

    } catch (error) {
        return responderError(
            res,
            error,
            "Ocurrió un error al obtener el movimiento."
        );
    }
};

/* =====================================================
   ACTUALIZAR APORTE O RETIRO
===================================================== */

const actualizar = async (
    req,
    res
) => {
    try {
        const { id } =
            req.params;

        const {
            error,
            value
        } = actualizarAporteSocioSchema.validate(
            req.body,
            {
                abortEarly: false,
                stripUnknown: true
            }
        );

        if (error) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Existen errores en los datos enviados.",
                    errores:
                        obtenerErroresJoi(error)
                });
        }

        const movimiento =
            await actualizarAporteSocio(
                id,
                value
            );

        return res
            .status(200)
            .json({
                success: true,
                message:
                    "El movimiento pendiente se actualizó correctamente.",
                data:
                    movimiento
            });

    } catch (error) {
        return responderError(
            res,
            error,
            "Ocurrió un error al actualizar el movimiento."
        );
    }
};

/* =====================================================
   CAMBIAR ESTADO
===================================================== */

const cambiarEstado = async (
    req,
    res
) => {
    try {
        const { id } =
            req.params;

        const {
            error,
            value
        } = cambiarEstadoAporteSchema.validate(
            req.body,
            {
                abortEarly: false,
                stripUnknown: true
            }
        );

        if (error) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "El estado enviado no es válido.",
                    errores:
                        obtenerErroresJoi(error)
                });
        }

        const movimiento =
            await cambiarEstadoAporteSocio(
                id,
                value.estado
            );

        let mensaje =
            "El estado del movimiento se actualizó correctamente.";

        if (
            value.estado ===
            "confirmado"
        ) {
            mensaje =
                movimiento.tipo ===
                    "aporte"
                    ? "El aporte se confirmó y se registró el ingreso financiero correctamente."
                    : "El retiro se confirmó y se registró el egreso financiero correctamente.";
        }

        if (
            value.estado ===
            "anulado"
        ) {
            mensaje =
                "El movimiento fue anulado correctamente.";
        }

        return res
            .status(200)
            .json({
                success: true,
                message,
                data:
                    movimiento
            });

    } catch (error) {
        return responderError(
            res,
            error,
            "Ocurrió un error al cambiar el estado del movimiento."
        );
    }
};

/* =====================================================
   ELIMINAR APORTE O RETIRO PENDIENTE
===================================================== */

const eliminar = async (
    req,
    res
) => {
    try {
        const { id } =
            req.params;

        const resultado =
            await eliminarAporteSocio(
                id
            );

        return res
            .status(200)
            .json({
                success: true,
                message:
                    resultado.message
            });

    } catch (error) {
        return responderError(
            res,
            error,
            "Ocurrió un error al eliminar el movimiento."
        );
    }
};

/* =====================================================
   OBTENER RESUMEN DE APORTES
===================================================== */

const obtenerResumen = async (
    req,
    res
) => {
    try {
        const filtros = {
            socio_id:
                req.query.socio_id,

            fecha_desde:
                req.query.fecha_desde,

            fecha_hasta:
                req.query.fecha_hasta
        };

        const resumen =
            await obtenerResumenAportes(
                filtros
            );

        /*
         * PostgreSQL devuelve NUMERIC como string.
         * Los convertimos a number para que React pueda
         * trabajar correctamente con los KPI.
         */
        const resumenFormateado = {
            total_aportes:
                Number(
                    resumen.total_aportes ||
                    0
                ),

            total_retiros:
                Number(
                    resumen.total_retiros ||
                    0
                ),

            capital_neto:
                Number(
                    resumen.capital_neto ||
                    0
                ),

            cantidad_aportes:
                Number(
                    resumen.cantidad_aportes ||
                    0
                ),

            cantidad_retiros:
                Number(
                    resumen.cantidad_retiros ||
                    0
                )
        };

        return res
            .status(200)
            .json({
                success: true,
                message:
                    "Resumen de aportes obtenido correctamente.",
                data:
                    resumenFormateado
            });

    } catch (error) {
        return responderError(
            res,
            error,
            "Ocurrió un error al obtener el resumen de aportes."
        );
    }
};

/* =====================================================
   EXPORTACIONES
===================================================== */

module.exports = {
    crear,

    listar,

    misAportes,

    obtenerPorId,

    actualizar,

    cambiarEstado,

    eliminar,

    obtenerResumen
};