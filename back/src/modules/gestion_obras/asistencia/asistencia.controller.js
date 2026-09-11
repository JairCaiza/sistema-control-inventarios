const {
    registrarEntrada,
    registrarSalida,
    registrarNovedad,
    registrarMarcacionIntegracion,
    listarAsistencias,
    obtenerAsistenciaPorId,
    actualizarAsistencia,
    corregirMarcacion,
    obtenerReporteSemanal,
    obtenerReportePeriodo
} = require("./asistencia.service");


/* =====================================================
   MANEJO CENTRALIZADO DE ERRORES
===================================================== */

const manejarError = (
    error,
    res,
    mensajePorDefecto =
        "Ocurrió un error en el módulo de asistencia"
) => {
    console.error(
        "[ASISTENCIA ERROR]",
        error
    );

    /*
     * Errores creados desde el service.
     */
    if (error.statusCode) {
        return res
            .status(error.statusCode)
            .json({
                ok: false,
                message:
                    error.message ||
                    mensajePorDefecto,
                codigo:
                    error.codigo ||
                    null
            });
    }

    /*
     * UUID inválido enviado directamente
     * a PostgreSQL.
     */
    if (error.code === "22P02") {
        return res
            .status(400)
            .json({
                ok: false,
                message:
                    "Uno de los identificadores proporcionados no es válido.",
                codigo:
                    "UUID_INVALIDO"
            });
    }

    /*
     * Violación de restricción UNIQUE.
     */
    if (error.code === "23505") {
        return res
            .status(409)
            .json({
                ok: false,
                message:
                    error.message ||
                    "Ya existe un registro con la información proporcionada.",
                codigo:
                    "REGISTRO_DUPLICADO"
            });
    }

    /*
     * Violación de clave foránea.
     */
    if (error.code === "23503") {
        return res
            .status(400)
            .json({
                ok: false,
                message:
                    error.message ||
                    "Uno de los registros relacionados no existe o no puede utilizarse.",
                codigo:
                    "RELACION_INVALIDA"
            });
    }

    /*
     * CHECK constraint.
     */
    if (error.code === "23514") {
        return res
            .status(400)
            .json({
                ok: false,
                message:
                    "Los datos enviados no cumplen las reglas definidas para asistencia.",
                codigo:
                    "RESTRICCION_INVALIDA"
            });
    }

    return res
        .status(500)
        .json({
            ok: false,
            message:
                mensajePorDefecto,
            codigo:
                "ERROR_INTERNO"
        });
};


/* =====================================================
   OBTENER USUARIO AUTENTICADO
===================================================== */

const obtenerUsuarioId = (
    req
) => {
    return (
        req.user?.id ||
        null
    );
};


/* =====================================================
   REGISTRAR ENTRADA
===================================================== */

const entrada = async (
    req,
    res
) => {
    try {
        const usuarioId =
            obtenerUsuarioId(
                req
            );

        const resultado =
            await registrarEntrada(
                req.body,
                usuarioId
            );

        return res
            .status(201)
            .json({
                ok: true,
                message:
                    "Entrada registrada correctamente.",
                asistencia:
                    resultado.asistencia,
                marcacion:
                    resultado.marcacion,
                empleado:
                    resultado.empleado,
                obra:
                    resultado.obra,
                asignacion:
                    resultado.asignacion
            });
    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al registrar la entrada del empleado"
        );
    }
};


/* =====================================================
   REGISTRAR SALIDA
===================================================== */

const salida = async (
    req,
    res
) => {
    try {
        const usuarioId =
            obtenerUsuarioId(
                req
            );

        const resultado =
            await registrarSalida(
                req.body,
                usuarioId
            );

        return res
            .status(201)
            .json({
                ok: true,
                message:
                    "Salida registrada correctamente.",
                asistencia:
                    resultado.asistencia,
                marcacion:
                    resultado.marcacion,
                empleado:
                    resultado.empleado,
                obra:
                    resultado.obra,
                asignacion:
                    resultado.asignacion,
                tiempo_trabajado:
                    resultado.tiempo_trabajado
            });
    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al registrar la salida del empleado"
        );
    }
};


/* =====================================================
   REGISTRAR NOVEDAD
===================================================== */

const novedad = async (
    req,
    res
) => {
    try {
        const usuarioId =
            obtenerUsuarioId(
                req
            );

        const resultado =
            await registrarNovedad(
                req.body,
                usuarioId
            );

        return res
            .status(201)
            .json({
                ok: true,
                message:
                    "Novedad de asistencia registrada correctamente.",
                asistencia:
                    resultado.asistencia,
                empleado:
                    resultado.empleado,
                obra:
                    resultado.obra,
                asignacion:
                    resultado.asignacion
            });
    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al registrar la novedad de asistencia"
        );
    }
};


