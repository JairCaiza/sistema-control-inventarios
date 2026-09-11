const Joi = require("joi");

/* =====================================================
   CAMPOS REUTILIZABLES
===================================================== */

const nombresSchema = Joi.string()
    .trim()
    .min(2)
    .max(100);

const apellidosSchema = Joi.string()
    .trim()
    .min(2)
    .max(100);

const cedulaSchema = Joi.string()
    .trim()
    .pattern(/^[0-9]{10}$/)
    .messages({
        "string.pattern.base": "La cédula debe tener exactamente 10 dígitos"
    });

const telefonoSchema = Joi.string()
    .trim()
    .pattern(/^[0-9]{7,15}$/)
    .allow("", null)
    .messages({
        "string.pattern.base":
            "El teléfono debe contener únicamente números y tener entre 7 y 15 dígitos"
    });

const correoSchema = Joi.string()
    .trim()
    .email()
    .max(150)
    .allow("", null)
    .messages({
        "string.email": "Ingrese un correo electrónico válido"
    });

const direccionSchema = Joi.string()
    .trim()
    .max(500)
    .allow("", null);

const fechaNacimientoSchema = Joi.date()
    .iso()
    .max("now")
    .allow("", null)
    .messages({
        "date.max": "La fecha de nacimiento no puede ser futura",
        "date.format": "La fecha de nacimiento no tiene un formato válido"
    });

const cargoSchema = Joi.string()
    .trim()
    .max(100)
    .allow("", null);

const tipoPagoSchema = Joi.string()
    .valid(
        "diario",
        "semanal",
        "quincenal",
        "mensual"
    )
    .messages({
        "any.only":
            "El tipo de pago debe ser diario, semanal, quincenal o mensual"
    });

const salarioBaseSchema = Joi.number()
    .precision(2)
    .min(0)
    .allow("", null)
    .messages({
        "number.min": "El salario base no puede ser negativo"
    });

const fechaIngresoSchema = Joi.date()
    .iso()
    .allow("", null)
    .messages({
        "date.format": "La fecha de ingreso no tiene un formato válido"
    });

const observacionesSchema = Joi.string()
    .trim()
    .max(1000)
    .allow("", null);

/* =====================================================
   CREAR EMPLEADO
===================================================== */

const createEmpleadoSchema = Joi.object({
    nombres: nombresSchema.required(),

    apellidos: apellidosSchema.required(),

    cedula: cedulaSchema.required(),

    telefono: telefonoSchema.optional(),

    correo: correoSchema.optional(),

    direccion: direccionSchema.optional(),

    fecha_nacimiento: fechaNacimientoSchema.optional(),

    cargo: cargoSchema.optional(),

    tipo_pago: tipoPagoSchema.required(),

    salario_base: salarioBaseSchema.optional(),

    fecha_ingreso: fechaIngresoSchema.optional(),

    activo: Joi.boolean()
        .optional(),

    observaciones: observacionesSchema.optional()
});

/* =====================================================
   ACTUALIZAR EMPLEADO
===================================================== */

const updateEmpleadoSchema = Joi.object({
    nombres: nombresSchema.optional(),

    apellidos: apellidosSchema.optional(),

    cedula: cedulaSchema.optional(),

    telefono: telefonoSchema.optional(),

    correo: correoSchema.optional(),

    direccion: direccionSchema.optional(),

    fecha_nacimiento: fechaNacimientoSchema.optional(),

    cargo: cargoSchema.optional(),

    tipo_pago: tipoPagoSchema.optional(),

    salario_base: salarioBaseSchema.optional(),

    fecha_ingreso: fechaIngresoSchema.optional(),

    activo: Joi.boolean()
        .optional(),

    observaciones: observacionesSchema.optional()
})
    .min(1)
    .messages({
        "object.min":
            "Debe enviar al menos un campo para actualizar el empleado"
    });

/* =====================================================
   ESTADO
===================================================== */

const toggleEmpleadoStatusSchema = Joi.object({
    activo: Joi.boolean()
        .required()
        .messages({
            "any.required": "El campo activo es obligatorio",
            "boolean.base": "El campo activo debe ser boolean"
        })
});

/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
    createEmpleadoSchema,
    updateEmpleadoSchema,
    toggleEmpleadoStatusSchema
};