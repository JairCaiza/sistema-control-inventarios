const Joi = require("joi");

const crearClienteSchema = Joi.object({

    tipo_cliente: Joi.string()
        .valid("persona", "empresa")
        .required(),

    tipo_identificacion: Joi.string()
        .valid("cedula", "ruc", "pasaporte")
        .optional(),

    identificacion: Joi.string()
        .max(20)
        .optional(),

    nombre: Joi.string()
        .max(150)
        .required(),

    apellido: Joi.string()
        .max(150)
        .allow(null, ""),

    telefono: Joi.string()
        .max(20)
        .allow(null, ""),

    direccion: Joi.string()
        .allow(null, ""),

    correo: Joi.string()
        .email()
        .allow(null, "")
});

module.exports = {
    crearClienteSchema
};