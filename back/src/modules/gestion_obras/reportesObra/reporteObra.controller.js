const {
    obtenerResumenGeneral,
    obtenerReporteObra,
    obtenerGastosPorObra,
    obtenerPersonalPorObra,
    obtenerControlesPorObra,
    obtenerFinanzasPorObra,
    obtenerEvolucionCostos,
    obtenerPresupuestoObra
} = require("./reporteObra.service");

const {
    OPCIONES_COMUNES,
    obraIdSchema,
    resumenGeneralSchema,
    reporteObraSchema,
    gastosObraSchema,
    personalObraSchema,
    controlesObraSchema,
    finanzasObraSchema,
    evolucionCostosSchema,
    presupuestoObraSchema
} = require("./reporteObra.schema");

/* =====================================================
   FORMATEAR ERRORES JOI
===================================================== */

const formatearErroresJoi = (
    error
) => {
    return error.details.map(
        (detalle) => ({
            campo:
                detalle.path.join(
                    "."
                ),

            mensaje:
                detalle.message
                    .replace(
                        /"/g,
                        ""
                    )
        })
    );
};

/* =====================================================
   MANEJO CENTRALIZADO DE ERRORES
===================================================== */

const manejarError = (
    error,
    res
) => {
    console.error(
        "ERROR REPORTES OBRA:",
        error
    );

    /* =============================================
       ERRORES PERSONALIZADOS
    ============================================= */

    if (
        error.statusCode
    ) {
        return res
            .status(
                error.statusCode
            )
            .json({
                success:
                    false,
                message:
                    error.message
            });
    }

    /* =============================================
       FOREIGN KEY
    ============================================= */

    if (
        error.code === "23503"
    ) {
        return res
            .status(400)
            .json({
                success:
                    false,
                message:
                    "Existe una referencia inválida en la información solicitada."
            });
    }

    /* =============================================
       UNIQUE
    ============================================= */

    if (
        error.code === "23505"
    ) {
        return res
            .status(409)
            .json({
                success:
                    false,
                message:
                    "La operación genera un registro duplicado."
            });
    }

    /* =============================================
       CHECK CONSTRAINT
    ============================================= */

    if (
        error.code === "23514"
    ) {
        return res
            .status(400)
            .json({
                success:
                    false,
                message:
                    "Uno de los valores no cumple las reglas definidas en la base de datos."
            });
    }

    /* =============================================
       NOT NULL
    ============================================= */

    if (
        error.code === "23502"
    ) {
        return res
            .status(400)
            .json({
                success:
                    false,
                message:
                    "Falta información obligatoria para completar la operación."
            });
    }

    /* =============================================
       UUID INVÁLIDO / TIPO INVÁLIDO
    ============================================= */

    if (
        error.code === "22P02"
    ) {
        return res
            .status(400)
            .json({
                success:
                    false,
                message:
                    "Uno de los identificadores enviados no tiene un formato válido."
            });
    }

    /* =============================================
       COLUMNAS / SQL
    ============================================= */

    if (
        error.code === "42703"
    ) {
        return res
            .status(500)
            .json({
                success:
                    false,
                message:
                    "El reporte contiene una referencia a una columna que no existe en la base de datos.",
                detail:
                    process.env.NODE_ENV ===
                        "development"
                        ? error.message
                        : undefined
            });
    }

    /* =============================================
       TABLA NO EXISTE
    ============================================= */

    if (
        error.code === "42P01"
    ) {
        return res
            .status(500)
            .json({
                success:
                    false,
                message:
                    "El reporte intenta consultar una tabla que no existe en la base de datos.",
                detail:
                    process.env.NODE_ENV ===
                        "development"
                        ? error.message
                        : undefined
            });
    }

    /* =============================================
       ERROR GENERAL
    ============================================= */

    return res
        .status(500)
        .json({
            success:
                false,
            message:
                "Ocurrió un error interno al generar el reporte.",
            detail:
                process.env.NODE_ENV ===
                    "development"
                    ? error.message
                    : undefined
        });
};

