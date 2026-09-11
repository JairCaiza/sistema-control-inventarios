const { pool } = require("../../config/db");

/* =====================================================
   CREAR ERROR DE NEGOCIO
===================================================== */

const crearError = (
    message,
    statusCode = 400
) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

/* =====================================================
   NORMALIZAR DATOS
===================================================== */

const normalizarCliente = (data) => ({
    tipo_cliente: data.tipo_cliente,

    tipo_identificacion: data.tipo_identificacion,

    identificacion:
        data.identificacion?.trim(),

    nombre:
        data.nombre?.trim(),

    apellido:
        data.tipo_cliente === "empresa"
            ? null
            : data.apellido?.trim() || null,

    telefono:
        data.telefono?.trim() || null,

    direccion:
        data.direccion?.trim() || null,

    correo:
        data.correo?.trim().toLowerCase() || null
});

/* =====================================================
   VALIDAR IDENTIFICACIÓN DUPLICADA
===================================================== */

const validarIdentificacionDuplicada = async (
    identificacion,
    excluirId = null,
    client = pool
) => {
    const params = [identificacion];

    let query = `
        SELECT id
        FROM clientes
        WHERE identificacion = $1
    `;

    /*
     * Cuando estamos actualizando,
     * ignoramos el mismo cliente.
     */
    if (excluirId) {
        params.push(excluirId);

        query += `
            AND id <> $2
        `;
    }

    const result = await client.query(
        query,
        params
    );

    if (result.rows.length > 0) {
        throw crearError(
            "Ya existe un cliente registrado con esa identificación",
            409
        );
    }
};

/* =====================================================
   VALIDAR CORREO DUPLICADO
===================================================== */

const validarCorreoDuplicado = async (
    correo,
    excluirId = null,
    client = pool
) => {
    /*
     * Correo es opcional.
     */
    if (!correo) {
        return;
    }

    const params = [correo];

    let query = `
        SELECT id
        FROM clientes
        WHERE LOWER(TRIM(correo)) = LOWER(TRIM($1))
    `;

    if (excluirId) {
        params.push(excluirId);

        query += `
            AND id <> $2
        `;
    }

    const result = await client.query(
        query,
        params
    );

    if (result.rows.length > 0) {
        throw crearError(
            "Ya existe un cliente registrado con ese correo electrónico",
            409
        );
    }
};

/* =====================================================
   CREAR CLIENTE
===================================================== */

const crearCliente = async (data) => {
    const cliente = normalizarCliente(
        data
    );

    const client =
        await pool.connect();

    try {
        await client.query("BEGIN");

        /* =============================================
           IDENTIFICACIÓN ÚNICA
        ============================================= */

        await validarIdentificacionDuplicada(
            cliente.identificacion,
            null,
            client
        );

        /* =============================================
           CORREO ÚNICO
        ============================================= */

        await validarCorreoDuplicado(
            cliente.correo,
            null,
            client
        );

        /* =============================================
           INSERTAR
        ============================================= */

        const result =
            await client.query(
                `
                INSERT INTO clientes
                (
                    tipo_cliente,
                    tipo_identificacion,
                    identificacion,
                    nombre,
                    apellido,
                    telefono,
                    direccion,
                    correo
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8
                )
                RETURNING *
                `,
                [
                    cliente.tipo_cliente,
                    cliente.tipo_identificacion,
                    cliente.identificacion,
                    cliente.nombre,
                    cliente.apellido,
                    cliente.telefono,
                    cliente.direccion,
                    cliente.correo
                ]
            );

        await client.query("COMMIT");

        return result.rows[0];

    } catch (error) {

        await client.query("ROLLBACK");

        throw error;

    } finally {

        client.release();
    }
};

/* =====================================================
   LISTAR CLIENTES
===================================================== */

const listarClientes = async () => {
    const result =
        await pool.query(
            `
            SELECT
                id,
                tipo_cliente,
                tipo_identificacion,
                identificacion,
                nombre,
                apellido,
                telefono,
                direccion,
                correo,
                fecha_creacion

            FROM clientes

            ORDER BY fecha_creacion DESC
            `
        );

    return result.rows;
};

/* =====================================================
   OBTENER CLIENTE POR ID
===================================================== */

const obtenerCliente = async (id) => {
    const result =
        await pool.query(
            `
            SELECT *
            FROM clientes
            WHERE id = $1
            `,
            [id]
        );

    if (result.rows.length === 0) {
        throw crearError(
            "Cliente no encontrado",
            404
        );
    }

    return result.rows[0];
};

/* =====================================================
   ACTUALIZAR CLIENTE
===================================================== */

