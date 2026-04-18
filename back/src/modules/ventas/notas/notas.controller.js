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
const generarPDF = async (req, res) => {
    try {
        const { id } = req.params;

        const nota = await notasService.obtenerConDetalles(id);

        if (!nota) {
            return res.status(404).json({ message: "Nota no encontrada" });
        }

        const doc = new PDFDocument({
            size: [226, 800], // 🔥 formato ticket
            margin: 10,
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `inline; filename=nota-${nota.numero}.pdf`
        );

        doc.pipe(res);

        /* =========================
           🟢 CABECERA
        ========================= */
        doc
            .fontSize(10)
            .text("HNOS GUARACA", { align: "center" })
            .text("Alquiler y Venta de Equipos", { align: "center" })
            .text("RUC: 1234567890001", { align: "center" })
            .text("Tel: 0999999999", { align: "center" });

        doc.moveDown(0.5);

        doc
            .fontSize(9)
            .text(`Nota: ${nota.numero}`)
            .text(`Fecha: ${new Date(nota.fecha).toLocaleDateString()}`)
            .text(`Cliente: ${nota.cliente}`);

        doc.moveDown();

        /* =========================
           🔵 TABLA
        ========================= */

        const startX = 10;
        let y = doc.y;

        // Encabezado
        doc.fontSize(8);
        doc.text("Cant", startX, y);
        doc.text("Desc", startX + 35, y);
        doc.text("P.Unit", startX + 110, y);
        doc.text("Total", startX + 160, y);

        y += 10;

        // Línea header
        doc.moveTo(startX, y).lineTo(210, y).stroke();

        y += 5;

        /* FILAS */
        nota.detalles.forEach((d) => {
            const precio = Number(d.precio_unitario) || 0;
            const cantidad = Number(d.cantidad) || 0;
            const subtotal = cantidad * precio;

            doc.fontSize(8);

            doc.text(cantidad, startX, y);
            doc.text(d.descripcion, startX + 35, y, { width: 70 });
            doc.text(precio.toFixed(2), startX + 110, y);
            doc.text(subtotal.toFixed(2), startX + 160, y);

            y += 15;

            // Línea por fila
            doc.moveTo(startX, y).lineTo(210, y).stroke();
            y += 5;
        });

        /* =========================
           🔴 TOTAL
        ========================= */
        doc.moveDown();

        doc
            .fontSize(10)
            .text(`TOTAL: $${Number(nota.total).toFixed(2)}`, {
                align: "right",
            });

        doc.moveDown(2);

        /* =========================
           ✍️ FIRMAS
        ========================= */
        doc.fontSize(8);

        const yFirmas = doc.y; // 🔥 misma altura para ambos

        // Línea izquierda
        doc.text("____________________", 10, yFirmas);
        doc.text("Cliente", 10, yFirmas + 12);

        // Línea derecha
        doc.text("____________________", 110, yFirmas);
        doc.text("Responsable", 110, yFirmas + 12);

        doc.moveDown(2);

        /* =========================
           💚 MENSAJE FINAL
        ========================= */
        doc
            .fontSize(9)
            .text("¡Gracias por preferirnos!", {
                align: "center",
            });

        doc.end();

    } catch (error) {
        console.error("🔥 Error PDF:", error);

        if (!res.headersSent) {
            res.status(500).json({
                message: "Error generando PDF",
            });
        }
    }
};

module.exports = {
    crear,
    listar,
    obtenerPorId,
    generarPDF
};