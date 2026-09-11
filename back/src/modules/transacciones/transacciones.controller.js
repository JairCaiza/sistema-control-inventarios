const transaccionesService =
    require("./transacciones.service");

const {
    registrarIngresoSchema,
    registrarEgresoSchema,
    registrarTransferenciaSchema
} = require("./transacciones.schema");

/* =====================================================
   REGISTRAR INGRESO
===================================================== */
const registrarIngreso = async (
    req,
    res,
    next
) => {
    try {
        const { error, value } =
            registrarIngresoSchema.validate(
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

        const resultado =
            await transaccionesService.registrarIngreso(
                value
            );

        return res.status(201).json({
            success: true,
            message:
                "Ingreso registrado correctamente",
            data: resultado
        });
    } catch (error) {
        next(error);
    }
};

/* =====================================================
   LISTAR INGRESOS
===================================================== */
const listarIngresos = async (
    req,
    res,
    next
) => {
    try {
        const ingresos =
            await transaccionesService.listarIngresos({
                cuenta_id:
                    req.query.cuenta_id,
                fecha_inicio:
                    req.query.fecha_inicio,
                fecha_fin:
                    req.query.fecha_fin
            });

        return res.status(200).json({
            success: true,
            data: ingresos
        });
    } catch (error) {
        next(error);
    }
};

/* =====================================================
   REGISTRAR EGRESO
===================================================== */
const registrarEgreso = async (
    req,
    res,
    next
) => {
    try {
        const { error, value } =
            registrarEgresoSchema.validate(
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

        const resultado =
            await transaccionesService.registrarEgreso(
                value
            );

        return res.status(201).json({
            success: true,
            message:
                "Egreso registrado correctamente",
            data: resultado
        });
    } catch (error) {
        next(error);
    }
};

/* =====================================================
   LISTAR EGRESOS
===================================================== */
const listarEgresos = async (
    req,
    res,
    next
) => {
    try {
        const egresos =
            await transaccionesService.listarEgresos({
                cuenta_id:
                    req.query.cuenta_id,
                fecha_inicio:
                    req.query.fecha_inicio,
                fecha_fin:
                    req.query.fecha_fin
            });

        return res.status(200).json({
            success: true,
            data: egresos
        });
    } catch (error) {
        next(error);
    }
};

/* =====================================================
   REGISTRAR TRANSFERENCIA
===================================================== */
const registrarTransferencia = async (
    req,
    res,
    next
) => {
    try {
        const { error, value } =
            registrarTransferenciaSchema.validate(
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

        const resultado =
            await transaccionesService.registrarTransferencia(
                value
            );

        return res.status(201).json({
            success: true,
            message:
                "Transferencia registrada correctamente",
            data: resultado
        });
    } catch (error) {
        next(error);
    }
};

/* =====================================================
   LISTAR TRANSFERENCIAS
===================================================== */
const listarTransferencias = async (
    req,
    res,
    next
) => {
    try {
        const transferencias =
            await transaccionesService.listarTransferencias({
                cuenta_id:
                    req.query.cuenta_id,

                cuenta_origen_id:
                    req.query.cuenta_origen_id,

                cuenta_destino_id:
                    req.query.cuenta_destino_id,

                fecha_inicio:
                    req.query.fecha_inicio,

                fecha_fin:
                    req.query.fecha_fin
            });

        return res.status(200).json({
            success: true,
            data: transferencias
        });
    } catch (error) {
        next(error);
    }
};

/* =====================================================
   EXPORTACIONES
===================================================== */
module.exports = {
    registrarIngreso,
    listarIngresos,
    registrarEgreso,
    listarEgresos,
    registrarTransferencia,
    listarTransferencias
};