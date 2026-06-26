const empleadosService = require("./empleados.service");

const {
    createEmpleadoSchema,
    updateEmpleadoSchema
} = require("./empleados.schema");

/* =========================
   CREAR EMPLEADO
========================= */
const createEmpleado = async (req, res) => {
    try {

        const { error } = createEmpleadoSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                message: error.details[0].message
            });
        }

        const empleado = await empleadosService.createEmpleado(req.body);

        res.status(201).json({
            success: true,
            data: empleado
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

/* =========================
   LISTAR EMPLEADOS
========================= */
const getEmpleados = async (req, res) => {
    try {

        const empleados = await empleadosService.getEmpleados();

        res.json({
            success: true,
            data: empleados
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

/* =========================
   OBTENER EMPLEADO POR ID
========================= */
const getEmpleadoById = async (req, res) => {
    try {

        const empleado = await empleadosService.getEmpleadoById(req.params.id);

        if (!empleado) {
            return res.status(404).json({
                message: "Empleado no encontrado"
            });
        }

        res.json({
            success: true,
            data: empleado
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

/* =========================
   ACTUALIZAR EMPLEADO
========================= */
const updateEmpleado = async (req, res) => {
    try {

        const { error } = updateEmpleadoSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                message: error.details[0].message
            });
        }

        const empleado = await empleadosService.updateEmpleado(
            req.params.id,
            req.body
        );

        res.json({
            success: true,
            data: empleado
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

/* =========================
   ACTIVAR / DESACTIVAR EMPLEADO
========================= */
const toggleEmpleadoStatus = async (req, res) => {
    try {

        const { id } = req.params;
        const { activo } = req.body || {};

        if (typeof activo !== "boolean") {
            return res.status(400).json({
                message: "Campo 'activo' es requerido y debe ser boolean"
            });
        }

        const empleado = await empleadosService.toggleEmpleadoStatus(
            id,
            activo
        );

        res.json({
            success: true,
            data: empleado
        });

    } catch (error) {

        console.error("ERROR TOGGLE EMPLEADO:", error);

        res.status(500).json({
            message: error.message
        });

    }
};

/* =========================
   ELIMINAR EMPLEADO
========================= */
const deleteEmpleado = async (req, res) => {
    try {

        const { id } = req.params;

        const empleado = await empleadosService.deleteEmpleado(id);

        res.json({
            success: true,
            message: "Empleado eliminado correctamente",
            data: empleado
        });

    } catch (error) {

        res.status(400).json({
            message: error.message
        });

    }
};

module.exports = {
    createEmpleado,
    getEmpleados,
    getEmpleadoById,
    updateEmpleado,
    toggleEmpleadoStatus,
    deleteEmpleado
};