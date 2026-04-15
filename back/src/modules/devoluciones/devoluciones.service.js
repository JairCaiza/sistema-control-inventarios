const { pool } = require("../../config/db");

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

        /* 3️⃣ Calcular penalidad */
        // 🔥 Aquí debes ajustar según tu lógica real
        // Ejemplo: sumar todos los activos del contrato

        const activosRes = await client.query(
            `SELECT cantidad, precio_diario
       FROM detalles_contrato
       WHERE contrato_id = $1`,
            [data.contrato_id]
        );

        let penalidad_total = 0;

        if (dias_retraso > 0) {
            activosRes.rows.forEach((a) => {
                penalidad_total +=
                    dias_retraso * a.precio_diario * a.cantidad;
            });
        }

        /* 4️⃣ Insertar devolución */
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

        /* 5️⃣ Actualizar estado contrato */
        await client.query(
            `UPDATE contratos_alquiler
       SET estado = 'finalizado'
       WHERE id = $1`,
            [data.contrato_id]
        );

        await client.query("COMMIT");

        return insertRes.rows[0];

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    registrar
};