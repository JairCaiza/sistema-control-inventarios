const { crearActivo, listarActivos, obtenerReporteInventario } = require("./activos.service");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
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

        /* POSICION TABLA */
        const tableTop = 120;

        /* CABECERA */
        doc.fontSize(12)
            .text("Código", 50, tableTop)
            .text("Activo", 120, tableTop)
            .text("Categoría", 260, tableTop)
            .text("Ubicación", 400, tableTop)
            .text("Stock", 520, tableTop);

        doc.moveTo(50, tableTop + 15)
            .lineTo(560, tableTop + 15)
            .stroke();

        /* FILAS */

        let y = tableTop + 30;

        data.forEach((item) => {

            doc.fontSize(10)
                .text(item.codigo, 50, y)
                .text(item.activo, 120, y)
                .text(item.categoria, 260, y)
                .text(item.ubicacion, 400, y)
                .text(item.stock.toString(), 520, y);

            y += 20;
        });

        doc.end();

    } catch (error) {
        next(error);
    }
};
const exportarInventarioExcel = async (req, res, next) => {
    try {

        const data = await obtenerReporteInventario();

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Inventario");

        /* TITULO */

        worksheet.mergeCells("A1:E1");
        worksheet.getCell("A1").value = "REPORTE INVENTARIO GENERAL";
        worksheet.getCell("A1").font = { size: 16, bold: true };
        worksheet.getCell("A1").alignment = { horizontal: "center" };

        /* FECHA */

        worksheet.mergeCells("A2:E2");
        worksheet.getCell("A2").value = `Fecha: ${new Date().toLocaleDateString()}`;
        worksheet.getCell("A2").alignment = { horizontal: "center" };

        /* CABECERAS */

        worksheet.columns = [
            { header: "Código", key: "codigo", width: 15 },
            { header: "Activo", key: "activo", width: 30 },
            { header: "Categoría", key: "categoria", width: 25 },
            { header: "Ubicación", key: "ubicacion", width: 25 },
            { header: "Stock", key: "stock", width: 10 }
        ];

        /* ESTILO CABECERA */

        worksheet.getRow(3).font = { bold: true };

        /* FILAS */

        data.forEach((item) => {
            worksheet.addRow({
                codigo: item.codigo,
                activo: item.activo,
                categoria: item.categoria,
                ubicacion: item.ubicacion,
                stock: item.stock
            });
        });

        /* BORDES */

        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" }
                };
            });
        });

        /* HEADERS */

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=reporte_inventario.xlsx"
        );

        await workbook.xlsx.write(res);

        res.end();

    } catch (error) {
        next(error);
    }
};
module.exports = {
    crear,
    listar,
    reporteInventario,
    exportarInventarioExcel,
    exportarInventarioPDF,
};