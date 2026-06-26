const { pool } = require("../../../config/db");

/* =========================
   CREATE EMPLEADO
========================= */
const createEmpleado = async ({
    nombres,
    apellidos,
    cedula,
    telefono,
    correo,
    direccion,
    fecha_nacimiento,
    cargo,
    tipo_pago,
    salario_base,
    fecha_ingreso,
    observaciones
}) => {

    // validar cédula duplicada
    const exists = await pool.query(
        `SELECT id FROM empleados
         WHERE cedula = $1`,
        [cedula]
    );

    if (exists.rows.length > 0) {
        throw new Error("La cédula ya está registrada");
    }

    const result = await pool.query(
        `INSERT INTO empleados (
            nombres,
            apellidos,
            cedula,
            telefono,
            correo,
            direccion,
            fecha_nacimiento,
            cargo,
            tipo_pago,
            salario_base,
            fecha_ingreso,
            observaciones
         )
         VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
         )
         RETURNING 
            id,
            nombres,
            apellidos,
            cedula,
            telefono,
            correo,
            cargo,
            tipo_pago,
            salario_base,
            activo`,
        [
            nombres,
            apellidos,
            cedula,
            telefono,
            correo,
            direccion,
            fecha_nacimiento,
            cargo,
            tipo_pago,
            salario_base,
            fecha_ingreso,
            observaciones
        ]
    );

    return result.rows[0];
};

/* =========================
   GET EMPLEADOS
========================= */
const getEmpleados = async () => {
    const result = await pool.query(
        `SELECT
            id,
            nombres,
            apellidos,
            cedula,
            telefono,
            correo,
            cargo,
            tipo_pago,
            salario_base,
            activo,
            fecha_ingreso
         FROM empleados
         ORDER BY fecha_creacion DESC`
    );

    return result.rows;
};

/* =========================
   GET EMPLEADO BY ID
========================= */
const getEmpleadoById = async (id) => {
    const result = await pool.query(
        `SELECT *
         FROM empleados
         WHERE id = $1`,
        [id]
    );

    return result.rows[0];
};

/* =========================
   UPDATE EMPLEADO
========================= */
const updateEmpleado = async (id, data) => {

    // validar cédula duplicada si viene en update
    if (data.cedula) {
        const exists = await pool.query(
            `SELECT id
             FROM empleados
             WHERE cedula = $1
             AND id != $2`,
            [data.cedula, id]
        );

        if (exists.rows.length > 0) {
            throw new Error("La cédula ya pertenece a otro empleado");
        }
    }

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
        `UPDATE empleados
         SET ${fields.join(", ")}
         WHERE id = $${index}
         RETURNING
            id,
            nombres,
            apellidos,
            cedula,
            telefono,
            correo,
            cargo,
            tipo_pago,
            salario_base,
            activo`,
        values
    );

    return result.rows[0];
};

/* =========================
   TOGGLE STATUS
========================= */
const toggleEmpleadoStatus = async (id, activo) => {

    const result = await pool.query(
        `UPDATE empleados
         SET activo = $1
         WHERE id = $2
         RETURNING id, activo`,
        [activo, id]
    );

    return result.rows[0];
};

/* =========================
   DELETE EMPLEADO
========================= */
const deleteEmpleado = async (id) => {

    // validar pagos asociados
    const pagos = await pool.query(
        `SELECT COUNT(*)
         FROM pagos_empleados
         WHERE empleado_id = $1`,
        [id]
    );

    const count = parseInt(pagos.rows[0].count);

    if (count > 0) {
        throw new Error(
            "No se puede eliminar el empleado porque tiene pagos registrados"
        );
    }

    const result = await pool.query(
        `DELETE FROM empleados
         WHERE id = $1
         RETURNING id`,
        [id]
    );

    return result.rows[0];
};

module.exports = {
    createEmpleado,
    getEmpleados,
    getEmpleadoById,
    updateEmpleado,
    toggleEmpleadoStatus,
    deleteEmpleado
};