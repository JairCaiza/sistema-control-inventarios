const {
    calcularUtilidadPeriodo,
    calcularDistribucion,
    generarDistribucion,
    listarDistribuciones,
    obtenerMisUtilidades,
    obtenerDistribucionPorId,
    pagarUtilidad,
    anularDistribucion,
    obtenerResumenDistribuciones
} = require("./utilidadSocio.service");

const {
    generarUtilidadSchema,
    pagarUtilidadSchema,
    cambiarEstadoUtilidadSchema
} = require("./utilidadSocio.schema");

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

    /*
     * UUID inválido.
     */
    if (error.code === "22P02") {
        return res.status(400).json({
            ok: false,
            message:
                "El identificador enviado no es válido"
        });
    }

    /*
     * Violación UNIQUE.
     *
     * Por ejemplo:
     * mismo socio + mismo periodo.
     */
    if (error.code === "23505") {
        return res.status(409).json({
            ok: false,
            message:
                "Ya existe una distribución de utilidades para ese socio y período"
        });
    }

    /*
     * Violación de clave foránea.
     */
    if (error.code === "23503") {
        return res.status(409).json({
            ok: false,
            message:
                "No se puede completar la operación porque existen registros relacionados"
        });
    }

    /*
     * CHECK constraint.
     */
    if (error.code === "23514") {
        return res.status(400).json({
            ok: false,
            message:
                "Los datos enviados incumplen una regla financiera del sistema"
        });
    }

    return res
        .status(
            error.statusCode ||
            500
        )
        .json({
            ok: false,

            message:
                error.message ||
                mensajePredeterminado
        });
};

/* =====================================================
   CONSULTAR UTILIDAD DEL PERIODO
===================================================== */

/*
 * GET
 *
 * /api/utilidades-socios/utilidad?periodo=2026-07
 *
 * Esta operación NO guarda nada.
 *
 * Solamente consulta:
 *
 * ingresos
 * egresos
 * utilidad
 */
const obtenerUtilidadPeriodo = async (
    req,
    res
) => {
    try {
        const periodo =
            req.query.periodo;

        if (!periodo) {
            return res
                .status(400)
                .json({
                    ok: false,

                    message:
                        "El período es obligatorio"
                });
        }

        const resultado =
            await calcularUtilidadPeriodo(
                periodo
            );

        return res
            .status(200)
            .json({
                ok: true,

                data:
                    resultado
            });

    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al calcular la utilidad del período"
        );
    }
};

/* =====================================================
   CALCULAR DISTRIBUCIÓN
===================================================== */

/*
 * GET
 *
 * /api/utilidades-socios/calculo
 *
 * Ejemplo:
 *
 * ?periodo=2026-07
 * &monto_distribuir=5000
 *
 * Esta operación NO guarda datos.
 *
 * Sirve para mostrar una simulación
 * en el frontend.
 */
const calcular = async (
    req,
    res
) => {
    try {
        const periodo =
            req.query.periodo;

        if (!periodo) {
            return res
                .status(400)
                .json({
                    ok: false,

                    message:
                        "El período es obligatorio"
                });
        }

        let montoDistribuir =
            null;

        if (
            req.query
                .monto_distribuir !==
            undefined &&
            req.query
                .monto_distribuir !==
            ""
        ) {
            montoDistribuir =
                Number(
                    req.query
                        .monto_distribuir
                );

            if (
                !Number.isFinite(
                    montoDistribuir
                )
            ) {
                return res
                    .status(400)
                    .json({
                        ok: false,

                        message:
                            "El monto a distribuir no es válido"
                    });
            }
        }

        const resultado =
            await calcularDistribucion(
                periodo,
                montoDistribuir
            );

        return res
            .status(200)
            .json({
                ok: true,

                data:
                    resultado
            });

    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al calcular la distribución de utilidades"
        );
    }
};

/* =====================================================
   GENERAR DISTRIBUCIÓN
===================================================== */