const actualizarCliente = async (
    id,
    data
) => {
    const cliente =
        normalizarCliente(data);

    const client =
        await pool.connect();

    try {
        await client.query("BEGIN");

        /* =============================================
           VERIFICAR EXISTENCIA
        ============================================= */

        const actual =
            await client.query(
                `
                SELECT id
                FROM clientes
                WHERE id = $1
                FOR UPDATE
                `,
                [id]
            );

        if (actual.rows.length === 0) {
            throw crearError(
                "Cliente no encontrado",
                404
            );
        }

        /* =============================================
           IDENTIFICACIÓN DUPLICADA
        ============================================= */

        await validarIdentificacionDuplicada(
            cliente.identificacion,
            id,
            client
        );

        /* =============================================
           CORREO DUPLICADO
        ============================================= */

        await validarCorreoDuplicado(
            cliente.correo,
            id,
            client
        );

        /* =============================================
           ACTUALIZAR
        ============================================= */

        const result =
            await client.query(
                `
                UPDATE clientes
                SET
                    tipo_cliente = $1,
                    tipo_identificacion = $2,
                    identificacion = $3,
                    nombre = $4,
                    apellido = $5,
                    telefono = $6,
                    direccion = $7,
                    correo = $8
                WHERE id = $9
                RETURNING *
                `,
                [
                    cliente.tipo_cliente,
                    cliente.tipo_identificacion,
                    cliente.identificacion,
                    cliente.nombre,
                    cliente.apellido,
                    cliente.telefono,
                    cliente.direccion,
                    cliente.correo,
                    id
                ]
            );

        await client.query("COMMIT");

        return result.rows[0];

    } catch (error) {

        await client.query("ROLLBACK");

        throw error;

    } finally {

        client.release();
    }
};

/* =====================================================
   ELIMINAR CLIENTE
===================================================== */

const eliminarCliente = async (id) => {
    const client =
        await pool.connect();

    try {
        await client.query("BEGIN");

        /* =============================================
           VERIFICAR CLIENTE
        ============================================= */

        const clienteResult =
            await client.query(
                `
                SELECT
                    id,
                    nombre,
                    apellido,
                    identificacion
                FROM clientes
                WHERE id = $1
                FOR UPDATE
                `,
                [id]
            );

        if (
            clienteResult.rows.length ===
            0
        ) {
            throw crearError(
                "Cliente no encontrado",
                404
            );
        }

        /* =============================================
           VERIFICAR CONTRATOS
        ============================================= */

        const contratosResult =
            await client.query(
                `
                SELECT COUNT(*)::INTEGER AS total
                FROM contratos_alquiler
                WHERE cliente_id = $1
                `,
                [id]
            );

        const totalContratos =
            Number(
                contratosResult.rows[0]
                    .total || 0
            );

        if (totalContratos > 0) {
            throw crearError(
                "No se puede eliminar el cliente porque tiene contratos de alquiler relacionados",
                409
            );
        }

        /* =============================================
           VERIFICAR OBRAS
        ============================================= */

        const obrasResult =
            await client.query(
                `
                SELECT COUNT(*)::INTEGER AS total
                FROM obras
                WHERE cliente_id = $1
                `,
                [id]
            );

        const totalObras =
            Number(
                obrasResult.rows[0]
                    .total || 0
            );

        if (totalObras > 0) {
            throw crearError(
                "No se puede eliminar el cliente porque tiene obras relacionadas",
                409
            );
        }

        /* =============================================
           AQUÍ PUEDES AGREGAR MÁS RELACIONES
        ============================================= */

        /*
         * Por ejemplo, si en el futuro notas_venta
         * tiene cliente_id:
         *
         * SELECT COUNT(*)
         * FROM notas_venta
         * WHERE cliente_id = $1
         */

        /* =============================================
           ELIMINAR
        ============================================= */

        const result =
            await client.query(
                `
                DELETE FROM clientes
                WHERE id = $1
                RETURNING
                    id,
                    nombre,
                    apellido,
                    identificacion
                `,
                [id]
            );

        await client.query("COMMIT");

        return result.rows[0];

    } catch (error) {

        await client.query("ROLLBACK");

        /*
         * Protección adicional por FK.
         *
         * Incluso si olvidamos comprobar alguna
         * relación manualmente, PostgreSQL evita
         * borrar registros referenciados.
         */
        if (error.code === "23503") {
            throw crearError(
                "No se puede eliminar el cliente porque tiene registros relacionados en el sistema",
                409
            );
        }

        throw error;

    } finally {

        client.release();
    }
};

/* =====================================================
   EXPORTACIONES
===================================================== */

module.exports = {
    crearCliente,
    listarClientes,
    obtenerCliente,
    actualizarCliente,
    eliminarCliente
};