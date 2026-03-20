const { crearActivo, listarActivos, obtenerReporteInventario } = require("./activos.service");
const PDFDocument = require("pdfkit");
const path = require("path");
const { crearActivoSchema } = require("./activos.schema");

const crear = async (req, res) => {

    try {

        const { error } = crearActivoSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const activo = await crearActivo(req.body);

        res.status(201).json({
            success: true,
            data: activo
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const listar = async (req, res) => {

    try {

        const activos = await listarActivos();

        res.json({
            success: true,
            data: activos
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const reporteInventario = async (req, res, next) => {
    try {

        const data = await obtenerReporteInventario();

        res.json({
            success: true,
            data
        });

    } catch (error) {
        next(error);
    }
};
const exportarInventarioPDF = async (req, res, next) => {
    try {

        const data = await obtenerReporteInventario();

        const doc = new PDFDocument({ margin: 40 });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=reporte_inventario.pdf"
        );

        doc.pipe(res);

        /* LOGO */
        const logoPath = path.join(__dirname, "../../../assets/logo_128.png");
        doc.image(logoPath, 40, 20, { width: 80 });

        /* TITULO */
        doc.fontSize(18)
            .text("REPORTE INVENTARIO GENERAL", 150, 30);

        /* FECHA */
        const fecha = new Date().toLocaleDateString();
        doc.fontSize(10)
            .text(`Fecha: ${fecha}`, 450, 30);

        doc.moveDown(3);

        /* CABECERA TABLA */

        const tableTop = 120;

        doc.fontSize(12)
            .text("Activo", 50, tableTop)
            .text("Categoría", 200, tableTop)
            .text("Ubicación", 350, tableTop)
            .text("Stock", 500, tableTop);

        doc.moveTo(50, tableTop + 15)
            .lineTo(550, tableTop + 15)
            .stroke();

        /* FILAS */

        let y = tableTop + 30;

        data.forEach((item) => {

            doc.fontSize(10)
                .text(item.activo, 50, y)
                .text(item.categoria, 200, y)
                .text(item.ubicacion, 350, y)
                .text(item.stock.toString(), 500, y);

            y += 20;
        });

        doc.end();

    } catch (error) {
        next(error);
    }
};

module.exports = {
    crear,
    listar,
    reporteInventario,
    exportarInventarioPDF
};