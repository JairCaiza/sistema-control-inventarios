const { pool } = require("../../../config/db");

/* =====================================================
   ERRORES DE NEGOCIO
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
   NORMALIZADORES
===================================================== */

const normalizarTexto = (value) => {
    if (
        value === undefined ||
        value === null
    ) {
        return null;
    }

    const texto =
        String(value).trim();

    return texto === ""
        ? null
        : texto;
};

const normalizarFecha = (value) => {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    return value;
};

const normalizarNumero = (value) => {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    return Number(value);
};

/* =====================================================
   VERIFICAR EMPLEADO
===================================================== */

const verificarEmpleado = async (
    id,
    client = pool
) => {
    const result =
        await client.query(
            `
            SELECT id
            FROM empleados
            WHERE id = $1
            `,
            [id]
        );

    if (
        result.rows.length === 0
    ) {
        throw crearError(
            "Empleado no encontrado",
            404
        );
    }

    return result.rows[0];
};

/* =====================================================
   VALIDAR CÉDULA ÚNICA
===================================================== */

const validarCedulaUnica = async (
    cedula,
    empleadoId = null,
    client = pool
) => {
    const params =
        empleadoId
            ? [cedula, empleadoId]
            : [cedula];

    const query =
        empleadoId
            ? `
                SELECT id
                FROM empleados
                WHERE cedula = $1
                  AND id <> $2
                LIMIT 1
              `
            : `
                SELECT id
                FROM empleados
                WHERE cedula = $1
                LIMIT 1
              `;

    const result =
        await client.query(
            query,
            params
        );

    if (
        result.rows.length > 0
    ) {
        throw crearError(
            empleadoId
                ? "La cédula ya pertenece a otro empleado"
                : "La cédula ya está registrada",
            409
        );
    }
};

/* =====================================================
   CREAR EMPLEADO
===================================================== */

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
    activo,
    observaciones
}) => {
    await validarCedulaUnica(
        cedula
    );

    const result =
        await pool.query(
            `
            INSERT INTO empleados (
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
                activo,
                observaciones
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10,
                COALESCE($11, CURRENT_DATE),
                COALESCE($12, TRUE),
                $13
            )
            RETURNING
                id,
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
                activo,
                observaciones,
                fecha_creacion,
                fecha_actualizacion
            `,
            [
                nombres.trim(),
                apellidos.trim(),
                cedula.trim(),

                normalizarTexto(
                    telefono
                ),

                normalizarTexto(
                    correo
                ),

                normalizarTexto(
                    direccion
                ),

                normalizarFecha(
                    fecha_nacimiento
                ),

                normalizarTexto(
                    cargo
                ),

                tipo_pago,

                normalizarNumero(
                    salario_base
                ),

                normalizarFecha(
                    fecha_ingreso
                ),

                typeof activo === "boolean"
                    ? activo
                    : true,

                normalizarTexto(
                    observaciones
                )
            ]
        );

    return result.rows[0];
};

/* =====================================================
   LISTAR EMPLEADOS
===================================================== */

const getEmpleados = async () => {
    const result =
        await pool.query(
            `
            SELECT
                e.id,
                e.nombres,
                e.apellidos,
                CONCAT(
                    e.nombres,
                    ' ',
                    e.apellidos
                ) AS nombre_completo,

                e.cedula,
                e.telefono,
                e.correo,
                e.direccion,
                e.fecha_nacimiento,
                e.cargo,
                e.tipo_pago,
                e.salario_base,
                e.fecha_ingreso,
                e.activo,
                e.observaciones,
                e.fecha_creacion,
                e.fecha_actualizacion,

                COALESCE(
                    (
                        SELECT COUNT(*)
                        FROM empleados_obras eo
                        WHERE eo.empleado_id = e.id
                          AND eo.activo = TRUE
                    ),
                    0
                )::INTEGER AS obras_activas

            FROM empleados e

            ORDER BY
                e.activo DESC,
                e.fecha_creacion DESC
            `
        );

    return result.rows;
};

/* =====================================================
   OBTENER EMPLEADO POR ID
===================================================== */

