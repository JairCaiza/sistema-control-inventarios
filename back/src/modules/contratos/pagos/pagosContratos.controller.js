const pagosContratosService = require("./pagosContratos.service");

/* =========================
   REGISTRAR PAGO
========================= */
const registrar = async (req, res, next) => {
    try {
        const contrato_id = req.params.id;

        const result = await pagosContratosService.registrarPago({
            contrato_id,
            cuenta_id: req.body.cuenta_id,
            monto: req.body.monto,
            metodo_pago: req.body.metodo_pago,
            concepto: req.body.concepto,
            observaciones: req.body.observaciones
        });

        res.status(201).json({
            success: true,
            message: "Pago registrado correctamente",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/* =========================
   LISTAR PAGOS POR CONTRATO
========================= */
const listarPorContrato = async (req, res, next) => {
    try {
        const pagos = await pagosContratosService.listarPorContrato(
            req.params.id
        );

        res.json({
            success: true,
            data: pagos
        });
    } catch (error) {
        next(error);
    }
};

/* =========================
   RESUMEN PAGOS CONTRATO
========================= */
const resumen = async (req, res, next) => {
    try {
        const data = await pagosContratosService.resumenContrato(req.params.id);

        res.json({
            success: true,
            data
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registrar,
    listarPorContrato,
    resumen
};