/*
 * POST
 *
 * /api/utilidades-socios/generar
 *
 * Genera realmente los registros
 * para los socios.
 */
const generar = async (
    req,
    res
) => {
    try {
        const {
            error,
            value
        } =
            generarUtilidadSchema.validate(
                req.body,
                {
                    abortEarly:
                        false,

                    stripUnknown:
                        true
                }
            );

        if (error) {
            return res
                .status(400)
                .json({
                    ok: false,

                    message:
                        "Los datos enviados no son válidos",

                    errores:
                        error.details.map(
                            (
                                detalle
                            ) =>
                                detalle.message
                        )
                });
        }

        /*
         * NOTA:
         *
         * utilidad_periodo puede venir
         * del frontend porque está
         * definido en el schema,
         * pero el service recalcula
         * nuevamente la utilidad real.
         *
         * Por lo tanto el frontend
         * nunca es la fuente de verdad.
         */
        const resultado =
            await generarDistribucion(
                value
            );

        return res
            .status(201)
            .json({
                ok: true,

                message:
                    "Distribución de utilidades generada correctamente",

                data:
                    resultado
            });

    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al generar la distribución de utilidades"
        );
    }
};

/* =====================================================
   LISTAR DISTRIBUCIONES
===================================================== */

/*
 * GET
 *
 * /api/utilidades-socios
 *
 * Filtros:
 *
 * periodo
 * socio_id
 * estado
 * fecha_desde
 * fecha_hasta
 */
const listar = async (
    req,
    res
) => {
    try {
        const filtros = {
            periodo:
                req.query.periodo ||
                null,

            socio_id:
                req.query.socio_id ||
                null,

            estado:
                req.query.estado ||
                null,

            fecha_desde:
                req.query.fecha_desde ||
                null,

            fecha_hasta:
                req.query.fecha_hasta ||
                null
        };

        const distribuciones =
            await listarDistribuciones(
                filtros
            );

        return res
            .status(200)
            .json({
                ok: true,

                total:
                    distribuciones.length,

                data:
                    distribuciones
            });

    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al listar las distribuciones de utilidades"
        );
    }
};

/* =====================================================
   MIS UTILIDADES
   PORTAL DEL SOCIO
===================================================== */

/**
 * Obtiene exclusivamente las utilidades
 * correspondientes al socio autenticado.
 *
 * No recibe socio_id desde el frontend.
 *
 * El service obtiene la relación:
 *
 * req.user.id
 *      ↓
 * socios.usuario_id
 *      ↓
 * socios.id
 *      ↓
 * distribuciones_utilidades.socio_id
 */
const misUtilidades = async (
    req,
    res
) => {
    try {
        const usuarioId =
            req.user.id;

        const distribuciones =
            await obtenerMisUtilidades(
                usuarioId
            );

        return res
            .status(200)
            .json({
                ok: true,

                message:
                    "Tus utilidades fueron obtenidas correctamente",

                total:
                    distribuciones.length,

                data:
                    distribuciones
            });

    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al obtener tus utilidades"
        );
    }
};

/* =====================================================
   OBTENER DISTRIBUCIÓN POR ID
===================================================== */

const obtenerPorId = async (
    req,
    res
) => {
    try {
        const distribucion =
            await obtenerDistribucionPorId(
                req.params.id
            );

        if (
            !distribucion
        ) {
            return res
                .status(404)
                .json({
                    ok: false,

                    message:
                        "La distribución de utilidad no existe"
                });
        }

        return res
            .status(200)
            .json({
                ok: true,

                data:
                    distribucion
            });

    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al obtener la distribución de utilidad"
        );
    }
};

/* =====================================================
   PAGAR UTILIDAD
===================================================== */

/*
 * POST
 *
 * /api/utilidades-socios/:id/pagar
 *
 * Aquí ocurre:
 *
 * 1. Validar distribución
 * 2. Validar cuenta
 * 3. Crear egreso
 * 4. Disminuir saldo
 * 5. Marcar distribución como pagada
 */
