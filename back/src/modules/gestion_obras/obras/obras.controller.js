const obrasService = require("./obras.service");

const {
    createObraSchema,
    updateObraSchema
} = require("./obras.schema");

/* =========================
   CREAR OBRA
========================= */
const createObra = async (req, res) => {

    try {

        const { error } = createObraSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                message: error.details[0].message
            });
        }

        const obra = await obrasService.createObra(req.body);

        res.status(201).json({
            success: true,
            data: obra
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

/* =========================
   LISTAR OBRAS
========================= */
const getObras = async (req, res) => {

    try {

        const obras = await obrasService.getObras();

        res.json({
            success: true,
            data: obras
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

/* =========================
   ACTUALIZAR OBRA
========================= */
const updateObra = async (req, res) => {

    try {

        const { error } = updateObraSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                message: error.details[0].message
            });
        }

        const obra = await obrasService.updateObra(
            req.params.id,
            req.body
        );

        res.json({
            success: true,
            data: obra
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

/* =========================
   ELIMINAR OBRA
========================= */
const deleteObra = async (req, res) => {

    try {

        const obra = await obrasService.deleteObra(req.params.id);

        res.json({
            success: true,
            message: "Obra eliminada correctamente",
            data: obra
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};
/* =========================
   GET OBRA BY ID
========================= */
const getObraById = async (req, res) => {

    try {

        const obra = await obrasService.getObraById(
            req.params.id
        );

        if (!obra) {
            return res.status(404).json({
                message: "Obra no encontrada"
            });
        }

        res.json({
            success: true,
            data: obra
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};



/* =========================
   ASIGNAR EMPLEADO A OBRA
========================= */
const asignarEmpleadoObra = async (req, res) => {
    try {

        const empleadoObra =
            await obrasService.asignarEmpleadoObra(
                req.body
            );

        res.status(201).json({
            success: true,
            data: empleadoObra
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

/* =========================
   EMPLEADOS DE UNA OBRA
========================= */
const getEmpleadosObra = async (req, res) => {
    try {

        const empleados =
            await obrasService.getEmpleadosObra(
                req.params.obraId
            );

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
   DESASIGNAR EMPLEADO
========================= */
const desasignarEmpleadoObra = async (req, res) => {
    try {

        const { motivo_salida, observaciones } = req.body;

        const asignacion =
            await obrasService.desasignarEmpleadoObra(
                req.params.id,
                motivo_salida,
                observaciones
            );

        res.json({
            success: true,
            message: "Empleado desasignado correctamente",
            data: asignacion
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


const registrarActividadObra = async (req, res) => {
    try {

        const {
            obra_id,
            fecha,
            actividad,
            descripcion,
            hora_inicio,
            hora_fin,
            avance,
            observaciones,
            clima
        } = req.body;

        const control =
            await obrasService.registrarActividadObra({
                obra_id,
                fecha,
                actividad,
                descripcion,
                hora_inicio,
                hora_fin,
                avance,
                observaciones,
                clima
            });

        res.json({
            success: true,
            message: "Control diario registrado correctamente",
            data: control
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

const listarControlesPorObra = async (req, res) => {
    try {

        const { obra_id } = req.params;

        const controles =
            await obrasService.listarControlesPorObra(obra_id);

        res.json({
            success: true,
            message: "Controles diarios obtenidos correctamente",
            data: controles
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};
module.exports = {
    createObra,
    getObras,
    updateObra,
    deleteObra,
    getObraById,

    asignarEmpleadoObra,
    getEmpleadosObra,
    desasignarEmpleadoObra,

    registrarActividadObra,
    listarControlesPorObra
};