/* =====================================================
   VALIDAR PARAM :obra_id
===================================================== */

const validarObraId = (
    req,
    res
) => {
    const {
        error,
        value
    } =
        obraIdSchema.validate(
            {
                obra_id:
                    req.params
                        .obra_id
            },
            OPCIONES_COMUNES
        );

    if (error) {
        res.status(400).json({
            success:
                false,

            message:
                "El identificador de la obra no es válido.",

            errors:
                formatearErroresJoi(
                    error
                )
        });

        return null;
    }

    return value.obra_id;
};

/* =====================================================
   RESUMEN GENERAL DE OBRAS
===================================================== */

const resumenGeneral =
    async (
        req,
        res
    ) => {
        try {
            const {
                error,
                value
            } =
                resumenGeneralSchema.validate(
                    req.query,
                    OPCIONES_COMUNES
                );

            if (error) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Los filtros enviados no son válidos.",

                        errors:
                            formatearErroresJoi(
                                error
                            )
                    });
            }

            const resultado =
                await obtenerResumenGeneral(
                    value
                );

            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Resumen general de obras obtenido correctamente.",

                    resumen:
                        resultado.resumen,

                    data:
                        resultado.data,

                    pagination:
                        resultado.pagination
                });

        } catch (error) {
            return manejarError(
                error,
                res
            );
        }
    };

/* =====================================================
   REPORTE COMPLETO DE UNA OBRA
===================================================== */

const reportePorObra =
    async (
        req,
        res
    ) => {
        try {
            const obraId =
                validarObraId(
                    req,
                    res
                );

            if (!obraId) {
                return;
            }

            const {
                error,
                value
            } =
                reporteObraSchema.validate(
                    req.query,
                    OPCIONES_COMUNES
                );

            if (error) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Los filtros del reporte no son válidos.",

                        errors:
                            formatearErroresJoi(
                                error
                            )
                    });
            }

            const resultado =
                await obtenerReporteObra(
                    obraId,
                    value
                );

            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Reporte de obra obtenido correctamente.",

                    data:
                        resultado
                });

        } catch (error) {
            return manejarError(
                error,
                res
            );
        }
    };

/* =====================================================
   GASTOS DE UNA OBRA
===================================================== */

const gastosPorObra =
    async (
        req,
        res
    ) => {
        try {
            const obraId =
                validarObraId(
                    req,
                    res
                );

            if (!obraId) {
                return;
            }

            const {
                error,
                value
            } =
                gastosObraSchema.validate(
                    req.query,
                    OPCIONES_COMUNES
                );

            if (error) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Los filtros de gastos no son válidos.",

                        errors:
                            formatearErroresJoi(
                                error
                            )
                    });
            }

            const resultado =
                await obtenerGastosPorObra(
                    obraId,
                    value
                );

            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Gastos de la obra obtenidos correctamente.",

                    resumen:
                        resultado.resumen,

                    distribucion:
                        resultado.distribucion,

                    data:
                        resultado.data,

                    pagination:
                        resultado.pagination
                });

        } catch (error) {
            return manejarError(
                error,
                res
            );
        }
    };

/* =====================================================
   PERSONAL DE UNA OBRA
===================================================== */

const personalPorObra =
    async (
        req,
        res
    ) => {
        try {
            const obraId =
                validarObraId(
                    req,
                    res
                );

            if (!obraId) {
                return;
            }

            const {
                error,
                value
            } =
                personalObraSchema.validate(
                    req.query,
                    OPCIONES_COMUNES
                );

            if (error) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Los filtros de personal no son válidos.",

                        errors:
                            formatearErroresJoi(
                                error
                            )
                    });
            }

            const resultado =
                await obtenerPersonalPorObra(
                    obraId,
                    value
                );

            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Personal de la obra obtenido correctamente.",

                    resumen:
                        resultado.resumen,

                    data:
                        resultado.data,

                    pagination:
                        resultado.pagination
                });

        } catch (error) {
            return manejarError(
                error,
                res
            );
        }
    };