const getEmpleadoById = async (
    id
) => {
    const result =
        await pool.query(
            `
            SELECT
                e.id,
                e.nombres,
                e.apellidos,

                CONCAT(
                    e.nombres,
                    ' ',
                    e.apellidos
                ) AS nombre_completo,

                e.cedula,
                e.telefono,
                e.correo,
                e.direccion,
                e.fecha_nacimiento,
                e.cargo,
                e.tipo_pago,
                e.salario_base,
                e.fecha_ingreso,
                e.activo,
                e.observaciones,
                e.fecha_creacion,
                e.fecha_actualizacion

            FROM empleados e

            WHERE e.id = $1
            `,
            [id]
        );

    return (
        result.rows[0] ||
        null
    );
};

/* =====================================================
   ACTUALIZAR EMPLEADO
===================================================== */

const updateEmpleado = async (
    id,
    data
) => {
    await verificarEmpleado(
        id
    );

    if (
        data.cedula !== undefined
    ) {
        await validarCedulaUnica(
            data.cedula,
            id
        );
    }

    /* =================================================
       CAMPOS PERMITIDOS
    ================================================= */

    const camposPermitidos = {
        nombres: (value) =>
            value.trim(),

        apellidos: (value) =>
            value.trim(),

        cedula: (value) =>
            value.trim(),

        telefono:
            normalizarTexto,

        correo:
            normalizarTexto,

        direccion:
            normalizarTexto,

        fecha_nacimiento:
            normalizarFecha,

        cargo:
            normalizarTexto,

        tipo_pago: (value) =>
            value,

        salario_base:
            normalizarNumero,

        fecha_ingreso:
            normalizarFecha,

        activo: (value) =>
            value,

        observaciones:
            normalizarTexto
    };

    const fields = [];

    const values = [];

    let index = 1;

    for (
        const [
            key,
            value
        ] of Object.entries(data)
    ) {
        if (
            !Object.prototype.hasOwnProperty.call(
                camposPermitidos,
                key
            )
        ) {
            continue;
        }

        const transformar =
            camposPermitidos[key];

        fields.push(
            `${key} = $${index}`
        );

        values.push(
            transformar(value)
        );

        index++;
    }

    if (
        fields.length === 0
    ) {
        throw crearError(
            "No se enviaron campos válidos para actualizar",
            400
        );
    }

    fields.push(
        "fecha_actualizacion = NOW()"
    );

    values.push(id);

    const result =
        await pool.query(
            `
            UPDATE empleados

            SET
                ${fields.join(", ")}

            WHERE id = $${index}

            RETURNING
                id,
                nombres,
                apellidos,

                CONCAT(
                    nombres,
                    ' ',
                    apellidos
                ) AS nombre_completo,

                cedula,
                telefono,
                correo,
                direccion,
                fecha_nacimiento,
                cargo,
                tipo_pago,
                salario_base,
                fecha_ingreso,
                activo,
                observaciones,
                fecha_creacion,
                fecha_actualizacion
            `,
            values
        );

    if (
        result.rows.length === 0
    ) {
        throw crearError(
            "Empleado no encontrado",
            404
        );
    }

    return result.rows[0];
};

/* =====================================================
   ACTIVAR / DESACTIVAR
===================================================== */

const toggleEmpleadoStatus = async (
    id,
    activo
) => {
    await verificarEmpleado(
        id
    );

    const result =
        await pool.query(
            `
            UPDATE empleados

            SET
                activo = $1,
                fecha_actualizacion = NOW()

            WHERE id = $2

            RETURNING
                id,
                nombres,
                apellidos,
                activo,
                fecha_actualizacion
            `,
            [
                activo,
                id
            ]
        );

    return result.rows[0];
};

/* =====================================================
   HISTORIAL DE OBRAS DEL EMPLEADO
===================================================== */

const getEmpleadoObras = async (
    empleadoId
) => {
    await verificarEmpleado(
        empleadoId
    );

    const result =
        await pool.query(
            `
            SELECT
                eo.id AS asignacion_id,

                eo.empleado_id,

                eo.obra_id,

                o.codigo AS obra_codigo,

                o.nombre AS obra_nombre,

                o.estado AS obra_estado,

                o.ubicacion AS obra_ubicacion,

                eo.fecha_asignacion,

                eo.fecha_inicio,

                eo.fecha_fin,

                eo.cargo_obra,

                eo.salario_acordado,

                eo.activo,

                eo.observaciones

            FROM empleados_obras eo

            INNER JOIN obras o
                ON o.id = eo.obra_id

            WHERE eo.empleado_id = $1

            ORDER BY
                eo.activo DESC,

                COALESCE(
                    eo.fecha_inicio,
                    eo.fecha_asignacion
                ) DESC
            `,
            [empleadoId]
        );

    return result.rows;
};

