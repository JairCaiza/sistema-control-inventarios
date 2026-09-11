const {
    crearSocio,
    listarSocios,
    obtenerSocioPorId,
    obtenerSocioPorUsuario,
    listarUsuariosSocioDisponibles,
    vincularUsuarioSocio,
    desvincularUsuarioSocio,
    actualizarSocio,
    cambiarEstadoSocio,
    eliminarSocio,
    obtenerResumenCapital
} = require("./socio.service");

const {
    crearSocioSchema,
    actualizarSocioSchema,
    cambiarEstadoSocioSchema
} = require("./socio.schema");


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
            ok: false,
            message:
                "El identificador enviado no es válido"
        });
    }

    /* =================================================
       UNIQUE
    ================================================= */

    if (error.code === "23505") {
        return res.status(409).json({
            ok: false,
            message:
                error.message ||
                "Ya existe un registro con esos datos"
        });
    }

    /* =================================================
       FOREIGN KEY
    ================================================= */

    if (error.code === "23503") {
        return res.status(409).json({
            ok: false,
            message:
                error.message ||
                "No se puede completar la operación porque existen registros relacionados"
        });
    }

    /* =================================================
       ERROR DE NEGOCIO
    ================================================= */

    return res
        .status(
            error.statusCode || 500
        )
        .json({
            ok: false,

            message:
                error.message ||
                mensajePredeterminado
        });
};


/* =====================================================
   CREAR SOCIO
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
            crearSocioSchema.validate(
                req.body,
                {
                    abortEarly: false,
                    stripUnknown: true
                }
            );

        if (error) {
            return res.status(400).json({
                ok: false,

                message:
                    "Los datos enviados no son válidos",

                errores:
                    error.details.map(
                        (detalle) =>
                            detalle.message
                    )
            });
        }

        const socio =
            await crearSocio(
                value
            );

        return res.status(201).json({
            ok: true,

            message:
                "Socio registrado correctamente",

            socio
        });

    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al registrar el socio"
        );
    }
};


/* =====================================================
   LISTAR SOCIOS
===================================================== */

const listar = async (
    req,
    res
) => {
    try {
        const filtros = {
            buscar:
                req.query.buscar ||
                null,

            activo:
                req.query.activo !==
                    undefined
                    ? req.query.activo
                    : null,

            fecha_ingreso:
                req.query.fecha_ingreso ||
                null
        };

        const socios =
            await listarSocios(
                filtros
            );

        return res.status(200).json({
            ok: true,

            total:
                socios.length,

            socios
        });

    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al listar los socios"
        );
    }
};


/* =====================================================
   LISTAR USUARIOS DISPONIBLES PARA REGISTRAR SOCIO
===================================================== */

const usuariosDisponibles = async (
    req,
    res
) => {
    try {
        const usuarios =
            await listarUsuariosSocioDisponibles();

        return res.status(200).json({
            ok: true,

            total:
                usuarios.length,

            usuarios
        });

    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al obtener los usuarios disponibles para socios"
        );
    }
};


/* =====================================================
   OBTENER SOCIO POR ID
===================================================== */

const obtenerPorId = async (
    req,
    res
) => {
    try {
        const socio =
            await obtenerSocioPorId(
                req.params.id
            );

        if (!socio) {
            return res.status(404).json({
                ok: false,

                message:
                    "El socio no existe"
            });
        }

        return res.status(200).json({
            ok: true,

            socio
        });

    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al obtener el socio"
        );
    }
};


/* =====================================================
   MI PERFIL DE SOCIO
===================================================== */

/*
 * Esta función NO recibe socio_id.
 *
 * Utiliza directamente:
 *
 * req.user.id
 *
 * que fue colocado por auth.middleware.
 *
 * De esta forma un socio solamente puede
 * consultar su propia información.
 */

const miPerfil = async (
    req,
    res
) => {
    try {
        const socio =
            await obtenerSocioPorUsuario(
                req.user.id
            );

        return res.status(200).json({
            ok: true,

            socio: {
                id:
                    socio.id,

                nombre:
                    socio.nombre,

                identificacion:
                    socio.identificacion,

                contacto:
                    socio.contacto,

                fecha_ingreso:
                    socio.fecha_ingreso,

                activo:
                    socio.activo,

                usuario_id:
                    socio.usuario_id,

                total_aportes:
                    socio.total_aportes,

                total_retiros:
                    socio.total_retiros,

                capital_neto:
                    socio.capital_neto,

                porcentaje_participacion:
                    socio.porcentaje_participacion
            }
        });

    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al obtener el perfil del socio"
        );
    }
};


