const jornadasAlquilerService = require(
    "./jornadasAlquiler.service"
);

/* =====================================================
   UTILIDAD: OBTENER ID DEL USUARIO AUTENTICADO
===================================================== */

const obtenerUsuarioId = (req) => {
    return (
        req.user?.id ||
        req.usuario?.id ||
        req.user?.usuario_id ||
        null
    );
};

/* =====================================================
   REGISTRAR JORNADA
===================================================== */

const registrarJornada = async (req, res) => {
    try {
        const usuarioRegistroId =
            obtenerUsuarioId(req);

        const jornada =
            await jornadasAlquilerService.registrarJornada(
                req.body,
                usuarioRegistroId
            );

        return res.status(201).json({
            success: true,
            message:
                "Jornada de alquiler registrada correctamente",
            data: jornada,
        });
    } catch (error) {
        console.error(
            "Error al registrar jornada de alquiler:",
            error
        );

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "No fue posible registrar la jornada de alquiler",
        });
    }
};

/* =====================================================
   LISTAR JORNADAS POR CONTRATO
===================================================== */

const listarJornadasPorContrato = async (
    req,
    res
) => {
    try {
        const { contratoId } = req.params;

        const resultado =
            await jornadasAlquilerService.listarJornadasPorContrato(
                contratoId
            );

        return res.status(200).json({
            success: true,
            data: resultado,
        });
    } catch (error) {
        console.error(
            "Error al listar jornadas del contrato:",
            error
        );

        const status =
            error.message ===
                "Contrato no encontrado"
                ? 404
                : 400;

        return res.status(status).json({
            success: false,
            message:
                error.message ||
                "No fue posible obtener las jornadas del contrato",
        });
    }
};

/* =====================================================
   LISTAR JORNADAS POR DETALLE DEL CONTRATO
===================================================== */

const listarJornadasPorDetalle = async (
    req,
    res
) => {
    try {
        const { detalleContratoId } =
            req.params;

        const resultado =
            await jornadasAlquilerService.listarJornadasPorDetalle(
                detalleContratoId
            );

        return res.status(200).json({
            success: true,
            data: resultado,
        });
    } catch (error) {
        console.error(
            "Error al listar jornadas del detalle:",
            error
        );

        const status =
            error.message ===
                "El detalle del contrato no existe"
                ? 404
                : 400;

        return res.status(status).json({
            success: false,
            message:
                error.message ||
                "No fue posible obtener las jornadas del activo",
        });
    }
};

/* =====================================================
   OBTENER JORNADA POR ID
===================================================== */

const obtenerJornadaPorId = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const jornada =
            await jornadasAlquilerService.obtenerJornadaPorId(
                id
            );

        return res.status(200).json({
            success: true,
            data: jornada,
        });
    } catch (error) {
        console.error(
            "Error al obtener jornada de alquiler:",
            error
        );

        const status =
            error.message ===
                "Jornada de alquiler no encontrada"
                ? 404
                : 400;

        return res.status(status).json({
            success: false,
            message:
                error.message ||
                "No fue posible obtener la jornada de alquiler",
        });
    }
};

/* =====================================================
   ACTUALIZAR JORNADA
===================================================== */

const actualizarJornada = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const jornada =
            await jornadasAlquilerService.actualizarJornada(
                id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message:
                "Jornada de alquiler actualizada correctamente",
            data: jornada,
        });
    } catch (error) {
        console.error(
            "Error al actualizar jornada de alquiler:",
            error
        );

        const status =
            error.message ===
                "Jornada de alquiler no encontrada"
                ? 404
                : 400;

        return res.status(status).json({
            success: false,
            message:
                error.message ||
                "No fue posible actualizar la jornada de alquiler",
        });
    }
};

/* =====================================================
   ELIMINAR JORNADA
===================================================== */

const eliminarJornada = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const resultado =
            await jornadasAlquilerService.eliminarJornada(
                id
            );

        return res.status(200).json({
            success: true,
            message:
                "Jornada de alquiler eliminada correctamente",
            data: resultado,
        });
    } catch (error) {
        console.error(
            "Error al eliminar jornada de alquiler:",
            error
        );

        const status =
            error.message ===
                "Jornada de alquiler no encontrada"
                ? 404
                : 400;

        return res.status(status).json({
            success: false,
            message:
                error.message ||
                "No fue posible eliminar la jornada de alquiler",
        });
    }
};

/* =====================================================
   OBTENER RESUMEN EFECTIVO DEL CONTRATO
===================================================== */

const obtenerResumenContrato = async (
    req,
    res
) => {
    try {
        const { contratoId } = req.params;

        const resultado =
            await jornadasAlquilerService.obtenerResumenContrato(
                contratoId
            );

        return res.status(200).json({
            success: true,
            data: resultado,
        });
    } catch (error) {
        console.error(
            "Error al obtener resumen de jornadas:",
            error
        );

        const status =
            error.message ===
                "Contrato no encontrado"
                ? 404
                : 400;

        return res.status(status).json({
            success: false,
            message:
                error.message ||
                "No fue posible obtener el resumen efectivo del contrato",
        });
    }
};

/* =====================================================
   EXPORTACIONES
===================================================== */

module.exports = {
    registrarJornada,
    listarJornadasPorContrato,
    listarJornadasPorDetalle,
    obtenerJornadaPorId,
    actualizarJornada,
    eliminarJornada,
    obtenerResumenContrato,
};