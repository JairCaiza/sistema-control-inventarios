const { pool } = require("../../../config/db");

/* =========================
   🔢 Generar número
========================= */
const generarNumero = async (client) => {
    const res = await client.query(`SELECT COUNT(*) FROM notas_venta`);
    const numero = String(Number(res.rows[0].count) + 1).padStart(4, "0");
    return `NV-${numero}`;
};

/* =========================
   🧾 Crear nota
========================= */
const crear = async (data, clientParam = null) => {
    const client = clientParam || await pool.connect();
    const external = !!clientParam;

    try {
        if (!external) await client.query("BEGIN");

        const numero = await generarNumero(client);

        let total = 0;
        data.detalles.forEach(d => {
            total += d.cantidad * d.precio_unitario;
        });

        const notaRes = await client.query(
            `INSERT INTO notas_venta
            (numero, cliente_id, fecha, metodo_pago, total)
            VALUES ($1, $2, NOW(), $3, $4)
            RETURNING *`,
            [numero, data.cliente_id, data.metodo_pago, total]
        );

        const nota = notaRes.rows[0];

        for (const d of data.detalles) {
            await client.query(
                `INSERT INTO detalles_nota_venta
                (nota_venta_id, descripcion, cantidad, precio_unitario, subtotal)
                VALUES ($1, $2, $3, $4, $5)`,
                [
                    nota.id,
                    d.descripcion,
                    d.cantidad,
                    d.precio_unitario,
                    d.cantidad * d.precio_unitario
                ]
            );
        }

        if (!external) await client.query("COMMIT");

        return nota;

    } catch (error) {
        if (!external) await client.query("ROLLBACK");
        throw error;
    } finally {
        if (!external) client.release();
    }
};

/* =========================
   📄 Listar notas
========================= */
const listar = async () => {
    const res = await pool.query(`
        SELECT n.*, c.nombre AS cliente
        FROM notas_venta n
        LEFT JOIN clientes c ON c.id = n.cliente_id
        ORDER BY n.fecha DESC
    `);

    return res.rows;
};

/* =========================
   🔍 Obtener nota por ID
========================= */
const obtenerPorId = async (id) => {
    const res = await pool.query(`
        SELECT n.*, c.nombre AS cliente
        FROM notas_venta n
        LEFT JOIN clientes c ON c.id = n.cliente_id
        WHERE n.id = $1
    `, [id]);

    return res.rows[0];
};

/* =========================
   📑 Obtener con detalles (PDF)
========================= */
const obtenerConDetalles = async (id) => {
    const nota = await obtenerPorId(id);

    const detallesRes = await pool.query(`
        SELECT *
        FROM detalles_nota_venta
        WHERE nota_venta_id = $1
    `, [id]);

    return {
        ...nota,
        detalles: detallesRes.rows
    };
};

module.exports = {
    crear,
    listar,
    obtenerPorId,
    obtenerConDetalles
};