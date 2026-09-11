const empleadosService =
    require("./empleados.service");

const {
    createEmpleadoSchema,
    updateEmpleadoSchema,
    toggleEmpleadoStatusSchema
} = require("./empleados.schema");

/* =====================================================
   MANEJO CENTRALIZADO DE ERRORES
===================================================== */

const manejarError = (
    res,
    error,
    mensajeDefault
) => {
    console.error(
        "ERROR EMPLEADOS:",
        error
    );

    const statusCode =
        Number(
            error.statusCode
        ) || 500;

    return res
        .status(statusCode)
        .json({
            success: false,

            message:
                error.message ||
                mensajeDefault
        });
};

/* =====================================================
   CREAR EMPLEADO
===================================================== */

const createEmpleado = async (
    req,
    res
) => {
    try {
        const {
            error,
            value
        } =
            createEmpleadoSchema.validate(
                req.body,
                {
                    abortEarly: false,
                    stripUnknown: true
                }
            );

        if (
            error
        ) {
            return res
                .status(400)
                .json({
                    success: false,

                    message:
                        error.details
                            .map(
                                (detail) =>
                                    detail.message
                            )
                            .join(". ")
                });
        }

        const empleado =
            await empleadosService
                .createEmpleado(
                    value
                );

        return res
            .status(201)
            .json({
                success: true,

                message:
                    "Empleado registrado correctamente",

                data:
                    empleado
            });
    } catch (error) {
        return manejarError(
            res,
            error,
            "No se pudo registrar el empleado"
        );
    }
};

/* =====================================================
   LISTAR EMPLEADOS
===================================================== */

const getEmpleados = async (
    req,
    res
) => {
    try {
        const empleados =
            await empleadosService
                .getEmpleados();

        return res
            .status(200)
            .json({
                success: true,
                data: empleados
            });
    } catch (error) {
        return manejarError(
            res,
            error,
            "No se pudieron obtener los empleados"
        );
    }
};

/* =====================================================
   OBTENER EMPLEADO
===================================================== */

const getEmpleadoById = async (
    req,
    res
) => {
    try {
        const empleado =
            await empleadosService
                .getEmpleadoById(
                    req.params.id
                );

        if (
            !empleado
        ) {
            return res
                .status(404)
                .json({
                    success: false,

                    message:
                        "Empleado no encontrado"
                });
        }

        return res
            .status(200)
            .json({
                success: true,
                data: empleado
            });
    } catch (error) {
        return manejarError(
            res,
            error,
            "No se pudo obtener el empleado"
        );
    }
};

/* =====================================================
   ACTUALIZAR EMPLEADO
===================================================== */

const updateEmpleado = async (
    req,
    res
) => {
    try {
        const {
            error,
            value
        } =
            updateEmpleadoSchema.validate(
                req.body,
                {
                    abortEarly: false,
                    stripUnknown: true
                }
            );

        if (
            error
        ) {
            return res
                .status(400)
                .json({
                    success: false,

                    message:
                        error.details
                            .map(
                                (detail) =>
                                    detail.message
                            )
                            .join(". ")
                });
        }

        const empleado =
            await empleadosService
                .updateEmpleado(
                    req.params.id,
                    value
                );

        return res
            .status(200)
            .json({
                success: true,

                message:
                    "Empleado actualizado correctamente",

                data:
                    empleado
            });
    } catch (error) {
        return manejarError(
            res,
            error,
            "No se pudo actualizar el empleado"
        );
    }
};

/* =====================================================
   ACTIVAR / DESACTIVAR
===================================================== */

const toggleEmpleadoStatus = async (
    req,
    res
) => {
    try {
        const {
            error,
            value
        } =
            toggleEmpleadoStatusSchema.validate(
                req.body,
                {
                    abortEarly: false,
                    stripUnknown: true
                }
            );

        if (
            error
        ) {
            return res
                .status(400)
                .json({
                    success: false,

                    message:
                        error.details[0]
                            .message
                });
        }

        const empleado =
            await empleadosService
                .toggleEmpleadoStatus(
                    req.params.id,
                    value.activo
                );

        return res
            .status(200)
            .json({
                success: true,

                message:
                    value.activo
                        ? "Empleado activado correctamente"
                        : "Empleado desactivado correctamente",

                data:
                    empleado
            });
    } catch (error) {
        return manejarError(
            res,
            error,
            "No se pudo cambiar el estado del empleado"
        );
    }
};

/* =====================================================
   OBRAS DEL EMPLEADO
===================================================== */

const getEmpleadoObras = async (
    req,
    res
) => {
    try {
        const obras =
            await empleadosService
                .getEmpleadoObras(
                    req.params.id
                );

        return res
            .status(200)
            .json({
                success: true,
                data: obras
            });
    } catch (error) {
        return manejarError(
            res,
            error,
            "No se pudo obtener el historial de obras del empleado"
        );
    }
};

/* =====================================================
   PAGOS DEL EMPLEADO
===================================================== */

const getEmpleadoPagos = async (
    req,
    res
) => {
    try {
        const pagos =
            await empleadosService
                .getEmpleadoPagos(
                    req.params.id
                );

        return res
            .status(200)
            .json({
                success: true,
                data: pagos
            });
    } catch (error) {
        return manejarError(
            res,
            error,
            "No se pudieron obtener los pagos del empleado"
        );
    }
};

/* =====================================================
   RESUMEN DEL EMPLEADO
===================================================== */

const getEmpleadoResumen = async (
    req,
    res
) => {
    try {
        const resumen =
            await empleadosService
                .getEmpleadoResumen(
                    req.params.id
                );

        return res
            .status(200)
            .json({
                success: true,
                data: resumen
            });
    } catch (error) {
        return manejarError(
            res,
            error,
            "No se pudo obtener el resumen del empleado"
        );
    }
};

/* =====================================================
   ACTIVIDAD DEL EMPLEADO
===================================================== */

const getEmpleadoActividad = async (
    req,
    res
) => {
    try {
        const actividad =
            await empleadosService
                .getEmpleadoActividad(
                    req.params.id
                );

        return res
            .status(200)
            .json({
                success: true,
                data: actividad
            });
    } catch (error) {
        return manejarError(
            res,
            error,
            "No se pudo obtener la actividad del empleado"
        );
    }
};

/* =====================================================
   ELIMINAR EMPLEADO
===================================================== */

const deleteEmpleado = async (
    req,
    res
) => {
    try {
        const empleado =
            await empleadosService
                .deleteEmpleado(
                    req.params.id
                );

        return res
            .status(200)
            .json({
                success: true,

                message:
                    "Empleado eliminado correctamente",

                data:
                    empleado
            });
    } catch (error) {
        return manejarError(
            res,
            error,
            "No se pudo eliminar el empleado"
        );
    }
};

/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
    createEmpleado,
    getEmpleados,
    getEmpleadoById,
    updateEmpleado,
    toggleEmpleadoStatus,

    getEmpleadoObras,
    getEmpleadoPagos,
    getEmpleadoResumen,
    getEmpleadoActividad,

    deleteEmpleado
};