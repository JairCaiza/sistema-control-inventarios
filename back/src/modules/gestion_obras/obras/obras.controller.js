const obrasService =
    require("./obras.service");

const {
    createObraSchema,
    updateObraSchema,
    obraIdSchema
} = require("./obras.schema");

/* =====================================================
   OPCIONES JOI
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
        "ERROR MÓDULO OBRAS:",
        error
    );

    /* =============================================
       ERRORES PERSONALIZADOS DEL SERVICE
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
            .status(409)
            .json({
                success:
                    false,

                message:
                    "No se pudo completar la operación porque existen registros relacionados."
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
                    "Ya existe un registro con la misma información única."
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
                    "Uno de los valores enviados no cumple las reglas de la base de datos."
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
       UUID / TIPO INVÁLIDO
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
       COLUMNA NO EXISTE
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
                    "Existe una inconsistencia entre el módulo de obras y la estructura actual de la base de datos.",

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
                "Ocurrió un error interno en el módulo de obras.",

            detail:
                process.env.NODE_ENV ===
                    "development"
                    ? error.message
                    : undefined
        });
};

/* =====================================================
   VALIDAR ID DE OBRA
===================================================== */

const validarObraId = (
    id,
    res
) => {
    const {
        error,
        value
    } =
        obraIdSchema.validate(
            {
                id
            },
            OPCIONES_JOI
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

    return value.id;
};

/* =====================================================
   CREAR OBRA
===================================================== */

const createObra =
    async (
        req,
        res
    ) => {
        try {
            const {
                error,
                value
            } =
                createObraSchema.validate(
                    req.body,
                    OPCIONES_JOI
                );

            if (error) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "La información de la obra no es válida.",

                        errors:
                            formatearErroresJoi(
                                error
                            )
                    });
            }

            const obra =
                await obrasService.createObra(
                    value
                );

            return res
                .status(201)
                .json({
                    success:
                        true,

                    message:
                        "Obra creada correctamente.",

                    data:
                        obra
                });

        } catch (error) {
            return manejarError(
                error,
                res
            );
        }
    };

/* =====================================================
   LISTAR OBRAS
===================================================== */

const getObras =
    async (
        req,
        res
    ) => {
        try {
            const obras =
                await obrasService.getObras();

            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Obras obtenidas correctamente.",

                    data:
                        obras
                });

        } catch (error) {
            return manejarError(
                error,
                res
            );
        }
    };

/* =====================================================
   OBTENER OBRA POR ID
===================================================== */

const getObraById =
    async (
        req,
        res
    ) => {
        try {
            const obraId =
                validarObraId(
                    req.params.id,
                    res
                );

            if (!obraId) {
                return;
            }

            const obra =
                await obrasService.getObraById(
                    obraId
                );

            if (!obra) {
                return res
                    .status(404)
                    .json({
                        success:
                            false,

                        message:
                            "Obra no encontrada."
                    });
            }

            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Obra obtenida correctamente.",

                    data:
                        obra
                });

        } catch (error) {
            return manejarError(
                error,
                res
            );
        }
    };

/* =====================================================
   ACTUALIZAR OBRA
===================================================== */

const updateObra =
    async (
        req,
        res
    ) => {
        try {
            const obraId =
                validarObraId(
                    req.params.id,
                    res
                );

            if (!obraId) {
                return;
            }

            const {
                error,
                value
            } =
                updateObraSchema.validate(
                    req.body,
                    OPCIONES_JOI
                );

            if (error) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "La información enviada para actualizar la obra no es válida.",

                        errors:
                            formatearErroresJoi(
                                error
                            )
                    });
            }

            const obra =
                await obrasService.updateObra(
                    obraId,
                    value
                );

            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Obra actualizada correctamente.",

                    data:
                        obra
                });

        } catch (error) {
            return manejarError(
                error,
                res
            );
        }
    };

/* =====================================================
   ELIMINAR OBRA
===================================================== */

const deleteObra =
    async (
        req,
        res
    ) => {
        try {
            const obraId =
                validarObraId(
                    req.params.id,
                    res
                );

            if (!obraId) {
                return;
            }

            const obra =
                await obrasService.deleteObra(
                    obraId
                );

            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Obra eliminada correctamente.",

                    data:
                        obra
                });

        } catch (error) {
            return manejarError(
                error,
                res
            );
        }
    };

/* =====================================================
   ASIGNAR EMPLEADO A OBRA
===================================================== */

