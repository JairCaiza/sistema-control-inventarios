const { pool } = require("../../../config/db");

/* =========================
   CREATE OBRA
========================= */
const createObra = async ({
    codigo,
    nombre,
    cliente_id,
    ubicacion,
    fecha_inicio,
    fecha_fin,
    presupuesto,
    estado,
    descripcion
}) => {

    // validar código duplicado
    const exists = await pool.query(
        `SELECT id FROM obras
         WHERE codigo = $1`,
        [codigo]
    );

    if (exists.rows.length > 0) {
        throw new Error("El código de obra ya existe");
    }

    const result = await pool.query(
        `INSERT INTO obras (
            codigo,
            nombre,
            cliente_id,
            ubicacion,
            fecha_inicio,
            fecha_fin,
            presupuesto,
            estado,
            descripcion
         )
         VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9
         )
         RETURNING *`,
        [
            codigo,
            nombre,
            cliente_id || null,
            ubicacion,
            fecha_inicio,
            fecha_fin,
            presupuesto || 0,
            estado || "planificada",
            descripcion
        ]
    );

    return result.rows[0];
};

/* =========================
   GET OBRAS
========================= */
const getObras = async () => {

    const result = await pool.query(
        `SELECT *
         FROM obras
         ORDER BY fecha_creacion DESC`
    );

    return result.rows;
};

/* =========================
   GET OBRA BY ID
========================= */
const getObraById = async (id) => {

    const result = await pool.query(
        `SELECT 
            o.*,
            c.nombre AS cliente_nombre
         FROM obras o
         LEFT JOIN clientes c
            ON c.id = o.cliente_id
         WHERE o.id = $1`,
        [id]
    );

    return result.rows[0];
};

/* =========================
   UPDATE OBRA
========================= */
const updateObra = async (id, data) => {

    const fields = [];
    const values = [];
    let index = 1;

    for (let key in data) {
        fields.push(`${key} = $${index}`);
        values.push(data[key]);
        index++;
    }

    values.push(id);

    const result = await pool.query(
        `UPDATE obras
         SET ${fields.join(", ")}
         WHERE id = $${index}
         RETURNING *`,
        values
    );

    return result.rows[0];
};

/* =========================
   DELETE OBRA
========================= */
const deleteObra = async (id) => {

    const result = await pool.query(
        `DELETE FROM obras
         WHERE id = $1
         RETURNING id`,
        [id]
    );

    return result.rows[0];
};



/* =========================
   ASIGNAR EMPLEADO A OBRA
========================= */
const asignarEmpleadoObra = async ({
    obra_id,
    empleado_id,
    cargo_obra,
    fecha_inicio,
    fecha_fin,
    salario_acordado,
    observaciones
}) => {

    // Validar que no esté asignado actualmente
    const existe = await pool.query(
        `SELECT id
         FROM empleados_obras
         WHERE obra_id = $1
         AND empleado_id = $2
         AND activo = true`,
        [obra_id, empleado_id]
    );

    if (existe.rows.length > 0) {
        throw new Error("El empleado ya está asignado a esta obra");
    }

    const result = await pool.query(
        `INSERT INTO empleados_obras (
            obra_id,
            empleado_id,
            cargo_obra,
            fecha_inicio,
            fecha_fin,
            salario_acordado,
            observaciones
         )
         VALUES (
            $1,$2,$3,$4,$5,$6,$7
         )
         RETURNING *`,
        [
            obra_id,
            empleado_id,
            cargo_obra,
            fecha_inicio || null,
            fecha_fin || null,
            salario_acordado || null,
            observaciones || null
        ]
    );

    return result.rows[0];
};

/* =========================
   EMPLEADOS DE UNA OBRA
========================= */
const getEmpleadosObra = async (obraId) => {

    const result = await pool.query(
        `SELECT
            eo.*,
            e.nombres,
            e.apellidos,
            e.cedula,
            e.telefono,
            e.cargo
         FROM empleados_obras eo
         INNER JOIN empleados e
            ON e.id = eo.empleado_id
         WHERE eo.obra_id = $1
         AND eo.activo = true
         ORDER BY e.nombres`,
        [obraId]
    );

    return result.rows;
};

/* =========================
   DESASIGNAR EMPLEADO
========================= */
const desasignarEmpleadoObra = async (
    id,
    motivo_salida,
    observaciones
) => {

    const result = await pool.query(
        `UPDATE empleados_obras
         SET
            activo = false,
            fecha_fin = CURRENT_DATE,
            motivo_salida = $2,
            observaciones = $3
         WHERE id = $1
         RETURNING *`,
        [id, motivo_salida, observaciones]
    );

    return result.rows[0];
};



/* =========================
   funciones para registrar actividades diarias de la obra
========================= */

const registrarActividadObra = async ({
    obra_id,
    fecha,
    actividad,
    descripcion,
    hora_inicio,
    hora_fin,
    avance,
    observaciones,
    clima
}) => {
    const result = await pool.query(
        `INSERT INTO controles_diarios (
            obra_id,
            fecha,
            actividad,
            descripcion,
            hora_inicio,
            hora_fin,
            avance,
            observaciones,
            clima
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING *`,
        [
            obra_id,
            fecha,
            actividad,
            descripcion,
            hora_inicio,
            hora_fin,
            avance,
            observaciones,
            clima
        ]
    );

    return result.rows[0];
};
const listarControlesPorObra = async (obra_id) => {
    const result = await pool.query(
        `SELECT *
         FROM controles_diarios
         WHERE obra_id = $1
         ORDER BY fecha DESC, hora_inicio DESC`,
        [obra_id]
    );

    return result.rows;
};


module.exports = {
    createObra,
    getObras,
    getObraById,
    updateObra,
    deleteObra,



    asignarEmpleadoObra,
    getEmpleadosObra,
    desasignarEmpleadoObra,


    registrarActividadObra,
    listarControlesPorObra
};