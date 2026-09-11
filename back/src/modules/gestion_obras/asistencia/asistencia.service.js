const { pool } = require("../../../config/db");


/* =====================================================
   UTILIDADES GENERALES
===================================================== */

const crearError = (
    mensaje,
    statusCode = 400,
    codigo = null
) => {
    const error = new Error(mensaje);

    error.statusCode = statusCode;

    if (codigo) {
        error.codigo = codigo;
    }

    return error;
};


/* =====================================================
   NORMALIZAR FECHA
===================================================== */

const obtenerFechaISO = (valor) => {
    if (!valor) {
        return null;
    }

    if (valor instanceof Date) {
        const year =
            valor.getFullYear();

        const month =
            String(
                valor.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                valor.getDate()
            ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    const texto =
        String(valor);

    return texto.substring(0, 10);
};


/* =====================================================
   NORMALIZAR TIMESTAMP PARA POSTGRESQL
===================================================== */

const normalizarFechaHora = (valor) => {
    if (!valor) {
        return null;
    }

    if (valor instanceof Date) {
        const year =
            valor.getFullYear();

        const month =
            String(
                valor.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                valor.getDate()
            ).padStart(2, "0");

        const hour =
            String(
                valor.getHours()
            ).padStart(2, "0");

        const minute =
            String(
                valor.getMinutes()
            ).padStart(2, "0");

        const second =
            String(
                valor.getSeconds()
            ).padStart(2, "0");

        return (
            `${year}-${month}-${day} ` +
            `${hour}:${minute}:${second}`
        );
    }

    return String(valor)
        .replace("T", " ")
        .replace("Z", "")
        .substring(0, 19);
};


/* =====================================================
   REGISTRAR AUDITORÍA
===================================================== */

const registrarAuditoria = async (
    client,
    {
        usuarioId = null,
        accion,
        registroId = null,
        datosAnteriores = null,
        datosNuevos = null
    }
) => {
    await client.query(
        `
        INSERT INTO registros_auditoria
        (
            usuario_id,
            modulo,
            accion,
            registro_id,
            datos_anteriores,
            datos_nuevos
        )
        VALUES
        (
            $1,
            'asistencia',
            $2,
            $3,
            $4,
            $5
        )
        `,
        [
            usuarioId || null,
            accion,
            registroId || null,
            datosAnteriores,
            datosNuevos
        ]
    );
};


/* =====================================================
   BLOQUEO TRANSACCIONAL

   Evita dos entradas/salidas simultáneas para el mismo
   empleado, obra y fecha.
===================================================== */

const bloquearAsistencia = async (
    client,
    empleadoId,
    obraId,
    fecha
) => {
    const llave =
        `${empleadoId}:${obraId}:${fecha}`;

    await client.query(
        `
        SELECT pg_advisory_xact_lock(
            hashtext($1)::bigint
        )
        `,
        [llave]
    );
};


/* =====================================================
   VALIDAR EMPLEADO
===================================================== */

const validarEmpleado = async (
    client,
    empleadoId
) => {
    const resultado =
        await client.query(
            `
            SELECT
                id,
                nombres,
                apellidos,
                cedula,
                activo
            FROM empleados
            WHERE id = $1
            LIMIT 1
            `,
            [empleadoId]
        );

    if (resultado.rowCount === 0) {
        throw crearError(
            "El empleado no existe.",
            404,
            "EMPLEADO_NO_ENCONTRADO"
        );
    }

    const empleado =
        resultado.rows[0];

    if (!empleado.activo) {
        throw crearError(
            "El empleado se encuentra inactivo.",
            400,
            "EMPLEADO_INACTIVO"
        );
    }

    return empleado;
};


/* =====================================================
   VALIDAR OBRA
===================================================== */

const validarObra = async (
    client,
    obraId,
    fecha
) => {
    const resultado =
        await client.query(
            `
            SELECT
                id,
                codigo,
                nombre,
                estado,
                fecha_inicio,
                fecha_fin
            FROM obras
            WHERE id = $1
            LIMIT 1
            `,
            [obraId]
        );

    if (resultado.rowCount === 0) {
        throw crearError(
            "La obra no existe.",
            404,
            "OBRA_NO_ENCONTRADA"
        );
    }

    const obra =
        resultado.rows[0];

    if (obra.estado === "cancelada") {
        throw crearError(
            "No se puede registrar asistencia en una obra cancelada.",
            400,
            "OBRA_CANCELADA"
        );
    }

    if (obra.estado === "planificada") {
        throw crearError(
            "La obra todavía se encuentra planificada. Debe estar en progreso para registrar asistencia.",
            400,
            "OBRA_NO_INICIADA"
        );
    }

    /*
     * Se permite registrar información histórica
     * de una obra finalizada.
     */
    if (
        obra.fecha_inicio &&
        fecha <
        obtenerFechaISO(
            obra.fecha_inicio
        )
    ) {
        throw crearError(
            "La fecha de asistencia es anterior al inicio de la obra.",
            400,
            "FECHA_ANTERIOR_OBRA"
        );
    }

    if (
        obra.fecha_fin &&
        fecha >
        obtenerFechaISO(
            obra.fecha_fin
        )
    ) {
        throw crearError(
            "La fecha de asistencia es posterior a la fecha de finalización de la obra.",
            400,
            "FECHA_POSTERIOR_OBRA"
        );
    }

    return obra;
};


/* =====================================================
   OBTENER ASIGNACIÓN VÁLIDA
===================================================== */

const obtenerAsignacionValida = async (
    client,
    empleadoId,
    obraId,
    fecha
) => {
    const resultado =
        await client.query(
            `
            SELECT
                eo.id,
                eo.obra_id,
                eo.empleado_id,
                eo.fecha_asignacion,
                eo.fecha_inicio,
                eo.fecha_fin,
                eo.cargo_obra,
                eo.salario_acordado,
                eo.activo,
                eo.observaciones
            FROM empleados_obras eo
            WHERE eo.empleado_id = $1
              AND eo.obra_id = $2
              AND eo.activo = TRUE

              AND (
                    eo.fecha_inicio IS NULL
                    OR eo.fecha_inicio <= $3::date
                  )

              AND (
                    eo.fecha_fin IS NULL
                    OR eo.fecha_fin >= $3::date
                  )

            ORDER BY
                COALESCE(
                    eo.fecha_inicio,
                    eo.fecha_asignacion
                ) DESC

            LIMIT 1
            `,
            [
                empleadoId,
                obraId,
                fecha
            ]
        );

    if (resultado.rowCount === 0) {
        throw crearError(
            "El empleado no tiene una asignación activa para esta obra en la fecha indicada.",
            400,
            "EMPLEADO_NO_ASIGNADO"
        );
    }

    return resultado.rows[0];
};


/* =====================================================
   VALIDAR CONTEXTO DE ASISTENCIA
===================================================== */

const validarContexto = async (
    client,
    empleadoId,
    obraId,
    fecha
) => {
    const empleado =
        await validarEmpleado(
            client,
            empleadoId
        );

    const obra =
        await validarObra(
            client,
            obraId,
            fecha
        );

    const asignacion =
        await obtenerAsignacionValida(
            client,
            empleadoId,
            obraId,
            fecha
        );

    return {
        empleado,
        obra,
        asignacion
    };
};


/* =====================================================
   OBTENER O CREAR ASISTENCIA DEL DÍA
===================================================== */

const obtenerOCrearAsistencia = async (
    client,
    {
        empleadoId,
        obraId,
        asignacionId,
        fecha,
        usuarioId = null
    }
) => {
    const existente =
        await client.query(
            `
            SELECT *
            FROM asistencias_empleados
            WHERE empleado_id = $1
              AND obra_id = $2
              AND fecha = $3::date
            LIMIT 1
            FOR UPDATE
            `,
            [
                empleadoId,
                obraId,
                fecha
            ]
        );

    if (existente.rowCount > 0) {
        const asistencia =
            existente.rows[0];

        /*
         * Protección adicional:
         * la asistencia debe corresponder a la
         * misma asignación encontrada.
         */
        if (
            asistencia.asignacion_id !==
            asignacionId
        ) {
            throw crearError(
                "La asistencia existente pertenece a otra asignación del empleado.",
                409,
                "ASIGNACION_INCONSISTENTE"
            );
        }

        return {
            asistencia,
            creada: false
        };
    }

    const creada =
        await client.query(
            `
            INSERT INTO asistencias_empleados
            (
                empleado_id,
                obra_id,
                asignacion_id,
                fecha,
                estado,
                usuario_registro_id
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4::date,
                'presente',
                $5
            )
            RETURNING *
            `,
            [
                empleadoId,
                obraId,
                asignacionId,
                fecha,
                usuarioId || null
            ]
        );

    return {
        asistencia:
            creada.rows[0],
        creada: true
    };
};


/* =====================================================
   OBTENER MARCACIONES
===================================================== */

const obtenerMarcacionesAsistencia = async (
    client,
    asistenciaId
) => {
    const resultado =
        await client.query(
            `
            SELECT
                id,
                asistencia_id,
                empleado_id,
                obra_id,
                asignacion_id,
                fecha_hora,
                tipo,
                origen_registro,
                dispositivo_id,
                referencia_externa,
                observaciones,
                usuario_registro_id,
                fecha_creacion,
                fecha_actualizacion
            FROM marcaciones_asistencia
            WHERE asistencia_id = $1
            ORDER BY
                fecha_hora ASC,
                fecha_creacion ASC
            `,
            [asistenciaId]
        );

    return resultado.rows;
};


/* =====================================================
   OBTENER ÚLTIMA MARCACIÓN
===================================================== */

const obtenerUltimaMarcacion = async (
    client,
    asistenciaId
) => {
    const resultado =
        await client.query(
            `
            SELECT *
            FROM marcaciones_asistencia
            WHERE asistencia_id = $1
            ORDER BY
                fecha_hora DESC,
                fecha_creacion DESC
            LIMIT 1
            `,
            [asistenciaId]
        );

    return resultado.rows[0] || null;
};


/* =====================================================
   VALIDAR SECUENCIA DE MARCACIONES
===================================================== */

const validarSecuenciaMarcaciones = (
    marcaciones
) => {
    if (!marcaciones.length) {
        return true;
    }

    if (
        marcaciones[0].tipo !==
        "entrada"
    ) {
        throw crearError(
            "La primera marcación del día debe ser una entrada.",
            400,
            "SECUENCIA_MARCACIONES_INVALIDA"
        );
    }

    for (
        let i = 1;
        i < marcaciones.length;
        i += 1
    ) {
        const anterior =
            marcaciones[i - 1];

        const actual =
            marcaciones[i];

        if (
            anterior.tipo ===
            actual.tipo
        ) {
            throw crearError(
                "La secuencia de marcaciones es inválida. Una entrada debe ir seguida de una salida y viceversa.",
                400,
                "SECUENCIA_MARCACIONES_INVALIDA"
            );
        }

        const fechaAnterior =
            new Date(
                anterior.fecha_hora
            );

        const fechaActual =
            new Date(
                actual.fecha_hora
            );

        if (
            fechaActual <=
            fechaAnterior
        ) {
            throw crearError(
                "Las marcaciones deben mantener un orden cronológico válido.",
                400,
                "ORDEN_MARCACIONES_INVALIDO"
            );
        }
    }

    return true;
};


/* =====================================================
   CALCULAR MINUTOS TRABAJADOS
===================================================== */

const calcularMinutosTrabajados = (
    marcaciones
) => {
    let totalMinutos = 0;

    for (
        let i = 0;
        i < marcaciones.length - 1;
        i += 1
    ) {
        const actual =
            marcaciones[i];

        const siguiente =
            marcaciones[i + 1];

        if (
            actual.tipo === "entrada" &&
            siguiente.tipo === "salida"
        ) {
            const inicio =
                new Date(
                    actual.fecha_hora
                );

            const fin =
                new Date(
                    siguiente.fecha_hora
                );

            const diferencia =
                fin.getTime() -
                inicio.getTime();

            if (diferencia > 0) {
                totalMinutos +=
                    Math.floor(
                        diferencia /
                        60000
                    );
            }
        }
    }

    return totalMinutos;
};


/* =====================================================
   FORMATEAR MINUTOS
===================================================== */

const formatearMinutos = (
    minutos
) => {
    const total =
        Number(minutos || 0);

    const horas =
        Math.floor(
            total / 60
        );

    const minutosRestantes =
        total % 60;

    return {
        minutos: total,
        horas_decimal:
            Number(
                (
                    total / 60
                ).toFixed(2)
            ),
        texto:
            `${horas}h ${String(
                minutosRestantes
            ).padStart(2, "0")}m`
    };
};


/* =====================================================
   VERIFICAR SI ASISTENCIA TIENE MARCACIONES
===================================================== */

const contarMarcaciones = async (
    client,
    asistenciaId
) => {
    const resultado =
        await client.query(
            `
            SELECT COUNT(*)::integer AS total
            FROM marcaciones_asistencia
            WHERE asistencia_id = $1
            `,
            [asistenciaId]
        );

    return Number(
        resultado.rows[0].total || 0
    );
};


/* =====================================================
   REGISTRAR ENTRADA
===================================================== */

const registrarEntrada = async (
    data,
    usuarioId = null
) => {
    const client =
        await pool.connect();

    try {
        await client.query("BEGIN");

        const fechaHora =
            normalizarFechaHora(
                data.fecha_hora
            );

        const fecha =
            obtenerFechaISO(
                data.fecha_hora
            );

        await bloquearAsistencia(
            client,
            data.empleado_id,
            data.obra_id,
            fecha
        );

        const {
            empleado,
            obra,
            asignacion
        } =
            await validarContexto(
                client,
                data.empleado_id,
                data.obra_id,
                fecha
            );

        const {
            asistencia,
            creada
        } =
            await obtenerOCrearAsistencia(
                client,
                {
                    empleadoId:
                        data.empleado_id,

                    obraId:
                        data.obra_id,

                    asignacionId:
                        asignacion.id,

                    fecha,

                    usuarioId
                }
            );

        /*
         * No permitir entrada si el día está marcado
         * como ausencia/permiso/justificado.
         */
        if (
            [
                "ausente",
                "permiso",
                "justificado"
            ].includes(
                asistencia.estado
            )
        ) {
            throw crearError(
                `La asistencia está registrada como ${asistencia.estado}. Debe corregir la novedad antes de registrar una entrada.`,
                409,
                "ASISTENCIA_CON_NOVEDAD"
            );
        }

        const ultimaMarcacion =
            await obtenerUltimaMarcacion(
                client,
                asistencia.id
            );

        if (
            ultimaMarcacion &&
            ultimaMarcacion.tipo ===
            "entrada"
        ) {
            throw crearError(
                "El empleado ya tiene una entrada abierta. Debe registrar la salida antes de una nueva entrada.",
                409,
                "ENTRADA_YA_ABIERTA"
            );
        }

        if (
            ultimaMarcacion
        ) {
            const nuevaFecha =
                new Date(
                    fechaHora
                );

            const ultimaFecha =
                new Date(
                    ultimaMarcacion.fecha_hora
                );

            if (
                nuevaFecha <=
                ultimaFecha
            ) {
                throw crearError(
                    "La nueva entrada debe ser posterior a la última marcación registrada.",
                    400,
                    "FECHA_MARCACION_INVALIDA"
                );
            }
        }

        const resultado =
            await client.query(
                `
                INSERT INTO marcaciones_asistencia
                (
                    asistencia_id,
                    empleado_id,
                    obra_id,
                    asignacion_id,
                    fecha_hora,
                    tipo,
                    origen_registro,
                    observaciones,
                    usuario_registro_id
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5::timestamp,
                    'entrada',
                    'manual',
                    $6,
                    $7
                )
                RETURNING *
                `,
                [
                    asistencia.id,
                    data.empleado_id,
                    data.obra_id,
                    asignacion.id,
                    fechaHora,
                    data.observaciones ||
                    null,
                    usuarioId || null
                ]
            );

        const marcacion =
            resultado.rows[0];

        if (creada) {
            await registrarAuditoria(
                client,
                {
                    usuarioId,
                    accion:
                        "crear_asistencia",
                    registroId:
                        asistencia.id,
                    datosNuevos:
                        asistencia
                }
            );
        }

        await registrarAuditoria(
            client,
            {
                usuarioId,
                accion:
                    "registrar_entrada",
                registroId:
                    marcacion.id,
                datosNuevos:
                    marcacion
            }
        );

        await client.query(
            "COMMIT"
        );

        return {
            asistencia,
            marcacion,
            empleado,
            obra,
            asignacion
        };
    } catch (error) {
        await client.query(
            "ROLLBACK"
        );

        throw error;
    } finally {
        client.release();
    }
};


/* =====================================================
   REGISTRAR SALIDA
===================================================== */

const registrarSalida = async (
    data,
    usuarioId = null
) => {
    const client =
        await pool.connect();

    try {
        await client.query("BEGIN");

        const fechaHora =
            normalizarFechaHora(
                data.fecha_hora
            );

        const fecha =
            obtenerFechaISO(
                data.fecha_hora
            );

        await bloquearAsistencia(
            client,
            data.empleado_id,
            data.obra_id,
            fecha
        );

        const {
            empleado,
            obra,
            asignacion
        } =
            await validarContexto(
                client,
                data.empleado_id,
                data.obra_id,
                fecha
            );

        const resultadoAsistencia =
            await client.query(
                `
                SELECT *
                FROM asistencias_empleados
                WHERE empleado_id = $1
                  AND obra_id = $2
                  AND fecha = $3::date
                LIMIT 1
                FOR UPDATE
                `,
                [
                    data.empleado_id,
                    data.obra_id,
                    fecha
                ]
            );

        if (
            resultadoAsistencia.rowCount ===
            0
        ) {
            throw crearError(
                "No existe una asistencia con una entrada registrada para este empleado.",
                404,
                "ASISTENCIA_NO_ENCONTRADA"
            );
        }

        const asistencia =
            resultadoAsistencia.rows[0];

        if (
            asistencia.asignacion_id !==
            asignacion.id
        ) {
            throw crearError(
                "La asistencia pertenece a una asignación diferente.",
                409,
                "ASIGNACION_INCONSISTENTE"
            );
        }

        const ultimaMarcacion =
            await obtenerUltimaMarcacion(
                client,
                asistencia.id
            );

        if (!ultimaMarcacion) {
            throw crearError(
                "No existe una entrada previa para registrar la salida.",
                400,
                "ENTRADA_NO_ENCONTRADA"
            );
        }

        if (
            ultimaMarcacion.tipo !==
            "entrada"
        ) {
            throw crearError(
                "La última marcación ya es una salida. Debe registrar una nueva entrada antes de otra salida.",
                409,
                "SALIDA_YA_REGISTRADA"
            );
        }

        const nuevaFecha =
            new Date(fechaHora);

        const fechaEntrada =
            new Date(
                ultimaMarcacion.fecha_hora
            );

        if (
            nuevaFecha <=
            fechaEntrada
        ) {
            throw crearError(
                "La hora de salida debe ser posterior a la hora de entrada.",
                400,
                "SALIDA_ANTERIOR_ENTRADA"
            );
        }

        const resultado =
            await client.query(
                `
                INSERT INTO marcaciones_asistencia
                (
                    asistencia_id,
                    empleado_id,
                    obra_id,
                    asignacion_id,
                    fecha_hora,
                    tipo,
                    origen_registro,
                    observaciones,
                    usuario_registro_id
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5::timestamp,
                    'salida',
                    'manual',
                    $6,
                    $7
                )
                RETURNING *
                `,
                [
                    asistencia.id,
                    data.empleado_id,
                    data.obra_id,
                    asignacion.id,
                    fechaHora,
                    data.observaciones ||
                    null,
                    usuarioId || null
                ]
            );

        const marcacion =
            resultado.rows[0];

        await registrarAuditoria(
            client,
            {
                usuarioId,
                accion:
                    "registrar_salida",
                registroId:
                    marcacion.id,
                datosNuevos:
                    marcacion
            }
        );

        const marcaciones =
            await obtenerMarcacionesAsistencia(
                client,
                asistencia.id
            );

        const minutos =
            calcularMinutosTrabajados(
                marcaciones
            );

        await client.query(
            "COMMIT"
        );

        return {
            asistencia,
            marcacion,
            empleado,
            obra,
            asignacion,
            tiempo_trabajado:
                formatearMinutos(
                    minutos
                )
        };
    } catch (error) {
        await client.query(
            "ROLLBACK"
        );

        throw error;
    } finally {
        client.release();
    }
};


/* =====================================================
   REGISTRAR NOVEDAD

   Estados:
   - presente
   - atraso
   - ausente
   - permiso
   - justificado
===================================================== */

const registrarNovedad = async (
    data,
    usuarioId = null
) => {
    const client =
        await pool.connect();

    try {
        await client.query("BEGIN");

        const fecha =
            obtenerFechaISO(
                data.fecha
            );

        await bloquearAsistencia(
            client,
            data.empleado_id,
            data.obra_id,
            fecha
        );

        const {
            empleado,
            obra,
            asignacion
        } =
            await validarContexto(
                client,
                data.empleado_id,
                data.obra_id,
                fecha
            );

        const resultadoExistente =
            await client.query(
                `
                SELECT *
                FROM asistencias_empleados
                WHERE empleado_id = $1
                  AND obra_id = $2
                  AND fecha = $3::date
                LIMIT 1
                FOR UPDATE
                `,
                [
                    data.empleado_id,
                    data.obra_id,
                    fecha
                ]
            );

        let asistencia;

        if (
            resultadoExistente.rowCount >
            0
        ) {
            asistencia =
                resultadoExistente.rows[0];

            const totalMarcaciones =
                await contarMarcaciones(
                    client,
                    asistencia.id
                );

            if (
                totalMarcaciones > 0 &&
                [
                    "ausente",
                    "permiso",
                    "justificado"
                ].includes(data.estado)
            ) {
                throw crearError(
                    "No puede registrar ausencia, permiso o justificación porque el empleado ya posee marcaciones ese día.",
                    409,
                    "ASISTENCIA_TIENE_MARCACIONES"
                );
            }

            const anterior = {
                ...asistencia
            };

            const actualizado =
                await client.query(
                    `
                    UPDATE asistencias_empleados
                    SET
                        estado = $1,
                        observaciones = $2
                    WHERE id = $3
                    RETURNING *
                    `,
                    [
                        data.estado,
                        data.observaciones ||
                        null,
                        asistencia.id
                    ]
                );

            asistencia =
                actualizado.rows[0];

            await registrarAuditoria(
                client,
                {
                    usuarioId,
                    accion:
                        "actualizar_novedad_asistencia",
                    registroId:
                        asistencia.id,
                    datosAnteriores:
                        anterior,
                    datosNuevos:
                        asistencia
                }
            );
        } else {
            const creada =
                await client.query(
                    `
                    INSERT INTO asistencias_empleados
                    (
                        empleado_id,
                        obra_id,
                        asignacion_id,
                        fecha,
                        estado,
                        observaciones,
                        usuario_registro_id
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4::date,
                        $5,
                        $6,
                        $7
                    )
                    RETURNING *
                    `,
                    [
                        data.empleado_id,
                        data.obra_id,
                        asignacion.id,
                        fecha,
                        data.estado,
                        data.observaciones ||
                        null,
                        usuarioId || null
                    ]
                );

            asistencia =
                creada.rows[0];

            await registrarAuditoria(
                client,
                {
                    usuarioId,
                    accion:
                        "registrar_novedad_asistencia",
                    registroId:
                        asistencia.id,
                    datosNuevos:
                        asistencia
                }
            );
        }

        await client.query(
            "COMMIT"
        );

        return {
            asistencia,
            empleado,
            obra,
            asignacion
        };
    } catch (error) {
        await client.query(
            "ROLLBACK"
        );

        throw error;
    } finally {
        client.release();
    }
};


/* =====================================================
   REGISTRAR MARCACIÓN DESDE INTEGRACIÓN
   BIOMÉTRICA / SISTEMA
===================================================== */

const registrarMarcacionIntegracion =
    async (
        data
    ) => {
        const client =
            await pool.connect();

        try {
            await client.query(
                "BEGIN"
            );

            /*
             * Idempotencia.
             *
             * Si el dispositivo reenvía la misma referencia,
             * retornamos la marcación existente.
             */
            if (
                data.referencia_externa
            ) {
                const duplicada =
                    await client.query(
                        `
                        SELECT *
                        FROM marcaciones_asistencia
                        WHERE referencia_externa = $1
                        LIMIT 1
                        `,
                        [
                            data.referencia_externa
                        ]
                    );

                if (
                    duplicada.rowCount >
                    0
                ) {
                    await client.query(
                        "COMMIT"
                    );

                    return {
                        duplicado: true,
                        marcacion:
                            duplicada.rows[0]
                    };
                }
            }

            const fechaHora =
                normalizarFechaHora(
                    data.fecha_hora
                );

            const fecha =
                obtenerFechaISO(
                    data.fecha_hora
                );

            await bloquearAsistencia(
                client,
                data.empleado_id,
                data.obra_id,
                fecha
            );

            const {
                empleado,
                obra,
                asignacion
            } =
                await validarContexto(
                    client,
                    data.empleado_id,
                    data.obra_id,
                    fecha
                );

            const {
                asistencia
            } =
                await obtenerOCrearAsistencia(
                    client,
                    {
                        empleadoId:
                            data.empleado_id,

                        obraId:
                            data.obra_id,

                        asignacionId:
                            asignacion.id,

                        fecha,

                        usuarioId:
                            null
                    }
                );

            if (
                [
                    "ausente",
                    "permiso",
                    "justificado"
                ].includes(
                    asistencia.estado
                )
            ) {
                throw crearError(
                    `La asistencia se encuentra registrada como ${asistencia.estado}.`,
                    409,
                    "ASISTENCIA_CON_NOVEDAD"
                );
            }

            const ultimaMarcacion =
                await obtenerUltimaMarcacion(
                    client,
                    asistencia.id
                );

            if (
                !ultimaMarcacion &&
                data.tipo !== "entrada"
            ) {
                throw crearError(
                    "La primera marcación debe ser una entrada.",
                    400,
                    "PRIMERA_MARCACION_INVALIDA"
                );
            }

            if (
                ultimaMarcacion &&
                ultimaMarcacion.tipo ===
                data.tipo
            ) {
                throw crearError(
                    `No se puede registrar otra ${data.tipo} consecutiva.`,
                    409,
                    "MARCACION_CONSECUTIVA"
                );
            }

            if (
                ultimaMarcacion
            ) {
                const nuevaFecha =
                    new Date(
                        fechaHora
                    );

                const anterior =
                    new Date(
                        ultimaMarcacion.fecha_hora
                    );

                if (
                    nuevaFecha <=
                    anterior
                ) {
                    throw crearError(
                        "La marcación debe ser posterior a la última registrada.",
                        400,
                        "FECHA_MARCACION_INVALIDA"
                    );
                }
            }

            const resultado =
                await client.query(
                    `
                    INSERT INTO marcaciones_asistencia
                    (
                        asistencia_id,
                        empleado_id,
                        obra_id,
                        asignacion_id,
                        fecha_hora,
                        tipo,
                        origen_registro,
                        dispositivo_id,
                        referencia_externa,
                        observaciones
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5::timestamp,
                        $6,
                        $7,
                        $8,
                        $9,
                        $10
                    )
                    RETURNING *
                    `,
                    [
                        asistencia.id,
                        data.empleado_id,
                        data.obra_id,
                        asignacion.id,
                        fechaHora,
                        data.tipo,
                        data.origen_registro,
                        data.dispositivo_id ||
                        null,
                        data.referencia_externa ||
                        null,
                        data.observaciones ||
                        null
                    ]
                );

            const marcacion =
                resultado.rows[0];

            await registrarAuditoria(
                client,
                {
                    usuarioId: null,
                    accion:
                        data.origen_registro ===
                            "biometrico"
                            ? "marcacion_biometrica"
                            : "marcacion_sistema",
                    registroId:
                        marcacion.id,
                    datosNuevos:
                        marcacion
                }
            );

            await client.query(
                "COMMIT"
            );

            return {
                duplicado: false,
                asistencia,
                marcacion,
                empleado,
                obra,
                asignacion
            };
        } catch (error) {
            await client.query(
                "ROLLBACK"
            );

            /*
             * Protección adicional frente a una carrera
             * por referencia_externa.
             */
            if (
                error.code ===
                "23505" &&
                data.referencia_externa
            ) {
                const existente =
                    await pool.query(
                        `
                        SELECT *
                        FROM marcaciones_asistencia
                        WHERE referencia_externa = $1
                        LIMIT 1
                        `,
                        [
                            data.referencia_externa
                        ]
                    );

                if (
                    existente.rowCount >
                    0
                ) {
                    return {
                        duplicado: true,
                        marcacion:
                            existente.rows[0]
                    };
                }
            }

            throw error;
        } finally {
            client.release();
        }
    };


/* =====================================================
   LISTAR ASISTENCIAS
===================================================== */

const listarAsistencias = async (
    filtros = {}
) => {
    const condiciones = [];
    const valores = [];

    let indice = 1;

    if (filtros.empleado_id) {
        condiciones.push(
            `a.empleado_id = $${indice}`
        );

        valores.push(
            filtros.empleado_id
        );

        indice += 1;
    }

    if (filtros.obra_id) {
        condiciones.push(
            `a.obra_id = $${indice}`
        );

        valores.push(
            filtros.obra_id
        );

        indice += 1;
    }

    if (filtros.asignacion_id) {
        condiciones.push(
            `a.asignacion_id = $${indice}`
        );

        valores.push(
            filtros.asignacion_id
        );

        indice += 1;
    }

    if (filtros.fecha) {
        condiciones.push(
            `a.fecha = $${indice}::date`
        );

        valores.push(
            obtenerFechaISO(
                filtros.fecha
            )
        );

        indice += 1;
    }

    if (filtros.fecha_desde) {
        condiciones.push(
            `a.fecha >= $${indice}::date`
        );

        valores.push(
            obtenerFechaISO(
                filtros.fecha_desde
            )
        );

        indice += 1;
    }

    if (filtros.fecha_hasta) {
        condiciones.push(
            `a.fecha <= $${indice}::date`
        );

        valores.push(
            obtenerFechaISO(
                filtros.fecha_hasta
            )
        );

        indice += 1;
    }

    if (filtros.estado) {
        condiciones.push(
            `a.estado = $${indice}`
        );

        valores.push(
            filtros.estado
        );

        indice += 1;
    }

    if (
        filtros.buscar &&
        filtros.buscar.trim()
    ) {
        condiciones.push(
            `
            (
                e.nombres ILIKE $${indice}
                OR e.apellidos ILIKE $${indice}
                OR e.cedula ILIKE $${indice}
                OR CONCAT(
                    e.nombres,
                    ' ',
                    e.apellidos
                ) ILIKE $${indice}
                OR o.nombre ILIKE $${indice}
                OR o.codigo ILIKE $${indice}
            )
            `
        );

        valores.push(
            `%${filtros.buscar.trim()}%`
        );

        indice += 1;
    }

    const where =
        condiciones.length
            ? `WHERE ${condiciones.join(
                " AND "
            )}`
            : "";

    const resultado =
        await pool.query(
            `
            WITH secuencia AS (
                SELECT
                    ma.asistencia_id,
                    ma.fecha_hora,
                    ma.tipo,

                    LEAD(
                        ma.fecha_hora
                    ) OVER (
                        PARTITION BY
                            ma.asistencia_id
                        ORDER BY
                            ma.fecha_hora ASC,
                            ma.fecha_creacion ASC
                    ) AS siguiente_fecha_hora,

                    LEAD(
                        ma.tipo
                    ) OVER (
                        PARTITION BY
                            ma.asistencia_id
                        ORDER BY
                            ma.fecha_hora ASC,
                            ma.fecha_creacion ASC
                    ) AS siguiente_tipo

                FROM marcaciones_asistencia ma
            ),

            resumen_marcaciones AS (
                SELECT
                    asistencia_id,

                    MIN(fecha_hora)
                        FILTER (
                            WHERE tipo = 'entrada'
                        )
                        AS primera_entrada,

                    MAX(fecha_hora)
                        FILTER (
                            WHERE tipo = 'salida'
                        )
                        AS ultima_salida,

                    COUNT(*)::integer
                        AS total_marcaciones,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN tipo = 'entrada'
                                 AND siguiente_tipo = 'salida'
                                THEN
                                    EXTRACT(
                                        EPOCH FROM (
                                            siguiente_fecha_hora -
                                            fecha_hora
                                        )
                                    ) / 60
                                ELSE 0
                            END
                        ),
                        0
                    )::integer
                        AS minutos_trabajados

                FROM secuencia

                GROUP BY
                    asistencia_id
            )

            SELECT
                a.id,
                a.empleado_id,
                a.obra_id,
                a.asignacion_id,
                a.fecha,
                a.estado,
                a.observaciones,
                a.usuario_registro_id,
                a.fecha_creacion,
                a.fecha_actualizacion,

                e.nombres,
                e.apellidos,
                e.cedula,
                e.cargo,

                o.codigo
                    AS obra_codigo,

                o.nombre
                    AS obra_nombre,

                eo.cargo_obra,

                COALESCE(
                    rm.total_marcaciones,
                    0
                ) AS total_marcaciones,

                rm.primera_entrada,

                rm.ultima_salida,

                COALESCE(
                    rm.minutos_trabajados,
                    0
                ) AS minutos_trabajados

            FROM asistencias_empleados a

            INNER JOIN empleados e
                ON e.id =
                   a.empleado_id

            INNER JOIN obras o
                ON o.id =
                   a.obra_id

            INNER JOIN empleados_obras eo
                ON eo.id =
                   a.asignacion_id

            LEFT JOIN resumen_marcaciones rm
                ON rm.asistencia_id =
                   a.id

            ${where}

            ORDER BY
                a.fecha DESC,
                e.apellidos ASC,
                e.nombres ASC
            `,
            valores
        );

    return resultado.rows.map(
        (fila) => ({
            ...fila,

            total_marcaciones:
                Number(
                    fila.total_marcaciones ||
                    0
                ),

            minutos_trabajados:
                Number(
                    fila.minutos_trabajados ||
                    0
                ),

            tiempo_trabajado:
                formatearMinutos(
                    fila.minutos_trabajados
                )
        })
    );
};


/* =====================================================
   OBTENER ASISTENCIA POR ID
===================================================== */

const obtenerAsistenciaPorId =
    async (id) => {
        const resultado =
            await pool.query(
                `
                SELECT
                    a.*,

                    e.nombres,
                    e.apellidos,
                    e.cedula,
                    e.telefono,
                    e.correo,
                    e.cargo,
                    e.tipo_pago,
                    e.salario_base,

                    o.codigo
                        AS obra_codigo,

                    o.nombre
                        AS obra_nombre,

                    o.ubicacion
                        AS obra_ubicacion,

                    eo.cargo_obra,
                    eo.fecha_inicio
                        AS asignacion_fecha_inicio,
                    eo.fecha_fin
                        AS asignacion_fecha_fin,
                    eo.salario_acordado

                FROM asistencias_empleados a

                INNER JOIN empleados e
                    ON e.id =
                       a.empleado_id

                INNER JOIN obras o
                    ON o.id =
                       a.obra_id

                INNER JOIN empleados_obras eo
                    ON eo.id =
                       a.asignacion_id

                WHERE a.id = $1

                LIMIT 1
                `,
                [id]
            );

        if (
            resultado.rowCount === 0
        ) {
            throw crearError(
                "La asistencia no existe.",
                404,
                "ASISTENCIA_NO_ENCONTRADA"
            );
        }

        const asistencia =
            resultado.rows[0];

        const marcaciones =
            await pool.query(
                `
                SELECT
                    id,
                    asistencia_id,
                    empleado_id,
                    obra_id,
                    asignacion_id,
                    fecha_hora,
                    tipo,
                    origen_registro,
                    dispositivo_id,
                    referencia_externa,
                    observaciones,
                    usuario_registro_id,
                    fecha_creacion,
                    fecha_actualizacion
                FROM marcaciones_asistencia
                WHERE asistencia_id = $1
                ORDER BY
                    fecha_hora ASC,
                    fecha_creacion ASC
                `,
                [id]
            );

        const minutos =
            calcularMinutosTrabajados(
                marcaciones.rows
            );

        return {
            ...asistencia,

            marcaciones:
                marcaciones.rows,

            total_marcaciones:
                marcaciones.rows.length,

            minutos_trabajados:
                minutos,

            tiempo_trabajado:
                formatearMinutos(
                    minutos
                )
        };
    };


/* =====================================================
   ACTUALIZAR ASISTENCIA
===================================================== */

const actualizarAsistencia =
    async (
        id,
        data,
        usuarioId = null
    ) => {
        const client =
            await pool.connect();

        try {
            await client.query(
                "BEGIN"
            );

            const resultado =
                await client.query(
                    `
                    SELECT *
                    FROM asistencias_empleados
                    WHERE id = $1
                    LIMIT 1
                    FOR UPDATE
                    `,
                    [id]
                );

            if (
                resultado.rowCount ===
                0
            ) {
                throw crearError(
                    "La asistencia no existe.",
                    404,
                    "ASISTENCIA_NO_ENCONTRADA"
                );
            }

            const anterior =
                resultado.rows[0];

            if (
                data.estado &&
                [
                    "ausente",
                    "permiso",
                    "justificado"
                ].includes(
                    data.estado
                )
            ) {
                const total =
                    await contarMarcaciones(
                        client,
                        id
                    );

                if (total > 0) {
                    throw crearError(
                        "No puede cambiar la asistencia a ausencia, permiso o justificado mientras existan marcaciones de entrada o salida.",
                        409,
                        "ASISTENCIA_TIENE_MARCACIONES"
                    );
                }
            }

            const estado =
                data.estado !==
                    undefined
                    ? data.estado
                    : anterior.estado;

            const observaciones =
                data.observaciones !==
                    undefined
                    ? (
                        data.observaciones ||
                        null
                    )
                    : anterior.observaciones;

            const actualizado =
                await client.query(
                    `
                    UPDATE asistencias_empleados
                    SET
                        estado = $1,
                        observaciones = $2
                    WHERE id = $3
                    RETURNING *
                    `,
                    [
                        estado,
                        observaciones,
                        id
                    ]
                );

            const asistencia =
                actualizado.rows[0];

            await registrarAuditoria(
                client,
                {
                    usuarioId,
                    accion:
                        "corregir_asistencia",
                    registroId:
                        id,

                    datosAnteriores: {
                        ...anterior,
                        motivo_correccion:
                            data.motivo
                    },

                    datosNuevos: {
                        ...asistencia,
                        motivo_correccion:
                            data.motivo
                    }
                }
            );

            await client.query(
                "COMMIT"
            );

            return asistencia;
        } catch (error) {
            await client.query(
                "ROLLBACK"
            );

            throw error;
        } finally {
            client.release();
        }
    };


/* =====================================================
   CORREGIR MARCACIÓN
===================================================== */

const corregirMarcacion =
    async (
        id,
        data,
        usuarioId = null
    ) => {
        const client =
            await pool.connect();

        try {
            await client.query(
                "BEGIN"
            );

            const resultado =
                await client.query(
                    `
                    SELECT
                        ma.*,
                        a.fecha
                            AS fecha_asistencia
                    FROM marcaciones_asistencia ma

                    INNER JOIN asistencias_empleados a
                        ON a.id =
                           ma.asistencia_id

                    WHERE ma.id = $1

                    LIMIT 1

                    FOR UPDATE OF ma
                    `,
                    [id]
                );

            if (
                resultado.rowCount ===
                0
            ) {
                throw crearError(
                    "La marcación no existe.",
                    404,
                    "MARCACION_NO_ENCONTRADA"
                );
            }

            const anterior =
                resultado.rows[0];

            const nuevaFechaHora =
                data.fecha_hora !==
                    undefined
                    ? normalizarFechaHora(
                        data.fecha_hora
                    )
                    : normalizarFechaHora(
                        anterior.fecha_hora
                    );

            const nuevoTipo =
                data.tipo ||
                anterior.tipo;

            const fechaMarcacion =
                obtenerFechaISO(
                    nuevaFechaHora
                );

            const fechaAsistencia =
                obtenerFechaISO(
                    anterior.fecha_asistencia
                );

            /*
             * Por ahora una jornada pertenece a una sola fecha.
             * Evitamos mover una marcación a otro día porque
             * implicaría moverla también a otra asistencia.
             */
            if (
                fechaMarcacion !==
                fechaAsistencia
            ) {
                throw crearError(
                    "La marcación corregida debe permanecer dentro de la fecha de la asistencia.",
                    400,
                    "FECHA_ASISTENCIA_INVALIDA"
                );
            }

            await bloquearAsistencia(
                client,
                anterior.empleado_id,
                anterior.obra_id,
                fechaAsistencia
            );

            const todas =
                await obtenerMarcacionesAsistencia(
                    client,
                    anterior.asistencia_id
                );

            const simuladas =
                todas.map(
                    (marcacion) => {
                        if (
                            marcacion.id !==
                            id
                        ) {
                            return marcacion;
                        }

                        return {
                            ...marcacion,

                            fecha_hora:
                                nuevaFechaHora,

                            tipo:
                                nuevoTipo
                        };
                    }
                );

            simuladas.sort(
                (a, b) =>
                    new Date(
                        a.fecha_hora
                    ).getTime() -
                    new Date(
                        b.fecha_hora
                    ).getTime()
            );

            validarSecuenciaMarcaciones(
                simuladas
            );

            const actualizado =
                await client.query(
                    `
                    UPDATE marcaciones_asistencia
                    SET
                        fecha_hora =
                            $1::timestamp,
                        tipo = $2
                    WHERE id = $3
                    RETURNING *
                    `,
                    [
                        nuevaFechaHora,
                        nuevoTipo,
                        id
                    ]
                );

            const marcacion =
                actualizado.rows[0];

            await registrarAuditoria(
                client,
                {
                    usuarioId,
                    accion:
                        "corregir_marcacion",
                    registroId:
                        id,

                    datosAnteriores: {
                        ...anterior,
                        motivo_correccion:
                            data.motivo
                    },

                    datosNuevos: {
                        ...marcacion,
                        motivo_correccion:
                            data.motivo
                    }
                }
            );

            await client.query(
                "COMMIT"
            );

            return marcacion;
        } catch (error) {
            await client.query(
                "ROLLBACK"
            );

            throw error;
        } finally {
            client.release();
        }
    };


/* =====================================================
   CONSULTA BASE PARA REPORTES
===================================================== */

const obtenerReportePeriodo =
    async (
        filtros
    ) => {
        const condiciones = [
            "a.fecha >= $1::date",
            "a.fecha <= $2::date"
        ];

        const valores = [
            obtenerFechaISO(
                filtros.fecha_desde
            ),
            obtenerFechaISO(
                filtros.fecha_hasta
            )
        ];

        let indice = 3;

        if (
            filtros.empleado_id
        ) {
            condiciones.push(
                `a.empleado_id = $${indice}`
            );

            valores.push(
                filtros.empleado_id
            );

            indice += 1;
        }

        if (filtros.obra_id) {
            condiciones.push(
                `a.obra_id = $${indice}`
            );

            valores.push(
                filtros.obra_id
            );

            indice += 1;
        }

        if (filtros.estado) {
            condiciones.push(
                `a.estado = $${indice}`
            );

            valores.push(
                filtros.estado
            );

            indice += 1;
        }

        const resultado =
            await pool.query(
                `
                WITH secuencia AS (
                    SELECT
                        ma.asistencia_id,
                        ma.fecha_hora,
                        ma.tipo,

                        LEAD(
                            ma.fecha_hora
                        ) OVER (
                            PARTITION BY
                                ma.asistencia_id
                            ORDER BY
                                ma.fecha_hora,
                                ma.fecha_creacion
                        ) AS siguiente_fecha_hora,

                        LEAD(
                            ma.tipo
                        ) OVER (
                            PARTITION BY
                                ma.asistencia_id
                            ORDER BY
                                ma.fecha_hora,
                                ma.fecha_creacion
                        ) AS siguiente_tipo

                    FROM marcaciones_asistencia ma
                ),

                calculos AS (
                    SELECT
                        asistencia_id,

                        MIN(fecha_hora)
                            FILTER (
                                WHERE tipo =
                                      'entrada'
                            )
                            AS primera_entrada,

                        MAX(fecha_hora)
                            FILTER (
                                WHERE tipo =
                                      'salida'
                            )
                            AS ultima_salida,

                        COUNT(*)::integer
                            AS total_marcaciones,

                        COALESCE(
                            SUM(
                                CASE
                                    WHEN tipo =
                                         'entrada'
                                     AND siguiente_tipo =
                                         'salida'
                                    THEN
                                        EXTRACT(
                                            EPOCH FROM (
                                                siguiente_fecha_hora -
                                                fecha_hora
                                            )
                                        ) / 60
                                    ELSE 0
                                END
                            ),
                            0
                        )::integer
                            AS minutos_trabajados

                    FROM secuencia

                    GROUP BY
                        asistencia_id
                )

                SELECT
                    a.id,
                    a.fecha,
                    a.estado,
                    a.observaciones,

                    a.empleado_id,
                    e.nombres,
                    e.apellidos,
                    e.cedula,
                    e.cargo,

                    a.obra_id,

                    o.codigo
                        AS obra_codigo,

                    o.nombre
                        AS obra_nombre,

                    a.asignacion_id,

                    eo.cargo_obra,

                    c.primera_entrada,
                    c.ultima_salida,

                    COALESCE(
                        c.total_marcaciones,
                        0
                    ) AS total_marcaciones,

                    COALESCE(
                        c.minutos_trabajados,
                        0
                    ) AS minutos_trabajados

                FROM asistencias_empleados a

                INNER JOIN empleados e
                    ON e.id =
                       a.empleado_id

                INNER JOIN obras o
                    ON o.id =
                       a.obra_id

                INNER JOIN empleados_obras eo
                    ON eo.id =
                       a.asignacion_id

                LEFT JOIN calculos c
                    ON c.asistencia_id =
                       a.id

                WHERE
                    ${condiciones.join(
                    " AND "
                )}

                ORDER BY
                    a.fecha ASC,
                    e.apellidos ASC,
                    e.nombres ASC
                `,
                valores
            );

        const detalle =
            resultado.rows.map(
                (fila) => ({
                    ...fila,

                    total_marcaciones:
                        Number(
                            fila.total_marcaciones ||
                            0
                        ),

                    minutos_trabajados:
                        Number(
                            fila.minutos_trabajados ||
                            0
                        ),

                    tiempo_trabajado:
                        formatearMinutos(
                            fila.minutos_trabajados
                        )
                })
            );

        const resumen = {
            total_registros:
                detalle.length,

            dias_presentes:
                detalle.filter(
                    (x) =>
                        x.estado ===
                        "presente"
                ).length,

            dias_atraso:
                detalle.filter(
                    (x) =>
                        x.estado ===
                        "atraso"
                ).length,

            ausencias:
                detalle.filter(
                    (x) =>
                        x.estado ===
                        "ausente"
                ).length,

            permisos:
                detalle.filter(
                    (x) =>
                        x.estado ===
                        "permiso"
                ).length,

            justificados:
                detalle.filter(
                    (x) =>
                        x.estado ===
                        "justificado"
                ).length
        };

        const totalMinutos =
            detalle.reduce(
                (
                    acumulado,
                    fila
                ) =>
                    acumulado +
                    Number(
                        fila.minutos_trabajados ||
                        0
                    ),
                0
            );

        resumen.minutos_trabajados =
            totalMinutos;

        resumen.tiempo_trabajado =
            formatearMinutos(
                totalMinutos
            );

        return {
            periodo: {
                fecha_desde:
                    obtenerFechaISO(
                        filtros.fecha_desde
                    ),

                fecha_hasta:
                    obtenerFechaISO(
                        filtros.fecha_hasta
                    )
            },

            resumen,

            detalle
        };
    };


/* =====================================================
   REPORTE SEMANAL
===================================================== */

const obtenerReporteSemanal =
    async (
        filtros
    ) => {
        const reporte =
            await obtenerReportePeriodo(
                {
                    empleado_id:
                        filtros.empleado_id,

                    obra_id:
                        filtros.obra_id,

                    fecha_desde:
                        filtros.fecha_inicio,

                    fecha_hasta:
                        filtros.fecha_fin
                }
            );

        return {
            tipo:
                "semanal",

            periodo:
                reporte.periodo,

            resumen:
                reporte.resumen,

            detalle:
                reporte.detalle
        };
    };


/* =====================================================
   EXPORTACIONES
===================================================== */

module.exports = {
    registrarEntrada,
    registrarSalida,
    registrarNovedad,

    registrarMarcacionIntegracion,

    listarAsistencias,
    obtenerAsistenciaPorId,

    actualizarAsistencia,
    corregirMarcacion,

    obtenerReporteSemanal,
    obtenerReportePeriodo
};