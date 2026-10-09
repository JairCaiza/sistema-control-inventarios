
const pagosContratosService = require("./pagosContratos.service");

// =====================================================
// REGISTRAR PAGO
// =====================================================

const registrar = async (req, res, next) => {
    try {
        const contrato_id = req.params.id;

        const result = await pagosContratosService.registrarPago({
            contrato_id,
            cuenta_id: req.body.cuenta_id,
            monto: req.body.monto,
            metodo_pago: req.body.metodo_pago,
            concepto: req.body.concepto,
            observaciones: req.body.observaciones,
            fecha: req.body.fecha
        });

        return res.status(201).json({
            success: true,
            message: "Pago registrado correctamente",
            data: result
        });

    } catch (error) {
        next(error);
    }
};

// =====================================================
// LISTAR PAGOS POR CONTRATO
// =====================================================

const listarPorContrato = async (req, res, next) => {
    try {
        const pagos = await pagosContratosService.listarPorContrato(
            req.params.id
        );

        return res.status(200).json({
            success: true,
            data: pagos
        });

    } catch (error) {
        next(error);
    }
};

// =====================================================
// RESUMEN DE PAGOS DEL CONTRATO
// =====================================================

const resumen = async (req, res, next) => {
    try {
        const data = await pagosContratosService.resumenContrato(
            req.params.id
        );

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        next(error);
    }
};

// =====================================================
// ANULAR PAGO DE CONTRATO
// =====================================================

const anular = async (req, res, next) => {
    try {
        const contrato_id = req.params.id;
        const pago_id = req.params.pagoId;

        const motivo_anulacion = String(
            req.body?.motivo_anulacion || ""
        ).trim();

        // El usuario proviene del JWT autenticado.
        // Nunca se recibe desde el body.

        const usuario_id = req.user?.id;

        if (!usuario_id) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado"
            });
        }

        if (!contrato_id || !pago_id) {
            return res.status(400).json({
                success: false,
                message: "Debe identificar el contrato y el pago"
            });
        }

        if (motivo_anulacion.length < 10) {
            return res.status(400).json({
                success: false,
                message:
                    "El motivo de anulación debe contener al menos 10 caracteres"
            });
        }

        const result = await pagosContratosService.anularPago({
            contrato_id,
            pago_id,
            motivo_anulacion,
            usuario_id
        });

        return res.status(200).json({
            success: true,
            message: "Pago anulado correctamente",
            data: result
        });

    } catch (error) {
        next(error);
    }
};

// =====================================================
// CORREGIR PAGO DE CONTRATO
// =====================================================

const corregir = async (req, res, next) => {
    try {
        // =============================================
        // 1. IDENTIFICAR CONTRATO Y PAGO ORIGINAL
        // =============================================

        const contrato_id = req.params.id;
        const pago_id = req.params.pagoId;

        // =============================================
        // 2. IDENTIFICAR USUARIO AUTENTICADO
        // =============================================

        // El usuario responsable de la corrección
        // siempre se obtiene del middleware JWT.

        const usuario_id = req.user?.id;

        if (!usuario_id) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado"
            });
        }

        if (!contrato_id || !pago_id) {
            return res.status(400).json({
                success: false,
                message:
                    "Debe identificar el contrato y el pago que desea corregir"
            });
        }

        // =============================================
        // 3. OBTENER DATOS DEL NUEVO PAGO
        // =============================================

        const {
            cuenta_id,
            monto,
            metodo_pago,
            concepto,
            observaciones,
            fecha
        } = req.body || {};

        const motivo_correccion = String(
            req.body?.motivo_correccion || ""
        ).trim();

        // =============================================
        // 4. VALIDAR MOTIVO DE CORRECCIÓN
        // =============================================

        if (motivo_correccion.length < 10) {
            return res.status(400).json({
                success: false,
                message:
                    "El motivo de corrección debe contener al menos 10 caracteres"
            });
        }

        // =============================================
        // 5. VALIDAR CUENTA FINANCIERA
        // =============================================

        if (!cuenta_id) {
            return res.status(400).json({
                success: false,
                message:
                    "Debe seleccionar una cuenta financiera"
            });
        }

        // =============================================
        // 6. VALIDAR MONTO
        // =============================================

        if (
            monto === undefined ||
            monto === null ||
            monto === ""
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Debe ingresar el nuevo monto del pago"
            });
        }

        const montoNumerico = Number(monto);

        if (
            !Number.isFinite(montoNumerico) ||
            montoNumerico <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "El monto corregido debe ser mayor a cero"
            });
        }

        const centavos = Math.round(
            montoNumerico * 100
        );

        if (
            Math.abs(
                montoNumerico * 100 - centavos
            ) > 0.0000001
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "El monto no puede tener más de dos decimales"
            });
        }

        // =============================================
        // 7. VALIDAR CONCEPTO
        // =============================================

        const conceptoNormalizado = String(
            concepto || ""
        ).trim().toLowerCase();

        if (
            conceptoNormalizado !== "alquiler" &&
            conceptoNormalizado !== "anticipo"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "El concepto debe ser alquiler o anticipo"
            });
        }

        // =============================================
        // 8. EJECUTAR CORRECCIÓN ATÓMICA
        // =============================================

        // El service se encarga de:
        //
        // - Bloquear el contrato y el pago original.
        // - Validar el estado del pago.
        // - Evitar correcciones duplicadas.
        // - Verificar el movimiento financiero original.
        // - Revertir el ingreso anterior.
        // - Registrar el nuevo pago.
        // - Vincular ambos pagos.
        // - Actualizar los saldos del contrato.
        // - Confirmar o revertir la transacción SQL.

        const result = await pagosContratosService.corregirPago({
            contrato_id,
            pago_id,

            cuenta_id,
            monto: centavos / 100,

            metodo_pago,
            concepto: conceptoNormalizado,
            observaciones,
            fecha,

            motivo_correccion,
            usuario_id
        });

        // =============================================
        // 9. RESPUESTA EXITOSA
        // =============================================

        return res.status(200).json({
            success: true,
            message: "Pago corregido correctamente",
            data: result
        });

    } catch (error) {
        next(error);
    }
};

// =====================================================
// EXPORTACIONES
// =====================================================

module.exports = {
    registrar,
    listarPorContrato,
    resumen,
    anular,
    corregir
};
