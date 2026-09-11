const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const path = require("path");

const {
    crearActivo,
    listarActivos,
    obtenerActivoPorId,
    actualizarActivo,
    cambiarEstadoActivo,
    obtenerReporteInventario
} = require("./activos.service");

const {
    crearActivoSchema,
    actualizarActivoSchema,
    cambiarEstadoActivoSchema
} = require("./activos.schema");

/* =====================================================
   MANEJADOR DE ERRORES
===================================================== */

const manejarError = (
    error,
    res,
    mensajePredeterminado
) => {
    console.error(
        mensajePredeterminado,
        error
    );

    /*
     * UUID inválido.
     */
    if (error.code === "22P02") {
        return res.status(400).json({
            success: false,
            message:
                "El identificador enviado no es válido"
        });
    }

    /*
     * UNIQUE.
     */
    if (error.code === "23505") {
        return res.status(409).json({
            success: false,
            message:
                "Ya existe un registro con esos datos"
        });
    }

    /*
     * FOREIGN KEY.
     */
    if (error.code === "23503") {
        return res.status(409).json({
            success: false,
            message:
                "No se puede completar la operación porque existen registros relacionados"
        });
    }

    /*
     * CHECK constraint.
     */
    if (error.code === "23514") {
        return res.status(400).json({
            success: false,
            message:
                "Los datos incumplen una regla del inventario"
        });
    }

    return res
        .status(
            error.statusCode ||
            500
        )
        .json({
            success: false,
            message:
                error.message ||
                mensajePredeterminado
        });
};

/* =====================================================
   CREAR ACTIVO
===================================================== */

/*
 * IMPORTANTE:
 *
 * Si tipo_control = unidad
 * y cantidad_total = 5:
 *
 * el service puede crear cinco activos físicos
 * independientes.
 *
 * Si tipo_control = cantidad:
 *
 * crea un activo agrupado con una existencia
 * inicial equivalente a cantidad_total.
 */
const crear = async (
    req,
    res
) => {
    try {
        const {
            error,
            value
        } =
            crearActivoSchema.validate(
                req.body,
                {
                    abortEarly: false,
                    stripUnknown: true
                }
            );

        if (error) {
            return res
                .status(400)
                .json({
                    success: false,

                    message:
                        "Los datos enviados no son válidos",

                    errores:
                        error.details.map(
                            (
                                detalle
                            ) =>
                                detalle.message
                        )
                });
        }

        const resultado =
            await crearActivo(
                value
            );

        return res
            .status(201)
            .json({
                success: true,

                message:
                    resultado.tipo_control ===
                        "unidad"
                        ? resultado.cantidad_creada === 1
                            ? "Activo registrado correctamente"
                            : `${resultado.cantidad_creada} activos individuales registrados correctamente`
                        : "Activo registrado correctamente",

                data:
                    resultado
            });
    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al registrar el activo"
        );
    }
};

/* =====================================================
   LISTAR ACTIVOS
===================================================== */

const listar = async (
    req,
    res
) => {
    try {
        const activos =
            await listarActivos();

        return res.status(200).json({
            success: true,

            total:
                activos.length,

            data:
                activos
        });
    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al listar los activos"
        );
    }
};

/* =====================================================
   OBTENER ACTIVO POR ID
===================================================== */

const obtenerPorId = async (
    req,
    res
) => {
    try {
        const activo =
            await obtenerActivoPorId(
                req.params.id
            );

        if (!activo) {
            return res
                .status(404)
                .json({
                    success: false,
                    message:
                        "El activo no existe"
                });
        }

        return res
            .status(200)
            .json({
                success: true,
                data: activo
            });
    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al obtener el activo"
        );
    }
};

/* =====================================================
   ACTUALIZAR ACTIVO
===================================================== */

/*
 * Este endpoint modifica solamente
 * información descriptiva:
 *
 * nombre
 * descripción
 * categoría
 * marca
 * color
 * responsable
 * valor de reposición
 * observaciones
 * activo
 *
 * NO modifica:
 *
 * ubicación
 * cantidad
 * estado
 *
 * porque esas operaciones ahora pertenecen
 * al control de existencias.
 */