/* =====================================================
   CONTROLES DIARIOS DE UNA OBRA
===================================================== */

const controlesPorObra =
    async (
        req,
        res
    ) => {
        try {
            const obraId =
                validarObraId(
                    req,
                    res
                );

            if (!obraId) {
                return;
            }

            const {
                error,
                value
            } =
                controlesObraSchema.validate(
                    req.query,
                    OPCIONES_COMUNES
                );

            if (error) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Los filtros de controles diarios no son válidos.",

                        errors:
                            formatearErroresJoi(
                                error
                            )
                    });
            }

            const resultado =
                await obtenerControlesPorObra(
                    obraId,
                    value
                );

            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Controles diarios de la obra obtenidos correctamente.",

                    data:
                        resultado.data,

                    pagination:
                        resultado.pagination
                });

        } catch (error) {
            return manejarError(
                error,
                res
            );
        }
    };

/* =====================================================
   FINANZAS DE UNA OBRA
===================================================== */

const finanzasPorObra =
    async (
        req,
        res
    ) => {
        try {
            const obraId =
                validarObraId(
                    req,
                    res
                );

            if (!obraId) {
                return;
            }

            const {
                error,
                value
            } =
                finanzasObraSchema.validate(
                    req.query,
                    OPCIONES_COMUNES
                );

            if (error) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Los filtros financieros no son válidos.",

                        errors:
                            formatearErroresJoi(
                                error
                            )
                    });
            }

            const resultado =
                await obtenerFinanzasPorObra(
                    obraId,
                    value
                );

            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Información financiera de la obra obtenida correctamente.",

                    resumen:
                        resultado.resumen,

                    data:
                        resultado.data,

                    pagination:
                        resultado.pagination
                });

        } catch (error) {
            return manejarError(
                error,
                res
            );
        }
    };

/* =====================================================
   EVOLUCIÓN DE COSTOS
===================================================== */

const evolucionCostos =
    async (
        req,
        res
    ) => {
        try {
            const obraId =
                validarObraId(
                    req,
                    res
                );

            if (!obraId) {
                return;
            }

            const {
                error,
                value
            } =
                evolucionCostosSchema.validate(
                    req.query,
                    OPCIONES_COMUNES
                );

            if (error) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Los filtros de evolución de costos no son válidos.",

                        errors:
                            formatearErroresJoi(
                                error
                            )
                    });
            }

            const resultado =
                await obtenerEvolucionCostos(
                    obraId,
                    value
                );

            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Evolución de costos obtenida correctamente.",

                    agrupar_por:
                        resultado.agrupar_por,

                    data:
                        resultado.data
                });

        } catch (error) {
            return manejarError(
                error,
                res
            );
        }
    };

/* =====================================================
   PRESUPUESTO VS EJECUTADO
===================================================== */

const presupuestoPorObra =
    async (
        req,
        res
    ) => {
        try {
            const obraId =
                validarObraId(
                    req,
                    res
                );

            if (!obraId) {
                return;
            }

            const {
                error,
                value
            } =
                presupuestoObraSchema.validate(
                    req.query,
                    OPCIONES_COMUNES
                );

            if (error) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Los filtros de presupuesto no son válidos.",

                        errors:
                            formatearErroresJoi(
                                error
                            )
                    });
            }

            const resultado =
                await obtenerPresupuestoObra(
                    obraId,
                    value
                );

            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Presupuesto de la obra obtenido correctamente.",

                    data:
                        resultado
                });

        } catch (error) {
            return manejarError(
                error,
                res
            );
        }
    };

/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
    resumenGeneral,
    reportePorObra,
    gastosPorObra,
    personalPorObra,
    controlesPorObra,
    finanzasPorObra,
    evolucionCostos,
    presupuestoPorObra
};