const pagar = async (
    req,
    res
) => {
    try {
        const {
            error,
            value
        } =
            pagarUtilidadSchema.validate(
                req.body,
                {
                    abortEarly:
                        false,

                    stripUnknown:
                        true
                }
            );

        if (error) {
            return res
                .status(400)
                .json({
                    ok: false,

                    message:
                        "Los datos del pago no son válidos",

                    errores:
                        error.details.map(
                            (
                                detalle
                            ) =>
                                detalle.message
                        )
                });
        }

        const distribucion =
            await pagarUtilidad(
                req.params.id,
                value
            );

        return res
            .status(200)
            .json({
                ok: true,

                message:
                    "Utilidad pagada correctamente",

                data:
                    distribucion
            });

    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al pagar la utilidad"
        );
    }
};

/* =====================================================
   CAMBIAR ESTADO
===================================================== */

/*
 * Por ahora solamente permitiremos
 * la anulación mediante este endpoint.
 *
 * Una distribución pagada NO puede
 * simplemente cambiar de estado.
 */
const cambiarEstado = async (
    req,
    res
) => {
    try {
        const {
            error,
            value
        } =
            cambiarEstadoUtilidadSchema.validate(
                req.body,
                {
                    abortEarly:
                        false,

                    stripUnknown:
                        true
                }
            );

        if (error) {
            return res
                .status(400)
                .json({
                    ok: false,

                    message:
                        "El estado enviado no es válido",

                    errores:
                        error.details.map(
                            (
                                detalle
                            ) =>
                                detalle.message
                        )
                });
        }

        /*
         * No permitimos usar este endpoint
         * para marcar manualmente como pagado.
         *
         * Pagar debe pasar por pagarUtilidad()
         * para afectar la cuenta financiera.
         */
        if (
            value.estado ===
            "pagado"
        ) {
            return res
                .status(400)
                .json({
                    ok: false,

                    message:
                        "Una utilidad no puede marcarse manualmente como pagada. Debe utilizar el proceso de pago."
                });
        }

        if (
            value.estado ===
            "pendiente"
        ) {
            return res
                .status(400)
                .json({
                    ok: false,

                    message:
                        "No se puede regresar manualmente una distribución al estado pendiente."
                });
        }

        const distribucion =
            await anularDistribucion(
                req.params.id
            );

        return res
            .status(200)
            .json({
                ok: true,

                message:
                    "Distribución de utilidad anulada correctamente",

                data:
                    distribucion
            });

    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al cambiar el estado de la distribución"
        );
    }
};

/* =====================================================
   ANULAR DIRECTAMENTE
===================================================== */

/*
 * PATCH
 *
 * /api/utilidades-socios/:id/anular
 *
 * Lo dejamos también como endpoint
 * explícito porque es más claro en
 * un ERP que:
 *
 * PATCH estado=anulado
 */
const anular = async (
    req,
    res
) => {
    try {
        const distribucion =
            await anularDistribucion(
                req.params.id
            );

        return res
            .status(200)
            .json({
                ok: true,

                message:
                    "Distribución de utilidad anulada correctamente",

                data:
                    distribucion
            });

    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al anular la distribución de utilidad"
        );
    }
};

/* =====================================================
   OBTENER RESUMEN
===================================================== */

/*
 * GET
 *
 * /api/utilidades-socios/resumen
 *
 * Opcional:
 *
 * ?periodo=2026-07
 */
const obtenerResumen = async (
    req,
    res
) => {
    try {
        const periodo =
            req.query.periodo ||
            null;

        const resumen =
            await obtenerResumenDistribuciones(
                periodo
            );

        return res
            .status(200)
            .json({
                ok: true,

                data:
                    resumen
            });

    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al obtener el resumen de utilidades"
        );
    }
};

/* =====================================================
   EXPORTACIONES
===================================================== */

module.exports = {
    obtenerUtilidadPeriodo,
    calcular,
    generar,
    listar,
    misUtilidades,
    obtenerPorId,
    pagar,
    cambiarEstado,
    anular,
    obtenerResumen
};