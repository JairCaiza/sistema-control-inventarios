const Joi = require("joi");

/* =====================================================
   ESTADOS PERMITIDOS
===================================================== */

const estadosInventario = [
    "disponible",
    "mantenimiento",
    "danado",
    "perdido",
    "dado_baja"
];

/* =====================================================
   CREAR ACTIVO
===================================================== */

const crearActivoSchema = Joi.object({
    nombre: Joi.string()
        .trim()
        .min(3)
        .max(150)
        .required()
        .messages({
            "string.empty":
                "El nombre del activo es obligatorio.",
            "string.min":
                "El nombre debe tener al menos 3 caracteres.",
            "string.max":
                "El nombre no puede superar los 150 caracteres.",
            "any.required":
                "El nombre del activo es obligatorio."
        }),

    descripcion: Joi.string()
        .trim()
        .allow("", null),

    categoria_id: Joi.string()
        .uuid()
        .required()
        .messages({
            "any.required":
                "La categoría es obligatoria.",
            "string.guid":
                "La categoría seleccionada no es válida."
        }),

    /*
     * La ubicación ya no se guardará directamente
     * en activos.
     *
     * El service la utilizará para crear
     * existencias_activos.
     */
    ubicacion_id: Joi.string()
        .uuid()
        .required()
        .messages({
            "any.required":
                "La ubicación inicial es obligatoria.",
            "string.guid":
                "La ubicación seleccionada no es válida."
        }),

    /*
     * Al crear un activo NO permitimos "alquilado".
     *
     * Ese estado deberá generarse desde
     * contratos / movimientos.
     */
    estado: Joi.string()
        .valid(...estadosInventario)
        .default("disponible")
        .messages({
            "any.only":
                "El estado debe ser disponible, mantenimiento, danado, perdido o dado_baja."
        }),

    tipo_control: Joi.string()
        .valid(
            "unidad",
            "cantidad"
        )
        .required()
        .messages({
            "any.only":
                "El tipo de control debe ser unidad o cantidad.",
            "any.required":
                "El tipo de control es obligatorio."
        }),

    /*
     * Para tipo unidad:
     * inicialmente permitimos cantidad > 1 porque
     * el service podrá generar varios registros
     * individuales automáticamente.
     *
     * Para tipo cantidad:
     * representa stock agrupado.
     */
    cantidad_total: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
            "number.base":
                "La cantidad debe ser numérica.",
            "number.integer":
                "La cantidad debe ser un número entero.",
            "number.min":
                "La cantidad debe ser mayor que cero.",
            "any.required":
                "La cantidad inicial es obligatoria."
        }),

    valor_reposicion: Joi.number()
        .min(0)
        .precision(2)
        .allow(null)
        .optional()
        .messages({
            "number.min":
                "El valor de reposición no puede ser negativo."
        }),

    marca: Joi.string()
        .trim()
        .max(100)
        .allow("", null),

    color: Joi.string()
        .trim()
        .max(50)
        .allow("", null),

    responsable: Joi.string()
        .trim()
        .max(150)
        .allow("", null),

    observaciones: Joi.string()
        .trim()
        .max(1000)
        .allow("", null)
})
    .unknown(false);

/* =====================================================
   ACTUALIZAR ACTIVO
===================================================== */

/*
 * Aquí solo actualizamos información descriptiva.
 *
 * NO se cambia:
 *
 * - ubicación
 * - estado
 * - cantidad
 *
 * porque esas operaciones deberán pasar por
 * existencias_activos / movimientos_inventario.
 */
const actualizarActivoSchema = Joi.object({
    nombre: Joi.string()
        .trim()
        .min(3)
        .max(150),

    descripcion: Joi.string()
        .trim()
        .allow("", null),

    categoria_id: Joi.string()
        .uuid(),

    valor_reposicion: Joi.number()
        .min(0)
        .precision(2)
        .allow(null),

    marca: Joi.string()
        .trim()
        .max(100)
        .allow("", null),

    color: Joi.string()
        .trim()
        .max(50)
        .allow("", null),

    responsable: Joi.string()
        .trim()
        .max(150)
        .allow("", null),

    observaciones: Joi.string()
        .trim()
        .max(1000)
        .allow("", null),

    activo: Joi.boolean()
})
    .min(1)
    .unknown(false)
    .messages({
        "object.min":
            "Debe enviar al menos un campo para actualizar."
    });

/* =====================================================
   CAMBIAR ESTADO DE EXISTENCIA
===================================================== */

/*
 * Esto ya NO cambia activos.estado.
 *
 * Servirá para mover una cantidad entre estados
 * dentro de existencias_activos.
 *
 * Ejemplo:
 *
 * disponible -> mantenimiento
 * cantidad: 1
 */
const cambiarEstadoActivoSchema = Joi.object({
    ubicacion_id: Joi.string()
        .uuid()
        .required(),

    estado_origen: Joi.string()
        .valid(
            "disponible",
            "mantenimiento",
            "danado",
            "perdido",
            "dado_baja"
        )
        .required(),

    estado_destino: Joi.string()
        .valid(
            "disponible",
            "mantenimiento",
            "danado",
            "perdido",
            "dado_baja"
        )
        .required(),

    cantidad: Joi.number()
        .integer()
        .min(1)
        .required(),

    motivo: Joi.string()
        .trim()
        .max(500)
        .allow("", null)
})
    .custom(
        (
            value,
            helpers
        ) => {
            if (
                value.estado_origen ===
                value.estado_destino
            ) {
                return helpers.error(
                    "any.invalid"
                );
            }

            return value;
        }
    )
    .messages({
        "any.invalid":
            "El estado de origen y destino deben ser diferentes."
    })
    .unknown(false);

/* =====================================================
   EXPORTACIONES
===================================================== */

module.exports = {
    crearActivoSchema,
    actualizarActivoSchema,
    cambiarEstadoActivoSchema
};