const asignarEmpleadoObra =
    async (
        req,
        res
    ) => {
        try {
            const {
                obra_id,
                empleado_id,
                cargo_obra,
                fecha_inicio,
                fecha_fin,
                salario_acordado,
                observaciones
            } = req.body;

            /* =========================================
               VALIDACIONES BÁSICAS
            ========================================= */

            if (!obra_id) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "La obra es obligatoria."
                    });
            }

            if (!empleado_id) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "El empleado es obligatorio."
                    });
            }

            const empleadoObra =
                await obrasService
                    .asignarEmpleadoObra({
                        obra_id,
                        empleado_id,
                        cargo_obra,
                        fecha_inicio,
                        fecha_fin,
                        salario_acordado,
                        observaciones
                    });

            return res
                .status(201)
                .json({
                    success:
                        true,

                    message:
                        "Empleado asignado a la obra correctamente.",

                    data:
                        empleadoObra
                });

        } catch (error) {
            return manejarError(
                error,
                res
            );
        }
    };

/* =====================================================
   EMPLEADOS DE UNA OBRA
===================================================== */

const getEmpleadosObra =
    async (
        req,
        res
    ) => {
        try {
            const obraId =
                validarObraId(
                    req.params.obraId,
                    res
                );

            if (!obraId) {
                return;
            }

            const empleados =
                await obrasService
                    .getEmpleadosObra(
                        obraId
                    );

            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Empleados asignados obtenidos correctamente.",

                    data:
                        empleados
                });

        } catch (error) {
            return manejarError(
                error,
                res
            );
        }
    };

/* =====================================================
   DESASIGNAR EMPLEADO
===================================================== */

const desasignarEmpleadoObra =
    async (
        req,
        res
    ) => {
        try {
            const {
                motivo_salida,
                observaciones
            } = req.body;

            if (
                !req.params.id
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "El identificador de la asignación es obligatorio."
                    });
            }

            if (
                !motivo_salida ||
                String(
                    motivo_salida
                ).trim() === ""
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Debe indicar el motivo de salida."
                    });
            }

            const asignacion =
                await obrasService
                    .desasignarEmpleadoObra(
                        req.params.id,
                        motivo_salida,
                        observaciones
                    );

            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Empleado desasignado correctamente.",

                    data:
                        asignacion
                });

        } catch (error) {
            return manejarError(
                error,
                res
            );
        }
    };

/* =====================================================
   REGISTRAR CONTROL DIARIO
===================================================== */

const registrarActividadObra =
    async (
        req,
        res
    ) => {
        try {
            const {
                obra_id,
                fecha,
                actividad,
                descripcion,
                hora_inicio,
                hora_fin,
                avance,
                observaciones,
                clima
            } = req.body;

            if (!obra_id) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "La obra es obligatoria."
                    });
            }

            if (!fecha) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "La fecha del control diario es obligatoria."
                    });
            }

            if (
                !actividad ||
                String(
                    actividad
                ).trim() === ""
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "La actividad es obligatoria."
                    });
            }

            const control =
                await obrasService
                    .registrarActividadObra({
                        obra_id,
                        fecha,
                        actividad,
                        descripcion,
                        hora_inicio,
                        hora_fin,
                        avance,
                        observaciones,
                        clima
                    });

            return res
                .status(201)
                .json({
                    success:
                        true,

                    message:
                        "Control diario registrado correctamente.",

                    data:
                        control
                });

        } catch (error) {
            return manejarError(
                error,
                res
            );
        }
    };

/* =====================================================
   LISTAR CONTROLES POR OBRA
===================================================== */

const listarControlesPorObra =
    async (
        req,
        res
    ) => {
        try {
            const obraId =
                validarObraId(
                    req.params.obra_id,
                    res
                );

            if (!obraId) {
                return;
            }

            const controles =
                await obrasService
                    .listarControlesPorObra(
                        obraId
                    );

            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Controles diarios obtenidos correctamente.",

                    data:
                        controles
                });

        } catch (error) {
            return manejarError(
                error,
                res
            );
        }
    };
/* =====================================================
   LISTAR TODOS LOS CONTROLES DIARIOS
===================================================== */

const listarTodosControles = async (
    req,
    res
) => {
    try {
        const controles =
            await obrasService
                .listarTodosControles();

        return res.status(200).json({
            success: true,
            data: controles
        });

    } catch (error) {
        return manejarError(
            error,
            res,
            "No se pudieron obtener los controles diarios."
        );
    }
};
/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
    createObra,
    getObras,
    getObraById,
    updateObra,
    deleteObra,

    asignarEmpleadoObra,
    getEmpleadosObra,
    desasignarEmpleadoObra,

    registrarActividadObra,
    listarControlesPorObra,
    listarTodosControles
};