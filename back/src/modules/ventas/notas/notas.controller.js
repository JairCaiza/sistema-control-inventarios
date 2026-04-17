const { crearNotaSchema } = require("./notas.schema");
const notasService = require("./notas.service");
const PDFDocument = require("pdfkit"); // 👈 IMPORTANTE

/* =========================
   🧾 Crear
========================= */
const crear = async (req, res, next) => {
    try {
        const { error } = crearNotaSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const data = {
            cliente_id: req.body.cliente_id ?? null,
            metodo_pago: req.body.metodo_pago ?? "efectivo",
            detalles: req.body.detalles ?? []
        };

        if (data.detalles.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Debe enviar al menos un detalle"
            });
        }

        const nota = await notasService.crear(data);

        res.status(201).json({
            success: true,
            data: nota
        });

    } catch (error) {
        next(error);
    }
};

/* =========================
   📄 Listar
========================= */
const listar = async (req, res, next) => {
    try {
        const data = await notasService.listar();

        res.json({
            success: true,
            data
        });

    } catch (error) {
        next(error);
    }
};

/* =========================
   🔍 Obtener por ID
========================= */
const obtenerPorId = async (req, res, next) => {
    try {
        const data = await notasService.obtenerPorId(req.params.id);

        res.json({
            success: true,
            data
        });

    } catch (error) {
        next(error);
    }
};

/* =========================
   🧾 PDF REAL (HU-28)
========================= */
const generarPDF = async (req, res, next) => {
    try {
        const nota = await notasService.obtenerConDetalles(req.params.id);

        if (!nota) {
            return res.status(404).json({
                success: false,
                message: "Nota no encontrada"
            });
        }

        const doc = new PDFDocument({
            size: [226, 600], // tamaño ticket
            margin: 10
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `inline; filename=nota-${nota.numero}.pdf`
        );

        doc.pipe(res);

        /* 🏢 ENCABEZADO */
        doc
            .fontSize(12)
            .text("HNOS GUARACA", { align: "center" });

        doc
            .fontSize(8)
            .text("Alquiler y Venta de Equipos", { align: "center" })
            .text("RUC: 1234567890001", { align: "center" })
            .text("Tel: 0999999999", { align: "center" });

        doc.moveDown(0.5);
        doc.text("--------------------------------", { align: "center" });

        /* 📄 INFO */
        doc
            .fontSize(8)
            .text(`Nota: ${nota.numero}`)
            .text(`Fecha: ${new Date(nota.fecha).toLocaleDateString()}`)
            .text(`Cliente: ${nota.cliente || "Consumidor Final"}`);

        doc.moveDown(0.5);
        doc.text("--------------------------------");

        /* 📦 DETALLES */
        doc.fontSize(8).text("DESCRIPCIÓN");

        nota.detalles.forEach((d) => {
            doc
                .text(`${d.descripcion}`)
                .text(
                    `${d.cantidad} x ${Number(d.precio_unitario).toFixed(2)} = ${Number(d.subtotal).toFixed(2)}`,
                    { align: "right" }
                );
        });

        doc.moveDown(0.5);
        doc.text("--------------------------------");

        /* 💰 TOTAL */
        doc
            .fontSize(10)
            .text(`TOTAL: $${Number(nota.total).toFixed(2)}`, {
                align: "right"
            });

        doc.moveDown(0.5);

        /* 💳 PAGO */
        doc
            .fontSize(8)
            .text("Método de pago:")
            .text(nota.metodo_pago.toUpperCase());

        doc.moveDown(1);

        /* 🙏 FOOTER */
        doc
            .fontSize(8)
            .text("¡GRACIAS POR SU COMPRA!", { align: "center" });

        doc.text("--------------------------------", { align: "center" });

        doc.end();

    } catch (error) {
        next(error);
    }
};

module.exports = {
    crear,
    listar,
    obtenerPorId,
    generarPDF
};