/* =====================================================
   PAGOS DEL EMPLEADO
===================================================== */

const getEmpleadoPagos = async (
    empleadoId
) => {
    await verificarEmpleado(
        empleadoId
    );

    const result =
        await pool.query(
            `
            SELECT
                pe.id,

                pe.empleado_id,

                pe.obra_id,

                pe.asignacion_id,

                pe.cuenta_id,

                pe.transaccion_id,

                pe.tipo_pago,

                pe.periodo_descripcion,

                pe.fecha_inicio_periodo,

                pe.fecha_fin_periodo,

                pe.monto,

                pe.fecha_pago,

                pe.metodo_pago,

                pe.estado,

                pe.referencia,

                pe.observaciones,

                pe.fecha_creacion,

                pe.fecha_actualizacion,

                o.codigo AS obra_codigo,

                o.nombre AS obra_nombre,

                cf.nombre AS cuenta_nombre

            FROM pagos_empleados pe

            LEFT JOIN obras o
                ON o.id = pe.obra_id

            LEFT JOIN cuentas_financieras cf
                ON cf.id = pe.cuenta_id

            WHERE pe.empleado_id = $1

            ORDER BY
                COALESCE(
                    pe.fecha_pago,
                    pe.fecha_creacion::DATE
                ) DESC,

                pe.fecha_creacion DESC
            `,
            [empleadoId]
        );

    return result.rows;
};

/* =====================================================
   RESUMEN DEL EMPLEADO
===================================================== */

const getEmpleadoResumen = async (
    empleadoId
) => {
    await verificarEmpleado(
        empleadoId
    );

    const result =
        await pool.query(
            `
            SELECT
                (
                    SELECT COUNT(*)
                    FROM empleados_obras eo

                    WHERE eo.empleado_id = $1
                      AND eo.activo = TRUE
                )::INTEGER
                    AS obras_activas,

                (
                    SELECT COUNT(*)
                    FROM empleados_obras eo

                    WHERE eo.empleado_id = $1
                )::INTEGER
                    AS total_asignaciones,

                (
                    SELECT COUNT(*)
                    FROM pagos_empleados pe

                    WHERE pe.empleado_id = $1
                      AND pe.estado = 'pagado'
                )::INTEGER
                    AS pagos_realizados,

                COALESCE(
                    (
                        SELECT SUM(pe.monto)
                        FROM pagos_empleados pe

                        WHERE pe.empleado_id = $1
                          AND pe.estado = 'pagado'
                    ),
                    0
                )::NUMERIC
                    AS total_pagado,

                COALESCE(
                    (
                        SELECT SUM(pe.monto)
                        FROM pagos_empleados pe

                        WHERE pe.empleado_id = $1
                          AND pe.estado = 'pendiente'
                    ),
                    0
                )::NUMERIC
                    AS total_pendiente
            `,
            [empleadoId]
        );

    return result.rows[0];
};

/* =====================================================
   ACTIVIDAD DEL EMPLEADO
===================================================== */

