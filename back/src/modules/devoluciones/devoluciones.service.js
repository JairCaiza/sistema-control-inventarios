const { pool } = require("../../config/db");
const notasService = require("../ventas/notas/notas.service");

const registrar = async (data) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        /* 1️⃣ Obtener contrato */
        const contratoRes = await client.query(
            `SELECT id, fecha_fin
             FROM contratos_alquiler
             WHERE id = $1`,
            [data.contrato_id]
        );

        if (contratoRes.rows.length === 0) {
            throw new Error("Contrato no existe");
        }

        const contrato = contratoRes.rows[0];

        /* 2️⃣ Calcular días de retraso */
        const fechaFin = new Date(contrato.fecha_fin);
        const fechaDev = new Date(data.fecha_devolucion);

        let dias_retraso = 0;

        if (fechaDev > fechaFin) {
            const diff = fechaDev.getTime() - fechaFin.getTime();
            dias_retraso = Math.ceil(diff / (1000 * 60 * 60 * 24));
        }

        /* 3️⃣ Obtener activos del contrato */
        const activosRes = await client.query(
            `SELECT activo_id, cantidad, precio_diario
             FROM detalles_contrato
             WHERE contrato_id = $1`,
            [data.contrato_id]
        );

        /* 4️⃣ Calcular penalidad */
        let penalidad_total = 0;

        if (dias_retraso > 0) {
            activosRes.rows.forEach((a) => {
                penalidad_total +=
                    dias_retraso * a.precio_diario * a.cantidad;
            });
        }

        /* 5️⃣ Insertar devolución */
        const insertRes = await client.query(
            `INSERT INTO devoluciones
             (contrato_id, fecha_devolucion, dias_retraso, penalidad_total)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                data.contrato_id,
                data.fecha_devolucion,
                dias_retraso,
                penalidad_total
            ]
        );

        const devolucion = insertRes.rows[0];

        /* 6️⃣ Actualizar estado contrato */
        await client.query(
            `UPDATE contratos_alquiler
             SET estado = 'finalizado'
             WHERE id = $1`,
            [data.contrato_id]
        );

        /* 🔥 7️⃣ DEVOLVER STOCK */
        for (const a of activosRes.rows) {
            await client.query(
                `UPDATE activos
                 SET cantidad_total = cantidad_total + $1,
                     estado = 'disponible'
                 WHERE id = $2`,
                [a.cantidad, a.activo_id]
            );

            await client.query(
                `INSERT INTO movimientos_inventario
                 (activo_id, tipo_movimiento, cantidad, motivo)
                 VALUES ($1, 'entrada', $2, 'Devolución contrato')`,
                [a.activo_id, a.cantidad]
            );
        }

        /* 🔥 8️⃣ CREAR NOTA DE VENTA */
        const totalContratoRes = await client.query(
            `SELECT total, cliente_id
             FROM contratos_alquiler
             WHERE id = $1`,
            [data.contrato_id]
        );

        const contratoData = totalContratoRes.rows[0];

        const totalContrato = Number(contratoData.total);

        const detalles = [
            {
                descripcion: "Alquiler de equipos",
                cantidad: 1,
                precio_unitario: totalContrato
            }
        ];

        if (penalidad_total > 0) {
            detalles.push({
                descripcion: "Penalidad por retraso",
                cantidad: 1,
                precio_unitario: penalidad_total
            });
        }

        const nota = await notasService.crear(
            {
                cliente_id: contratoData.cliente_id,
                metodo_pago: data.metodo_pago,
                detalles
            },
            client
        );

        /* 🔥 9️⃣ GUARDAR RELACIÓN DEVOLUCIÓN - NOTA */
        await client.query(
            `UPDATE devoluciones
             SET nota_id = $1
             WHERE id = $2`,
            [nota.id, devolucion.id]
        );

        await client.query("COMMIT");

        /* 🔥 10️⃣ RETORNAR TODO */
        return {
            ...devolucion,
            nota_id: nota.id
        };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const listar = async () => {
    const res = await pool.query(`
        SELECT d.*, c.numero_contrato, cl.nombre AS cliente
        FROM devoluciones d
        JOIN contratos_alquiler c ON c.id = d.contrato_id
        JOIN clientes cl ON cl.id = c.cliente_id
        ORDER BY d.fecha_devolucion DESC
    `);

    return res.rows;
};

const obtenerPorId = async (id) => {
    const res = await pool.query(`
        SELECT d.*, c.numero_contrato, cl.nombre AS cliente
        FROM devoluciones d
        JOIN contratos_alquiler c ON c.id = d.contrato_id
        JOIN clientes cl ON cl.id = c.cliente_id
        WHERE d.id = $1
    `, [id]);

    return res.rows[0];
};

module.exports = {
    registrar,
    listar,
    obtenerPorId
};