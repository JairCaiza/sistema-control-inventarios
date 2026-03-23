const { pool } = require("../../config/db");

const crearCliente = async (data) => {

    const result = await pool.query(
        `INSERT INTO clientes
        (tipo_cliente, tipo_identificacion, identificacion, nombre, apellido, telefono, direccion, correo)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING *`,
        [
            data.tipo_cliente,
            data.tipo_identificacion,
            data.identificacion,
            data.nombre,
            data.apellido,
            data.telefono,
            data.direccion,
            data.correo
        ]
    );

    return result.rows[0];
};


const listarClientes = async () => {

    const result = await pool.query(`
        SELECT
            id,
            tipo_cliente,
            tipo_identificacion,
            identificacion,
            nombre,
            apellido,
            telefono,
            correo,
            fecha_creacion
        FROM clientes
        ORDER BY fecha_creacion DESC
    `);

    return result.rows;
};


const obtenerCliente = async (id) => {

    const result = await pool.query(
        `SELECT * FROM clientes WHERE id = $1`,
        [id]
    );

    return result.rows[0];
};


const actualizarCliente = async (id, data) => {

    const result = await pool.query(
        `UPDATE clientes
        SET
        tipo_cliente=$1,
        tipo_identificacion=$2,
        identificacion=$3,
        nombre=$4,
        apellido=$5,
        telefono=$6,
        direccion=$7,
        correo=$8
        WHERE id=$9
        RETURNING *`,
        [
            data.tipo_cliente,
            data.tipo_identificacion,
            data.identificacion,
            data.nombre,
            data.apellido,
            data.telefono,
            data.direccion,
            data.correo,
            id
        ]
    );

    return result.rows[0];
};


const eliminarCliente = async (id) => {

    await pool.query(
        `DELETE FROM clientes WHERE id=$1`,
        [id]
    );

    return true;
};


module.exports = {
    crearCliente,
    listarClientes,
    obtenerCliente,
    actualizarCliente,
    eliminarCliente
};