const getEmpleadoActividad = async (
    empleadoId
) => {
    await verificarEmpleado(
        empleadoId
    );

    /* =================================================
       ASIGNACIONES
    ================================================= */

    const asignacionesResult =
        await pool.query(
            `
            SELECT
                eo.id AS asignacion_id,

                eo.obra_id,

                o.codigo AS obra_codigo,

                o.nombre AS obra_nombre,

                eo.fecha_asignacion,

                eo.fecha_inicio,

                eo.fecha_fin,

                eo.cargo_obra,

                eo.activo,

                eo.observaciones

            FROM empleados_obras eo

            INNER JOIN obras o
                ON o.id = eo.obra_id

            WHERE eo.empleado_id = $1
            `,
            [empleadoId]
        );

    /* =================================================
       PAGOS
    ================================================= */

    const pagosResult =
        await pool.query(
            `
            SELECT
                pe.id AS pago_id,

                pe.obra_id,

                o.codigo AS obra_codigo,

                o.nombre AS obra_nombre,

                pe.periodo_descripcion,

                pe.monto,

                pe.estado,

                pe.fecha_pago,

                pe.fecha_creacion

            FROM pagos_empleados pe

            LEFT JOIN obras o
                ON o.id = pe.obra_id

            WHERE pe.empleado_id = $1
            `,
            [empleadoId]
        );

    const actividad = [];

    /* =================================================
       EVENTOS DE ASIGNACIÓN
    ================================================= */

    for (
        const asignacion
        of asignacionesResult.rows
    ) {
        const fechaInicio =
            asignacion.fecha_inicio ||
            asignacion.fecha_asignacion;

        if (
            fechaInicio
        ) {
            actividad.push({
                id:
                    `asignacion-${asignacion.asignacion_id}`,

                tipo:
                    "asignacion",

                titulo:
                    "Asignación a obra",

                descripcion:
                    asignacion.cargo_obra
                        ? `Asignado como ${asignacion.cargo_obra}`
                        : "Empleado asignado a la obra",

                fecha:
                    fechaInicio,

                obra_id:
                    asignacion.obra_id,

                obra_codigo:
                    asignacion.obra_codigo,

                obra_nombre:
                    asignacion.obra_nombre,

                monto:
                    null,

                estado:
                    asignacion.activo
                        ? "activo"
                        : "finalizado"
            });
        }

        if (
            asignacion.fecha_fin
        ) {
            actividad.push({
                id:
                    `fin-asignacion-${asignacion.asignacion_id}`,

                tipo:
                    "fin_asignacion",

                titulo:
                    "Finalización en obra",

                descripcion:
                    asignacion.cargo_obra
                        ? `Finalizó su participación como ${asignacion.cargo_obra}`
                        : "Finalizó su participación en la obra",

                fecha:
                    asignacion.fecha_fin,

                obra_id:
                    asignacion.obra_id,

                obra_codigo:
                    asignacion.obra_codigo,

                obra_nombre:
                    asignacion.obra_nombre,

                monto:
                    null,

                estado:
                    "finalizado"
            });
        }
    }

    /* =================================================
       EVENTOS DE PAGOS
    ================================================= */

    for (
        const pago
        of pagosResult.rows
    ) {
        actividad.push({
            id:
                `pago-${pago.pago_id}`,

            tipo:
                "pago",

            titulo:
                pago.estado === "pagado"
                    ? "Pago realizado"
                    : pago.estado === "anulado"
                        ? "Pago anulado"
                        : "Pago registrado",

            descripcion:
                pago.periodo_descripcion,

            fecha:
                pago.fecha_pago ||
                pago.fecha_creacion,

            obra_id:
                pago.obra_id,

            obra_codigo:
                pago.obra_codigo,

            obra_nombre:
                pago.obra_nombre,

            monto:
                Number(
                    pago.monto || 0
                ),

            estado:
                pago.estado
        });
    }

    /* =================================================
       ORDENAR MÁS RECIENTE PRIMERO
    ================================================= */

    actividad.sort(
        (a, b) => {
            const fechaA =
                new Date(a.fecha).getTime();

            const fechaB =
                new Date(b.fecha).getTime();

            return fechaB - fechaA;
        }
    );

    return actividad;
};

/* =====================================================
   ELIMINAR EMPLEADO
===================================================== */

const deleteEmpleado = async (
    id
) => {
    await verificarEmpleado(
        id
    );

    /* =================================================
       VALIDAR PAGOS
    ================================================= */

    const pagos =
        await pool.query(
            `
            SELECT COUNT(*)::INTEGER AS total

            FROM pagos_empleados

            WHERE empleado_id = $1
            `,
            [id]
        );

    if (
        pagos.rows[0].total > 0
    ) {
        throw crearError(
            "No se puede eliminar el empleado porque tiene pagos registrados. Desactívelo para conservar el historial.",
            409
        );
    }

    /* =================================================
       VALIDAR ASIGNACIONES
    ================================================= */

    const asignaciones =
        await pool.query(
            `
            SELECT COUNT(*)::INTEGER AS total

            FROM empleados_obras

            WHERE empleado_id = $1
            `,
            [id]
        );

    if (
        asignaciones.rows[0].total > 0
    ) {
        throw crearError(
            "No se puede eliminar el empleado porque tiene historial de obras. Desactívelo para conservar la trazabilidad.",
            409
        );
    }

    const result =
        await pool.query(
            `
            DELETE FROM empleados

            WHERE id = $1

            RETURNING id
            `,
            [id]
        );

    return result.rows[0];
};

/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
    createEmpleado,
    getEmpleados,
    getEmpleadoById,
    updateEmpleado,
    toggleEmpleadoStatus,
    getEmpleadoObras,
    getEmpleadoPagos,
    getEmpleadoResumen,
    getEmpleadoActividad,
    deleteEmpleado
};