/* =====================================================
   MI RESUMEN DE SOCIO
===================================================== */

const miResumen = async (
    req,
    res
) => {
    try {
        const socio =
            await obtenerSocioPorUsuario(
                req.user.id
            );

        return res.status(200).json({
            ok: true,

            resumen: {
                socio_id:
                    socio.id,

                nombre:
                    socio.nombre,

                total_aportes:
                    Number(
                        socio.total_aportes ||
                        0
                    ),

                total_retiros:
                    Number(
                        socio.total_retiros ||
                        0
                    ),

                capital_neto:
                    Number(
                        socio.capital_neto ||
                        0
                    ),

                porcentaje_participacion:
                    Number(
                        socio.porcentaje_participacion ||
                        0
                    )
            }
        });

    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al obtener el resumen del socio"
        );
    }
};


/* =====================================================
   RESUMEN GLOBAL DEL CAPITAL SOCIAL
===================================================== */

const resumenCapital = async (
    req,
    res
) => {
    try {
        const resumen =
            await obtenerResumenCapital();

        return res.status(200).json({
            ok: true,

            resumen
        });

    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al obtener el resumen del capital social"
        );
    }
};


/* =====================================================
   VINCULAR USUARIO CON SOCIO
===================================================== */

const vincularUsuario = async (
    req,
    res
) => {
    try {
        const {
            usuario_id
        } = req.body;

        if (
            !usuario_id ||
            typeof usuario_id !==
            "string"
        ) {
            return res.status(400).json({
                ok: false,

                message:
                    "Debe seleccionar un usuario para vincular al socio"
            });
        }

        const socio =
            await vincularUsuarioSocio(
                req.params.id,
                usuario_id
            );

        return res.status(200).json({
            ok: true,

            message:
                "Usuario vinculado correctamente al socio",

            socio
        });

    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al vincular el usuario con el socio"
        );
    }
};


/* =====================================================
   DESVINCULAR USUARIO DEL SOCIO
===================================================== */

const desvincularUsuario = async (
    req,
    res
) => {
    try {
        const socio =
            await desvincularUsuarioSocio(
                req.params.id
            );

        return res.status(200).json({
            ok: true,

            message:
                "Usuario desvinculado correctamente del socio",

            socio
        });

    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al desvincular el usuario del socio"
        );
    }
};


/* =====================================================
   ACTUALIZAR SOCIO
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
            actualizarSocioSchema.validate(
                req.body,
                {
                    abortEarly: false,
                    stripUnknown: true
                }
            );

        if (error) {
            return res.status(400).json({
                ok: false,

                message:
                    "Los datos enviados no son válidos",

                errores:
                    error.details.map(
                        (detalle) =>
                            detalle.message
                    )
            });
        }

        const socio =
            await actualizarSocio(
                req.params.id,
                value
            );

        return res.status(200).json({
            ok: true,

            message:
                "Socio actualizado correctamente",

            socio
        });

    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al actualizar el socio"
        );
    }
};


/* =====================================================
   CAMBIAR ESTADO DEL SOCIO
===================================================== */

const cambiarEstado = async (
    req,
    res
) => {
    try {
        const {
            error,
            value
        } =
            cambiarEstadoSocioSchema.validate(
                req.body,
                {
                    abortEarly: false,
                    stripUnknown: true
                }
            );

        if (error) {
            return res.status(400).json({
                ok: false,

                message:
                    "Los datos enviados no son válidos",

                errores:
                    error.details.map(
                        (detalle) =>
                            detalle.message
                    )
            });
        }

        const socio =
            await cambiarEstadoSocio(
                req.params.id,
                value.activo
            );

        return res.status(200).json({
            ok: true,

            message:
                value.activo
                    ? "Socio activado correctamente"
                    : "Socio desactivado correctamente",

            socio
        });

    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al cambiar el estado del socio"
        );
    }
};


/* =====================================================
   ELIMINAR SOCIO
===================================================== */

const eliminar = async (
    req,
    res
) => {
    try {
        const socio =
            await eliminarSocio(
                req.params.id
            );

        return res.status(200).json({
            ok: true,

            message:
                "Socio eliminado correctamente",

            socio
        });

    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al eliminar el socio"
        );
    }
};


/* =====================================================
   EXPORTACIONES
===================================================== */

module.exports = {
    crear,

    listar,

    usuariosDisponibles,

    obtenerPorId,

    miPerfil,

    miResumen,

    resumenCapital,

    vincularUsuario,

    desvincularUsuario,

    actualizar,

    cambiarEstado,

    eliminar
};