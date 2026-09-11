const cuentasService =
    require("./cuentasFinancieras.service");

const {
    crearCuentaSchema,
    actualizarCuentaSchema,
    cambiarEstadoSchema
} = require("./cuentasFinancieras.schema");

/* =====================================================
   CREAR
===================================================== */
const crear = async (req, res, next) => {
    try {
        const { error, value } =
            crearCuentaSchema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true
            });

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
                errors: error.details.map(
                    (detalle) => detalle.message
                )
            });
        }

        const cuenta =
            await cuentasService.crearCuenta(value);

        return res.status(201).json({
            success: true,
            message:
                "Cuenta financiera creada correctamente",
            data: cuenta
        });
    } catch (error) {
        next(error);
    }
};

/* =====================================================
   LISTAR
===================================================== */
const listar = async (req, res, next) => {
    try {
        const cuentas =
            await cuentasService.listarCuentas({
                buscar: req.query.buscar,
                tipo: req.query.tipo,
                activo: req.query.activo
            });

        return res.status(200).json({
            success: true,
            data: cuentas
        });
    } catch (error) {
        next(error);
    }
};

/* =====================================================
   OBTENER POR ID
===================================================== */
const obtenerPorId = async (req, res, next) => {
    try {
        const cuenta =
            await cuentasService.obtenerCuentaPorId(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            data: cuenta
        });
    } catch (error) {
        next(error);
    }
};

/* =====================================================
   ACTUALIZAR
===================================================== */
const actualizar = async (req, res, next) => {
    try {
        const { error, value } =
            actualizarCuentaSchema.validate(
                req.body,
                {
                    abortEarly: false,
                    stripUnknown: true
                }
            );

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
                errors: error.details.map(
                    (detalle) => detalle.message
                )
            });
        }

        const cuenta =
            await cuentasService.actualizarCuenta(
                req.params.id,
                value
            );

        return res.status(200).json({
            success: true,
            message:
                "Cuenta financiera actualizada correctamente",
            data: cuenta
        });
    } catch (error) {
        next(error);
    }
};

/* =====================================================
   CAMBIAR ESTADO
===================================================== */
const cambiarEstado = async (req, res, next) => {
    try {
        const { error, value } =
            cambiarEstadoSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const cuenta =
            await cuentasService.cambiarEstado(
                req.params.id,
                value.activo
            );

        return res.status(200).json({
            success: true,
            message: value.activo
                ? "Cuenta activada correctamente"
                : "Cuenta inactivada correctamente",
            data: cuenta
        });
    } catch (error) {
        next(error);
    }
};

/* =====================================================
   ELIMINAR
===================================================== */
const eliminar = async (req, res, next) => {
    try {
        await cuentasService.eliminarCuenta(
            req.params.id
        );

        return res.status(200).json({
            success: true,
            message:
                "Cuenta financiera eliminada correctamente"
        });
    } catch (error) {
        next(error);
    }
};

/* =====================================================
   RESUMEN
===================================================== */
const resumen = async (req, res, next) => {
    try {
        const resultado =
            await cuentasService.obtenerResumen();

        return res.status(200).json({
            success: true,
            data: resultado
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    crear,
    listar,
    obtenerPorId,
    actualizar,
    cambiarEstado,
    eliminar,
    resumen
};