const actualizar = async (
    req,
    res
) => {
    try {
        const {
            error,
            value
        } =
            actualizarActivoSchema.validate(
                req.body,
                {
                    abortEarly: false,
                    stripUnknown: true
                }
            );

        if (error) {
            return res
                .status(400)
                .json({
                    success: false,

                    message:
                        "Los datos enviados no son válidos",

                    errores:
                        error.details.map(
                            (
                                detalle
                            ) =>
                                detalle.message
                        )
                });
        }

        const activo =
            await actualizarActivo(
                req.params.id,
                value
            );

        return res
            .status(200)
            .json({
                success: true,

                message:
                    "Activo actualizado correctamente",

                data:
                    activo
            });
    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al actualizar el activo"
        );
    }
};

/* =====================================================
   CAMBIAR ESTADO DE EXISTENCIA
===================================================== */

/*
 * PATCH
 *
 * /api/activos/:id/estado
 *
 * Ejemplo:
 *
 * {
 *   "ubicacion_id": "...",
 *   "estado_origen": "disponible",
 *   "estado_destino": "mantenimiento",
 *   "cantidad": 2,
 *   "motivo": "Mantenimiento preventivo"
 * }
 *
 * Si actualmente tenemos:
 *
 * disponible = 10
 *
 * y movemos 2:
 *
 * disponible    = 8
 * mantenimiento = 2
 */
const cambiarEstado = async (
    req,
    res
) => {
    try {
        const {
            error,
            value
        } =
            cambiarEstadoActivoSchema.validate(
                req.body,
                {
                    abortEarly: false,
                    stripUnknown: true
                }
            );

        if (error) {
            return res
                .status(400)
                .json({
                    success: false,

                    message:
                        "Los datos del cambio de estado no son válidos",

                    errores:
                        error.details.map(
                            (
                                detalle
                            ) =>
                                detalle.message
                        )
                });
        }

        const activo =
            await cambiarEstadoActivo(
                req.params.id,
                value
            );

        return res
            .status(200)
            .json({
                success: true,

                message:
                    "Estado del activo actualizado correctamente",

                data:
                    activo
            });
    } catch (error) {
        return manejarError(
            error,
            res,
            "Error al cambiar el estado del activo"
        );
    }
};

/* =====================================================
   REPORTE INVENTARIO JSON
===================================================== */

const reporteInventario = async (
    req,
    res,
    next
) => {
    try {
        const data =
            await obtenerReporteInventario();

        return res.status(200).json({
            success: true,
            total: data.length,
            data
        });
    } catch (error) {
        if (next) {
            return next(error);
        }

        return manejarError(
            error,
            res,
            "Error al generar el reporte de inventario"
        );
    }
};

/* =====================================================
   EXPORTAR PDF
===================================================== */