/* =====================================================
   REGISTRAR MARCACIÓN DE INTEGRACIÓN

   Este endpoint queda preparado para:
   - biométrico
   - sistema externo

   No guarda huellas.
===================================================== */

const marcacionIntegracion =
    async (
        req,
        res
    ) => {
        try {
            const resultado =
                await registrarMarcacionIntegracion(
                    req.body
                );

            /*
             * Si el mismo dispositivo
             * reenvía la misma referencia externa,
             * no consideramos esto un error.
             */
            if (
                resultado.duplicado
            ) {
                return res
                    .status(200)
                    .json({
                        ok: true,
                        duplicado:
                            true,
                        message:
                            "La marcación ya había sido registrada anteriormente.",
                        marcacion:
                            resultado.marcacion
                    });
            }

            return res
                .status(201)
                .json({
                    ok: true,
                    duplicado:
                        false,
                    message:
                        "Marcación de integración registrada correctamente.",
                    asistencia:
                        resultado.asistencia,
                    marcacion:
                        resultado.marcacion,
                    empleado:
                        resultado.empleado,
                    obra:
                        resultado.obra,
                    asignacion:
                        resultado.asignacion
                });
        } catch (error) {
            return manejarError(
                error,
                res,
                "Error al registrar la marcación de integración"
            );
        }
    };


/* =====================================================
   LISTAR ASISTENCIAS
===================================================== */

const listar = async (
    req,
    res
) => {
    try {
        const asistencias =
            await listarAsistencias(
                req.query
            );

        return res
            .status(200)
            .json({
                ok: true,
                total:
                    asistencias.length,
                asistencias
            });
    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al obtener las asistencias"
        );
    }
};


/* =====================================================
   OBTENER ASISTENCIA POR ID
===================================================== */

const obtenerPorId = async (
    req,
    res
) => {
    try {
        const asistencia =
            await obtenerAsistenciaPorId(
                req.params.id
            );

        return res
            .status(200)
            .json({
                ok: true,
                asistencia
            });
    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al obtener la asistencia"
        );
    }
};


/* =====================================================
   ACTUALIZAR / CORREGIR ASISTENCIA
===================================================== */

const actualizar = async (
    req,
    res
) => {
    try {
        const usuarioId =
            obtenerUsuarioId(
                req
            );

        const asistencia =
            await actualizarAsistencia(
                req.params.id,
                req.body,
                usuarioId
            );

        return res
            .status(200)
            .json({
                ok: true,
                message:
                    "Asistencia actualizada correctamente.",
                asistencia
            });
    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al actualizar la asistencia"
        );
    }
};


/* =====================================================
   CORREGIR MARCACIÓN
===================================================== */

const corregirMarcacionController =
    async (
        req,
        res
    ) => {
        try {
            const usuarioId =
                obtenerUsuarioId(
                    req
                );

            const marcacion =
                await corregirMarcacion(
                    req.params.id,
                    req.body,
                    usuarioId
                );

            return res
                .status(200)
                .json({
                    ok: true,
                    message:
                        "Marcación corregida correctamente.",
                    marcacion
                });
        } catch (error) {
            return manejarError(
                error,
                res,
                "Error al corregir la marcación"
            );
        }
    };


/* =====================================================
   REPORTE SEMANAL
===================================================== */

const reporteSemanal = async (
    req,
    res
) => {
    try {
        const reporte =
            await obtenerReporteSemanal(
                req.query
            );

        return res
            .status(200)
            .json({
                ok: true,
                reporte
            });
    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al generar el reporte semanal de asistencia"
        );
    }
};


/* =====================================================
   REPORTE POR PERÍODO
===================================================== */

const reportePeriodo = async (
    req,
    res
) => {
    try {
        const reporte =
            await obtenerReportePeriodo(
                req.query
            );

        return res
            .status(200)
            .json({
                ok: true,
                reporte
            });
    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al generar el reporte de asistencia"
        );
    }
};


/* =====================================================
   EXPORTACIONES
===================================================== */

module.exports = {
    entrada,
    salida,
    novedad,

    marcacionIntegracion,

    listar,
    obtenerPorId,

    actualizar,
    corregirMarcacion:
        corregirMarcacionController,

    reporteSemanal,
    reportePeriodo
};