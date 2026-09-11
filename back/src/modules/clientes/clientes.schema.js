const Joi = require("joi");

const {
    validarCedulaEcuador,
    validarRucEcuador,
    validarPasaporte
} = require(
    "../../utils/validacionesEcuador"
);

/* =====================================================
   VALIDAR IDENTIFICACIÓN
===================================================== */

const validarIdentificacion = (
    value,
    helpers
) => {
    const {
        tipo_identificacion,
        tipo_cliente
    } = helpers.state.ancestors[0];

    /* =================================================
       CÉDULA
    ================================================= */

    if (
        tipo_identificacion ===
        "cedula"
    ) {
        if (
            tipo_cliente ===
            "empresa"
        ) {
            return helpers.message({
                custom:
                    "Una empresa no puede registrarse con cédula."
            });
        }

        if (
            !validarCedulaEcuador(
                value
            )
        ) {
            return helpers.message({
                custom:
                    "La cédula ecuatoriana ingresada no es válida."
            });
        }

        return value;
    }

    /* =================================================
       RUC
    ================================================= */

    if (
        tipo_identificacion ===
        "ruc"
    ) {
        if (
            !validarRucEcuador(
                value
            )
        ) {
            return helpers.message({
                custom:
                    "El RUC ingresado no tiene una estructura válida."
            });
        }

        return value;
    }

    /* =================================================
       PASAPORTE
    ================================================= */

    if (
        tipo_identificacion ===
        "pasaporte"
    ) {
        if (
            !validarPasaporte(
                value
            )
        ) {
            return helpers.message({
                custom:
                    "El número de pasaporte no tiene un formato válido."
            });
        }

        return value;
    }

    return value;
};

/* =====================================================
   SCHEMA CLIENTE
===================================================== */

const clienteSchema =
    Joi.object({
        /* =================================================
           TIPO CLIENTE
        ================================================= */

        tipo_cliente:
            Joi.string()
                .valid(
                    "persona",
                    "empresa"
                )
                .required()
                .messages({
                    "any.required":
                        "El tipo de cliente es obligatorio.",
                    "any.only":
                        "El tipo de cliente debe ser persona o empresa."
                }),

        /* =================================================
           IDENTIFICACIÓN
        ================================================= */

        tipo_identificacion:
            Joi.string()
                .valid(
                    "cedula",
                    "ruc",
                    "pasaporte"
                )
                .required()
                .messages({
                    "any.required":
                        "El tipo de identificación es obligatorio.",
                    "any.only":
                        "El tipo de identificación debe ser cédula, RUC o pasaporte."
                }),

        identificacion:
            Joi.string()
                .trim()
                .min(5)
                .max(20)
                .required()
                .custom(
                    validarIdentificacion
                )
                .messages({
                    "string.empty":
                        "La identificación es obligatoria.",
                    "string.min":
                        "La identificación debe tener al menos 5 caracteres.",
                    "string.max":
                        "La identificación no puede superar los 20 caracteres.",
                    "any.required":
                        "La identificación es obligatoria."
                }),

        /* =================================================
           NOMBRE / RAZÓN SOCIAL
        ================================================= */

        nombre:
            Joi.string()
                .trim()
                .min(2)
                .max(150)
                .required()
                .messages({
                    "string.empty":
                        "El nombre es obligatorio.",
                    "string.min":
                        "El nombre debe tener al menos 2 caracteres.",
                    "string.max":
                        "El nombre no puede superar los 150 caracteres.",
                    "any.required":
                        "El nombre es obligatorio."
                }),

        /* =================================================
           APELLIDO
        ================================================= */

        apellido:
            Joi.when(
                "tipo_cliente",
                {
                    is: "persona",

                    then:
                        Joi.string()
                            .trim()
                            .min(2)
                            .max(150)
                            .required()
                            .messages({
                                "string.empty":
                                    "El apellido es obligatorio para una persona.",
                                "string.min":
                                    "El apellido debe tener al menos 2 caracteres.",
                                "any.required":
                                    "El apellido es obligatorio para una persona."
                            }),

                    otherwise:
                        Joi.string()
                            .trim()
                            .max(150)
                            .allow(
                                "",
                                null
                            )
                            .optional()
                }
            ),

        /* =================================================
           TELÉFONO
        ================================================= */

        telefono:
            Joi.string()
                .trim()
                .pattern(
                    /^[0-9+\-\s()]{7,20}$/
                )
                .allow(
                    "",
                    null
                )
                .optional()
                .messages({
                    "string.pattern.base":
                        "El número de teléfono no tiene un formato válido."
                }),

        /* =================================================
           DIRECCIÓN
        ================================================= */

        direccion:
            Joi.string()
                .trim()
                .max(300)
                .allow(
                    "",
                    null
                )
                .optional()
                .messages({
                    "string.max":
                        "La dirección no puede superar los 300 caracteres."
                }),

        /* =================================================
           CORREO
        ================================================= */

        correo:
            Joi.string()
                .trim()
                .lowercase()
                .email({
                    tlds: {
                        allow: false
                    }
                })
                .max(150)
                .allow(
                    "",
                    null
                )
                .optional()
                .messages({
                    "string.email":
                        "El correo electrónico no tiene un formato válido.",
                    "string.max":
                        "El correo no puede superar los 150 caracteres."
                })
    })
        .unknown(false);

/* =====================================================
   EXPORTACIONES
===================================================== */

module.exports = {
    crearClienteSchema:
        clienteSchema,

    actualizarClienteSchema:
        clienteSchema
};