const exportarInventarioPDF = async (
    req,
    res,
    next
) => {
    try {
        const data =
            await obtenerReporteInventario();

        const doc =
            new PDFDocument({
                margin: 35,
                size: "A4",
                layout: "landscape"
            });

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=reporte_inventario.pdf"
        );

        doc.pipe(res);

        /* =================================================
           LOGO
        ================================================= */

        const logoPath =
            path.join(
                __dirname,
                "../../../assets/logo_128.png"
            );

        try {
            doc.image(
                logoPath,
                35,
                20,
                {
                    width: 65
                }
            );
        } catch (errorLogo) {
            console.warn(
                "No se pudo cargar el logo del reporte:",
                errorLogo.message
            );
        }

        /* =================================================
           ENCABEZADO
        ================================================= */

        doc
            .fontSize(18)
            .font("Helvetica-Bold")
            .text(
                "REPORTE GENERAL DE INVENTARIO",
                120,
                28
            );

        doc
            .fontSize(9)
            .font("Helvetica")
            .text(
                `Fecha de generación: ${new Date().toLocaleDateString("es-EC")}`,
                610,
                32
            );

        doc
            .fontSize(9)
            .fillColor("#666666")
            .text(
                "Detalle de existencias por estado del inventario",
                120,
                52
            );

        doc.fillColor("#000000");

        /* =================================================
           TABLA
        ================================================= */

        const tableTop = 105;

        const columnas = {
            codigo: 35,
            activo: 95,
            categoria: 235,
            ubicacion: 330,
            total: 465,
            disponible: 505,
            alquilado: 560,
            mantenimiento: 615,
            danado: 690,
            perdido: 740
        };

        const dibujarCabecera =
            (y) => {
                doc
                    .font("Helvetica-Bold")
                    .fontSize(8);

                doc.text(
                    "Código",
                    columnas.codigo,
                    y
                );

                doc.text(
                    "Activo",
                    columnas.activo,
                    y
                );

                doc.text(
                    "Categoría",
                    columnas.categoria,
                    y
                );

                doc.text(
                    "Ubicación",
                    columnas.ubicacion,
                    y
                );

                doc.text(
                    "Total",
                    columnas.total,
                    y
                );

                doc.text(
                    "Disp.",
                    columnas.disponible,
                    y
                );

                doc.text(
                    "Alq.",
                    columnas.alquilado,
                    y
                );

                doc.text(
                    "Mant.",
                    columnas.mantenimiento,
                    y
                );

                doc.text(
                    "Dañ.",
                    columnas.danado,
                    y
                );

                doc.text(
                    "Per.",
                    columnas.perdido,
                    y
                );

                doc.moveTo(
                    35,
                    y + 14
                );

                doc.lineTo(
                    800,
                    y + 14
                );

                doc.stroke();
            };

        dibujarCabecera(
            tableTop
        );

        let y =
            tableTop + 25;

        doc.font("Helvetica");

        data.forEach(
            (
                item
            ) => {
                /*
                 * Nueva página si no existe
                 * suficiente espacio.
                 */
                if (
                    y > 540
                ) {
                    doc.addPage({
                        size: "A4",
                        layout: "landscape",
                        margin: 35
                    });

                    y = 45;

                    dibujarCabecera(
                        y
                    );

                    y += 25;
                }

                doc
                    .fontSize(7.5)
                    .font("Helvetica");

                doc.text(
                    item.codigo || "",
                    columnas.codigo,
                    y,
                    {
                        width: 55
                    }
                );

                doc.text(
                    item.activo || "",
                    columnas.activo,
                    y,
                    {
                        width: 135
                    }
                );

                doc.text(
                    item.categoria || "",
                    columnas.categoria,
                    y,
                    {
                        width: 90
                    }
                );

                doc.text(
                    item.ubicacion ||
                    "Sin ubicación",
                    columnas.ubicacion,
                    y,
                    {
                        width: 130
                    }
                );

                doc.text(
                    String(
                        item.stock_total ||
                        0
                    ),
                    columnas.total,
                    y
                );

                doc.text(
                    String(
                        item.disponible ||
                        0
                    ),
                    columnas.disponible,
                    y
                );

                doc.text(
                    String(
                        item.alquilado ||
                        0
                    ),
                    columnas.alquilado,
                    y
                );

                doc.text(
                    String(
                        item.mantenimiento ||
                        0
                    ),
                    columnas.mantenimiento,
                    y
                );

                doc.text(
                    String(
                        item.danado ||
                        0
                    ),
                    columnas.danado,
                    y
                );

                doc.text(
                    String(
                        item.perdido ||
                        0
                    ),
                    columnas.perdido,
                    y
                );

                y += 22;

                doc
                    .moveTo(
                        35,
                        y - 6
                    )
                    .lineTo(
                        800,
                        y - 6
                    )
                    .strokeColor(
                        "#e5e7eb"
                    )
                    .stroke();

                doc.strokeColor(
                    "#000000"
                );
            }
        );

        /* =================================================
           RESUMEN
        ================================================= */

        const resumen =
            data.reduce(
                (
                    acumulado,
                    item
                ) => {
                    acumulado.total +=
                        Number(
                            item.stock_total ||
                            0
                        );

                    acumulado.disponible +=
                        Number(
                            item.disponible ||
                            0
                        );

                    acumulado.alquilado +=
                        Number(
                            item.alquilado ||
                            0
                        );

                    acumulado.mantenimiento +=
                        Number(
                            item.mantenimiento ||
                            0
                        );

                    acumulado.danado +=
                        Number(
                            item.danado ||
                            0
                        );

                    acumulado.perdido +=
                        Number(
                            item.perdido ||
                            0
                        );

                    return acumulado;
                },
                {
                    total: 0,
                    disponible: 0,
                    alquilado: 0,
                    mantenimiento: 0,
                    danado: 0,
                    perdido: 0
                }
            );

        if (
            y > 500
        ) {
            doc.addPage({
                size: "A4",
                layout: "landscape",
                margin: 35
            });

            y = 50;
        }

        doc
            .font("Helvetica-Bold")
            .fontSize(9)
            .text(
                "RESUMEN",
                35,
                y + 10
            );

        doc
            .font("Helvetica")
            .fontSize(9)
            .text(
                `Total físico: ${resumen.total}`,
                35,
                y + 28
            )
            .text(
                `Disponible: ${resumen.disponible}`,
                150,
                y + 28
            )
            .text(
                `Alquilado: ${resumen.alquilado}`,
                270,
                y + 28
            )
            .text(
                `Mantenimiento: ${resumen.mantenimiento}`,
                390,
                y + 28
            )
            .text(
                `Dañado: ${resumen.danado}`,
                550,
                y + 28
            )
            .text(
                `Perdido: ${resumen.perdido}`,
                660,
                y + 28
            );

        doc.end();
    } catch (error) {
        if (next) {
            return next(error);
        }

        return manejarError(
            error,
            res,
            "Error al exportar el inventario en PDF"
        );
    }
};

