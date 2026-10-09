const express = require("express");

const router = express.Router();

const jornadasAlquilerController = require(
    "./jornadasAlquiler.controller"
);

const {
    registrarJornadaSchema,
    actualizarJornadaSchema,
    jornadaIdSchema,
    contratoIdSchema,
    detalleContratoIdSchema,
} = require("./jornadasAlquiler.schema");

/* =====================================================
   MIDDLEWARE DE AUTENTICACIÓN
===================================================== */

const protect = require(
    "../../middlewares/auth.middleware"
);

/* =====================================================
   MIDDLEWARE DE VALIDACIÓN
===================================================== */

const validarBody = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(
            req.body,
            {
                abortEarly: false,
                stripUnknown: true,
            }
        );

        if (error) {
            return res.status(400).json({
                success: false,
                message:
                    "Los datos enviados no son válidos",
                errors: error.details.map(
                    (detalle) =>
                        detalle.message
                ),
            });
        }

        req.body = value;

        return next();
    };
};

const validarParams = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(
            req.params,
            {
                abortEarly: false,
                stripUnknown: true,
            }
        );

        if (error) {
            return res.status(400).json({
                success: false,
                message:
                    "Los parámetros enviados no son válidos",
                errors: error.details.map(
                    (detalle) =>
                        detalle.message
                ),
            });
        }

        req.params = value;

        return next();
    };
};

/* =====================================================
   PROTEGER TODAS LAS RUTAS
===================================================== */

router.use(protect);

/* =====================================================
   REGISTRAR JORNADA
===================================================== */

/*
POST /api/jornadas-alquiler

Body:
{
    "detalle_contrato_id": "uuid",
    "fecha": "2026-10-06",
    "estado": "trabajado",
    "cantidad_efectiva": 1,
    "motivo": null,
    "observaciones": null
}
*/

router.post(
    "/",
    validarBody(
        registrarJornadaSchema
    ),
    jornadasAlquilerController.registrarJornada
);

/* =====================================================
   LISTAR JORNADAS DE UN CONTRATO
===================================================== */

/*
GET /api/jornadas-alquiler/contrato/:contratoId
*/

router.get(
    "/contrato/:contratoId",
    validarParams(
        contratoIdSchema
    ),
    jornadasAlquilerController.listarJornadasPorContrato
);

/* =====================================================
   OBTENER RESUMEN EFECTIVO DEL CONTRATO
===================================================== */

/*
GET /api/jornadas-alquiler/contrato/:contratoId/resumen
*/

router.get(
    "/contrato/:contratoId/resumen",
    validarParams(
        contratoIdSchema
    ),
    jornadasAlquilerController.obtenerResumenContrato
);

/* =====================================================
   LISTAR JORNADAS DE UN DETALLE
===================================================== */

/*
GET /api/jornadas-alquiler/detalle/:detalleContratoId
*/

router.get(
    "/detalle/:detalleContratoId",
    validarParams(
        detalleContratoIdSchema
    ),
    jornadasAlquilerController.listarJornadasPorDetalle
);

/* =====================================================
   OBTENER JORNADA POR ID
===================================================== */

/*
GET /api/jornadas-alquiler/:id
*/

router.get(
    "/:id",
    validarParams(
        jornadaIdSchema
    ),
    jornadasAlquilerController.obtenerJornadaPorId
);

/* =====================================================
   ACTUALIZAR JORNADA
===================================================== */

/*
PUT /api/jornadas-alquiler/:id
*/

router.put(
    "/:id",
    validarParams(
        jornadaIdSchema
    ),
    validarBody(
        actualizarJornadaSchema
    ),
    jornadasAlquilerController.actualizarJornada
);

/* =====================================================
   ELIMINAR JORNADA
===================================================== */

/*
DELETE /api/jornadas-alquiler/:id
*/

router.delete(
    "/:id",
    validarParams(
        jornadaIdSchema
    ),
    jornadasAlquilerController.eliminarJornada
);

/* =====================================================
   EXPORTAR ROUTER
===================================================== */

module.exports = router;