const { crearCategoria } = require("./categorias.service");
const { crearCategoriaSchema } = require("./categorias.schema");
const { listarCategorias } = require("./categorias.service");
const { actualizarCategoria } = require("./categorias.service");
const { toggleCategoriaStatus } = require("./categorias.service");
const { actualizarCategoriaSchema } = require("./categorias.schema");
const { eliminarCategoria } = require("./categorias.service");

const crearCategorias = async (req, res) => {
    try {
        const { error } = crearCategoriaSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const categoria = await crearCategoria(req.body);

        res.status(201).json({
            success: true,
            data: categoria,
        });

    } catch (error) {

        if (error.code === "23505") {
            return res.status(400).json({
                success: false,
                message: "Ya existe una categoría con ese nombre y tipo",
            });
        }

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
const obtenerCategorias = async (req, res) => {
    try {
        const categorias = await listarCategorias();

        res.json({
            success: true,
            data: categorias,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


const actualizar = async (req, res) => {
    try {
        const { error } = actualizarCategoriaSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const categoria = await actualizarCategoria(req.params.id, req.body);

        if (!categoria) {
            return res.status(404).json({
                success: false,
                message: "Categoría no encontrada",
            });
        }

        res.json({
            success: true,
            data: categoria,
        });

    } catch (error) {

        if (error.code === "23505") {
            return res.status(400).json({
                success: false,
                message: "Ya existe una categoría con ese nombre y tipo",
            });
        }

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const eliminar = async (req, res) => {
    try {
        const categoria = await eliminarCategoria(req.params.id);

        if (!categoria) {
            return res.status(404).json({
                success: false,
                message: "Categoría no encontrada",
            });
        }

        res.json({
            success: true,
            message: "Categoría desactivada correctamente",
        });

    } catch (error) {

        if (error.message.includes("No se puede eliminar")) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


const toggleCategoriaStatusController = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.body) {
            return res.status(400).json({
                success: false,
                message: "Body vacío",
            });
        }

        const { activo } = req.body;

        if (typeof activo === "undefined") {
            return res.status(400).json({
                success: false,
                message: "Campo 'activo' es requerido",
            });
        }

        const categoria = await toggleCategoriaStatus(id, activo);

        res.json({
            success: true,
            data: categoria,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
module.exports = {
    crearCategorias, obtenerCategorias, actualizar, eliminar, toggleCategoriaStatusController
};