/* =====================================================
   EXPORTAR EXCEL
===================================================== */

const exportarInventarioExcel = async (
    req,
    res,
    next
) => {
    try {
        const data =
            await obtenerReporteInventario();

        const workbook =
            new ExcelJS.Workbook();

        const worksheet =
            workbook.addWorksheet(
                "Inventario"
            );

        /* =================================================
           TÍTULO
        ================================================= */

        worksheet.mergeCells(
            "A1:J1"
        );

        worksheet.getCell(
            "A1"
        ).value =
            "REPORTE GENERAL DE INVENTARIO";

        worksheet.getCell(
            "A1"
        ).font = {
            size: 16,
            bold: true
        };

        worksheet.getCell(
            "A1"
        ).alignment = {
            horizontal: "center"
        };

        /* =================================================
           FECHA
        ================================================= */

        worksheet.mergeCells(
            "A2:J2"
        );

        worksheet.getCell(
            "A2"
        ).value =
            `Fecha de generación: ${new Date().toLocaleDateString("es-EC")}`;

        worksheet.getCell(
            "A2"
        ).alignment = {
            horizontal: "center"
        };

        /* =================================================
           COLUMNAS
        ================================================= */

        worksheet.columns = [
            {
                key: "codigo",
                width: 15
            },
            {
                key: "activo",
                width: 30
            },
            {
                key: "categoria",
                width: 22
            },
            {
                key: "ubicacion",
                width: 30
            },
            {
                key: "tipo_control",
                width: 16
            },
            {
                key: "stock_total",
                width: 12
            },
            {
                key: "disponible",
                width: 12
            },
            {
                key: "alquilado",
                width: 12
            },
            {
                key: "mantenimiento",
                width: 15
            },
            {
                key: "danado",
                width: 12
            },
            {
                key: "perdido",
                width: 12
            }
        ];

        /*
         * Creamos encabezados manualmente en fila 4
         * porque las dos primeras filas contienen
         * el título y fecha.
         */
        const headerRow =
            worksheet.getRow(4);

        headerRow.values = [
            "Código",
            "Activo",
            "Categoría",
            "Ubicación",
            "Control",
            "Total",
            "Disponible",
            "Alquilado",
            "Mantenimiento",
            "Dañado",
            "Perdido"
        ];

        headerRow.font = {
            bold: true
        };

        headerRow.alignment = {
            horizontal: "center",
            vertical: "middle"
        };

        /* =================================================
           DATOS
        ================================================= */

        data.forEach(
            (
                item
            ) => {
                worksheet.addRow([
                    item.codigo,
                    item.activo,
                    item.categoria,
                    item.ubicacion ||
                    "Sin ubicación",

                    item.tipo_control,

                    Number(
                        item.stock_total ||
                        0
                    ),

                    Number(
                        item.disponible ||
                        0
                    ),

                    Number(
                        item.alquilado ||
                        0
                    ),

                    Number(
                        item.mantenimiento ||
                        0
                    ),

                    Number(
                        item.danado ||
                        0
                    ),

                    Number(
                        item.perdido ||
                        0
                    )
                ]);
            }
        );

        /* =================================================
           FILA DE TOTALES
        ================================================= */

        const resumen =
            data.reduce(
                (
                    acumulado,
                    item
                ) => {
                    acumulado.total +=
                        Number(
                            item.stock_total ||
                            0
                        );

                    acumulado.disponible +=
                        Number(
                            item.disponible ||
                            0
                        );

                    acumulado.alquilado +=
                        Number(
                            item.alquilado ||
                            0
                        );

                    acumulado.mantenimiento +=
                        Number(
                            item.mantenimiento ||
                            0
                        );

                    acumulado.danado +=
                        Number(
                            item.danado ||
                            0
                        );

                    acumulado.perdido +=
                        Number(
                            item.perdido ||
                            0
                        );

                    return acumulado;
                },
                {
                    total: 0,
                    disponible: 0,
                    alquilado: 0,
                    mantenimiento: 0,
                    danado: 0,
                    perdido: 0
                }
            );

        const totalRow =
            worksheet.addRow([
                "",
                "TOTALES",
                "",
                "",
                "",

                resumen.total,

                resumen.disponible,

                resumen.alquilado,

                resumen.mantenimiento,

                resumen.danado,

                resumen.perdido
            ]);

        totalRow.font = {
            bold: true
        };

        /* =================================================
           BORDES
        ================================================= */

        worksheet.eachRow(
            {
                includeEmpty: false
            },
            (
                row
            ) => {
                row.eachCell(
                    (
                        cell
                    ) => {
                        cell.border = {
                            top: {
                                style:
                                    "thin"
                            },
                            left: {
                                style:
                                    "thin"
                            },
                            bottom: {
                                style:
                                    "thin"
                            },
                            right: {
                                style:
                                    "thin"
                            }
                        };

                        cell.alignment = {
                            vertical:
                                "middle"
                        };
                    }
                );
            }
        );

        /* =================================================
           RESPUESTA
        ================================================= */

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=reporte_inventario.xlsx"
        );

        await workbook.xlsx.write(
            res
        );

        res.end();
    } catch (error) {
        if (next) {
            return next(error);
        }

        return manejarError(
            error,
            res,
            "Error al exportar el inventario en Excel"
        );
    }
};
/* =====================================================
   ELIMINAR ACTIVO
===================================================== */

const eliminar = async (
    req,
    res
) => {
    try {

        const activo =
            await eliminarActivo(
                req.params.id
            );

        return res
            .status(200)
            .json({
                success: true,

                message:
                    "Activo eliminado correctamente",

                data:
                    activo
            });

    } catch (error) {

        return manejarError(
            error,
            res,
            "Error al eliminar el activo"
        );
    }
};

/* =====================================================
   EXPORTACIONES
===================================================== */

module.exports = {
    crear,
    listar,
    obtenerPorId,
    actualizar,
    cambiarEstado,
    eliminar,
    reporteInventario,

    exportarInventarioExcel,
    exportarInventarioPDF
};