const { pool } = require("../../config/db");

/* =====================================================
   CONSTANTES
===================================================== */

const ESTADOS_JORNADA = [
    "trabajado",
    "no_laborable",
    "suspendido",
    "cancelado",
];

/* =====================================================
   UTILIDADES
===================================================== */

const convertirNumero = (valor, campo) => {
    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        throw new Error(`${campo} es obligatorio`);
    }

    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        throw new Error(`${campo} no es válido`);
    }

    return numero;
};

const redondearDinero = (valor) => {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        throw new Error("El importe no es válido");
    }

    return Math.round((numero + Number.EPSILON) * 100) / 100;
};

const normalizarFecha = (valor) => {
    if (!valor) return null;

    if (valor instanceof Date) {
        if (Number.isNaN(valor.getTime())) {
            return null;
        }

        return valor.toISOString().slice(0, 10);
    }

    const texto = String(valor);
    const fecha = texto.slice(0, 10);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return null;
    }

    const fechaUTC = new Date(`${fecha}T00:00:00.000Z`);

    if (
        Number.isNaN(fechaUTC.getTime()) ||
        fechaUTC.toISOString().slice(0, 10) !== fecha
    ) {
        return null;
    }

    return fecha;
};

const validarFechaContrato = (
    fecha,
    fechaInicio,
    fechaFin
) => {
    const jornada = normalizarFecha(fecha);
    const inicio = normalizarFecha(fechaInicio);
    const fin = normalizarFecha(fechaFin);

    if (!jornada || !inicio || !fin) {
        throw new Error(
            "No fue posible validar las fechas del contrato"
        );
    }

    if (jornada < inicio || jornada > fin) {
        throw new Error(
            `La fecha de la jornada debe estar entre ${inicio} y ${fin}`
        );
    }

    return jornada;
};

const validarContratoActivo = (estado) => {
    if (estado !== "activo") {
        throw new Error(
            "Solo se pueden registrar o modificar jornadas de contratos activos"
        );
    }
};

/* =====================================================
   CALCULAR JORNADA
===================================================== */

const calcularJornada = ({
    estado,
    cantidadEfectiva,
    cantidadContratada,
    precioDiario,
    cobrable,
}) => {
    if (!ESTADOS_JORNADA.includes(estado)) {
        throw new Error(
            "El estado de la jornada no es válido"
        );
    }

    const cantidad = convertirNumero(
        cantidadEfectiva,
        "La cantidad efectiva"
    );

    const cantidadMaxima = convertirNumero(
        cantidadContratada,
        "La cantidad contratada"
    );

    const precio = convertirNumero(
        precioDiario,
        "El precio diario"
    );

    if (
        !Number.isInteger(cantidad) ||
        cantidad < 0
    ) {
        throw new Error(
            "La cantidad efectiva debe ser un entero mayor o igual a cero"
        );
    }

    if (
        !Number.isInteger(cantidadMaxima) ||
        cantidadMaxima <= 0
    ) {
        throw new Error(
            "La cantidad contratada no es válida"
        );
    }

    if (cantidad > cantidadMaxima) {
        throw new Error(
            `La cantidad efectiva no puede superar la cantidad contratada (${cantidadMaxima})`
        );
    }

    if (precio < 0) {
        throw new Error(
            "El precio diario no puede ser negativo"
        );
    }

    if (estado === "trabajado" && cantidad === 0) {
        throw new Error(
            "Una jornada trabajada debe tener una cantidad efectiva mayor que cero"
        );
    }

    if (
        estado !== "trabajado" &&
        cantidad !== 0
    ) {
        throw new Error(
            `Una jornada ${estado} debe tener cantidad efectiva igual a cero`
        );
    }

    /*
     * Regla actual:
     *
     * - Trabajado: cobrable por defecto.
     * - Otros estados: no cobrables.
     *
     * Se conserva la posibilidad existente de registrar
     * un día trabajado no cobrable, si se indica
     * explícitamente cobrable = false.
     *
     * Nunca se permite cobrar un día no trabajado.
     */

    const esCobrable =
        estado === "trabajado"
            ? cobrable === undefined
                ? true
                : cobrable
            : false;

    if (typeof esCobrable !== "boolean") {
        throw new Error(
            "El campo cobrable debe ser verdadero o falso"
        );
    }

    if (
        estado !== "trabajado" &&
        cobrable === true
    ) {
        throw new Error(
            "Una jornada no trabajada no puede ser cobrable"
        );
    }

    const totalDia = esCobrable
        ? redondearDinero(cantidad * precio)
        : 0;

    return {
        cantidadEfectiva: cantidad,
        precioDiario: precio,
        cobrable: esCobrable,
        totalDia,
    };
};

/* =====================================================
   OBTENER DETALLE DEL CONTRATO
===================================================== */

const obtenerDetalleContrato = async (
    detalleContratoId,
    db = pool
) => {
    const result = await db.query(
        `
        SELECT
            dc.id AS detalle_contrato_id,
            dc.contrato_id,
            dc.activo_id,
            dc.cantidad AS cantidad_contratada,
            dc.precio_diario,
            dc.subtotal AS subtotal_previsto,

            ca.numero_contrato,
            ca.fecha_inicio,
            ca.fecha_fin,
            ca.estado AS estado_contrato,
            ca.total AS total_previsto,

            a.codigo AS activo_codigo,
            a.nombre AS activo_nombre

        FROM detalles_contrato dc

        INNER JOIN contratos_alquiler ca
            ON ca.id = dc.contrato_id

        INNER JOIN activos a
            ON a.id = dc.activo_id

        WHERE dc.id = $1
        `,
        [detalleContratoId]
    );

    if (result.rows.length === 0) {
        throw new Error(
            "El detalle del contrato no existe"
        );
    }

    return result.rows[0];
};

/* =====================================================
   REGISTRAR JORNADA
===================================================== */

const registrarJornada = async (
    data,
    usuarioRegistroId = null
) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const detalle = await obtenerDetalleContrato(
            data.detalle_contrato_id,
            client
        );

        /*
         * Bloquear el contrato durante el registro.
         * Evita cambios simultáneos de estado mientras
         * se registra la jornada.
         */

        const contratoResult = await client.query(
            `
            SELECT estado
            FROM contratos_alquiler
            WHERE id = $1
            FOR UPDATE
            `,
            [detalle.contrato_id]
        );

        if (contratoResult.rows.length === 0) {
            throw new Error("Contrato no encontrado");
        }

        validarContratoActivo(
            contratoResult.rows[0].estado
        );

        const fecha = validarFechaContrato(
            data.fecha,
            detalle.fecha_inicio,
            detalle.fecha_fin
        );

        const existente = await client.query(
            `
            SELECT id
            FROM jornadas_alquiler
            WHERE detalle_contrato_id = $1
              AND fecha = $2
            `,
            [
                data.detalle_contrato_id,
                fecha,
            ]
        );

        if (existente.rows.length > 0) {
            throw new Error(
                "Ya existe una jornada registrada para este activo en la fecha seleccionada"
            );
        }

        const calculo = calcularJornada({
            estado: data.estado,
            cantidadEfectiva: data.cantidad_efectiva,
            cantidadContratada:
                detalle.cantidad_contratada,
            precioDiario: detalle.precio_diario,
            cobrable: data.cobrable,
        });

        const result = await client.query(
            `
            INSERT INTO jornadas_alquiler (
                detalle_contrato_id,
                fecha,
                estado,
                cantidad_efectiva,
                precio_diario,
                cobrable,
                total_dia,
                motivo,
                observaciones,
                usuario_registro_id
            )
            VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10
            )
            RETURNING *
            `,
            [
                data.detalle_contrato_id,
                fecha,
                data.estado,
                calculo.cantidadEfectiva,
                calculo.precioDiario,
                calculo.cobrable,
                calculo.totalDia,
                data.motivo || null,
                data.observaciones || null,
                usuarioRegistroId || null,
            ]
        );

        await client.query("COMMIT");

        return {
            ...result.rows[0],

            activo: {
                id: detalle.activo_id,
                codigo: detalle.activo_codigo,
                nombre: detalle.activo_nombre,
            },

            contrato: {
                id: detalle.contrato_id,
                numero_contrato:
                    detalle.numero_contrato,
            },
        };
    } catch (error) {
        await client.query("ROLLBACK");

        if (error.code === "23505") {
            throw new Error(
                "Ya existe una jornada registrada para este activo en la fecha seleccionada"
            );
        }

        throw error;
    } finally {
        client.release();
    }
};

/* =====================================================
   LISTAR JORNADAS POR CONTRATO
===================================================== */

const listarJornadasPorContrato = async (
    contratoId
) => {
    const contratoResult = await pool.query(
        `
        SELECT
            id,
            numero_contrato,
            fecha_inicio,
            fecha_fin,
            estado,
            total,
            pagado,
            saldo_pendiente
        FROM contratos_alquiler
        WHERE id = $1
        `,
        [contratoId]
    );

    if (contratoResult.rows.length === 0) {
        throw new Error("Contrato no encontrado");
    }

    const contrato = contratoResult.rows[0];

    const jornadasResult = await pool.query(
        `
        SELECT
            ja.id,
            ja.detalle_contrato_id,

            dc.activo_id,
            a.codigo AS activo_codigo,
            a.nombre AS activo_nombre,

            dc.cantidad AS cantidad_contratada,
            dc.precio_diario AS precio_contratado,

            ja.fecha,
            ja.estado,
            ja.cantidad_efectiva,
            ja.precio_diario,
            ja.cobrable,
            ja.total_dia,
            ja.motivo,
            ja.observaciones,
            ja.usuario_registro_id,
            ja.fecha_creacion,
            ja.fecha_actualizacion

        FROM jornadas_alquiler ja

        INNER JOIN detalles_contrato dc
            ON dc.id = ja.detalle_contrato_id

        INNER JOIN activos a
            ON a.id = dc.activo_id

        WHERE dc.contrato_id = $1

        ORDER BY
            ja.fecha ASC,
            a.nombre ASC
        `,
        [contratoId]
    );

    const resumenResult = await pool.query(
        `
        SELECT
            COUNT(*)::integer
                AS jornadas_registradas,

            COUNT(*) FILTER (
                WHERE ja.estado = 'trabajado'
            )::integer
                AS jornadas_trabajadas,

            COUNT(*) FILTER (
                WHERE ja.estado = 'no_laborable'
            )::integer
                AS jornadas_no_laborables,

            COUNT(*) FILTER (
                WHERE ja.estado = 'suspendido'
            )::integer
                AS jornadas_suspendidas,

            COUNT(*) FILTER (
                WHERE ja.estado = 'cancelado'
            )::integer
                AS jornadas_canceladas,

            COUNT(*) FILTER (
                WHERE ja.cobrable = TRUE
            )::integer
                AS jornadas_cobrables,

            COALESCE(
                SUM(ja.total_dia),
                0
            ) AS total_efectivo

        FROM jornadas_alquiler ja

        INNER JOIN detalles_contrato dc
            ON dc.id = ja.detalle_contrato_id

        WHERE dc.contrato_id = $1
        `,
        [contratoId]
    );

    const estadisticas = resumenResult.rows[0];

    const totalPrevisto = redondearDinero(
        contrato.total || 0
    );

    const totalEfectivo = redondearDinero(
        estadisticas.total_efectivo || 0
    );

    /*
     * Se conserva contrato.pagado como fuente actual
     * del acumulado financiero.
     *
     * No se modifica el registro de pagos.
     */

    const pagado = redondearDinero(
        contrato.pagado || 0
    );

    const diferenciaPago = redondearDinero(
        totalEfectivo - pagado
    );

    return {
        contrato: {
            id: contrato.id,
            numero_contrato:
                contrato.numero_contrato,
            fecha_inicio:
                contrato.fecha_inicio,
            fecha_fin:
                contrato.fecha_fin,
            estado:
                contrato.estado,

            total_previsto:
                totalPrevisto,

            pagado,

            saldo_pendiente_actual:
                redondearDinero(
                    contrato.saldo_pendiente || 0
                ),
        },

        resumen: {
            jornadas_registradas:
                Number(
                    estadisticas.jornadas_registradas || 0
                ),

            jornadas_trabajadas:
                Number(
                    estadisticas.jornadas_trabajadas || 0
                ),

            jornadas_no_laborables:
                Number(
                    estadisticas.jornadas_no_laborables || 0
                ),

            jornadas_suspendidas:
                Number(
                    estadisticas.jornadas_suspendidas || 0
                ),

            jornadas_canceladas:
                Number(
                    estadisticas.jornadas_canceladas || 0
                ),

            jornadas_cobrables:
                Number(
                    estadisticas.jornadas_cobrables || 0
                ),

            total_previsto:
                totalPrevisto,

            total_efectivo:
                totalEfectivo,

            pagado,

            diferencia_pago:
                diferenciaPago,

            saldo_efectivo_pendiente:
                Math.max(diferenciaPago, 0),

            saldo_a_favor_cliente:
                Math.max(-diferenciaPago, 0),
        },

        jornadas: jornadasResult.rows,
    };
};

/* =====================================================
   LISTAR JORNADAS POR DETALLE
===================================================== */

const listarJornadasPorDetalle = async (
    detalleContratoId
) => {
    const detalle = await obtenerDetalleContrato(
        detalleContratoId
    );

    const result = await pool.query(
        `
        SELECT
            ja.id,
            ja.detalle_contrato_id,
            ja.fecha,
            ja.estado,
            ja.cantidad_efectiva,
            ja.precio_diario,
            ja.cobrable,
            ja.total_dia,
            ja.motivo,
            ja.observaciones,
            ja.usuario_registro_id,
            ja.fecha_creacion,
            ja.fecha_actualizacion

        FROM jornadas_alquiler ja

        WHERE ja.detalle_contrato_id = $1

        ORDER BY ja.fecha ASC
        `,
        [detalleContratoId]
    );

    const totalEfectivo = result.rows.reduce(
        (acumulado, jornada) =>
            acumulado +
            Number(jornada.total_dia || 0),
        0
    );

    return {
        detalle: {
            id:
                detalle.detalle_contrato_id,

            contrato_id:
                detalle.contrato_id,

            numero_contrato:
                detalle.numero_contrato,

            activo_id:
                detalle.activo_id,

            activo_codigo:
                detalle.activo_codigo,

            activo_nombre:
                detalle.activo_nombre,

            cantidad_contratada:
                Number(
                    detalle.cantidad_contratada
                ),

            precio_diario:
                redondearDinero(
                    detalle.precio_diario
                ),

            subtotal_previsto:
                redondearDinero(
                    detalle.subtotal_previsto
                ),
        },

        total_efectivo:
            redondearDinero(totalEfectivo),

        jornadas: result.rows,
    };
};

/* =====================================================
   OBTENER JORNADA POR ID
===================================================== */

const obtenerJornadaPorId = async (id) => {
    const result = await pool.query(
        `
        SELECT
            ja.id,
            ja.detalle_contrato_id,

            dc.contrato_id,

            ca.numero_contrato,
            ca.fecha_inicio,
            ca.fecha_fin,
            ca.estado AS estado_contrato,

            dc.activo_id,
            a.codigo AS activo_codigo,
            a.nombre AS activo_nombre,

            dc.cantidad AS cantidad_contratada,
            dc.precio_diario AS precio_contratado,

            ja.fecha,
            ja.estado,
            ja.cantidad_efectiva,
            ja.precio_diario,
            ja.cobrable,
            ja.total_dia,
            ja.motivo,
            ja.observaciones,
            ja.usuario_registro_id,
            ja.fecha_creacion,
            ja.fecha_actualizacion

        FROM jornadas_alquiler ja

        INNER JOIN detalles_contrato dc
            ON dc.id = ja.detalle_contrato_id

        INNER JOIN contratos_alquiler ca
            ON ca.id = dc.contrato_id

        INNER JOIN activos a
            ON a.id = dc.activo_id

        WHERE ja.id = $1
        `,
        [id]
    );

    if (result.rows.length === 0) {
        throw new Error(
            "Jornada de alquiler no encontrada"
        );
    }

    return result.rows[0];
};

/* =====================================================
   ACTUALIZAR JORNADA
===================================================== */

const actualizarJornada = async (
    id,
    data
) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        /*
         * Primero obtenemos el contrato asociado.
         * Después bloqueamos el contrato y la jornada
         * para mantener un orden consistente de bloqueos.
         */

        const referenciaResult = await client.query(
            `
            SELECT dc.contrato_id
            FROM jornadas_alquiler ja

            INNER JOIN detalles_contrato dc
                ON dc.id = ja.detalle_contrato_id

            WHERE ja.id = $1
            `,
            [id]
        );

        if (referenciaResult.rows.length === 0) {
            throw new Error(
                "Jornada de alquiler no encontrada"
            );
        }

        const contratoId =
            referenciaResult.rows[0].contrato_id;

        const contratoResult = await client.query(
            `
            SELECT
                id,
                estado,
                fecha_inicio,
                fecha_fin

            FROM contratos_alquiler

            WHERE id = $1

            FOR UPDATE
            `,
            [contratoId]
        );

        if (contratoResult.rows.length === 0) {
            throw new Error(
                "Contrato no encontrado"
            );
        }

        validarContratoActivo(
            contratoResult.rows[0].estado
        );

        const jornadaResult = await client.query(
            `
            SELECT
                ja.id,
                ja.detalle_contrato_id,
                ja.fecha,
                ja.estado,
                ja.cantidad_efectiva,

                ja.precio_diario AS precio_historico,

                ja.cobrable,
                ja.motivo,
                ja.observaciones,

                dc.cantidad AS cantidad_contratada

            FROM jornadas_alquiler ja

            INNER JOIN detalles_contrato dc
                ON dc.id = ja.detalle_contrato_id

            WHERE ja.id = $1

            FOR UPDATE OF ja
            `,
            [id]
        );

        if (jornadaResult.rows.length === 0) {
            throw new Error(
                "Jornada de alquiler no encontrada"
            );
        }

        const actual = jornadaResult.rows[0];
        const contrato = contratoResult.rows[0];

        const fecha = validarFechaContrato(
            data.fecha !== undefined
                ? data.fecha
                : actual.fecha,
            contrato.fecha_inicio,
            contrato.fecha_fin
        );

        const estado =
            data.estado !== undefined
                ? data.estado
                : actual.estado;

        /*
         * Si se cambia de trabajado a otro estado,
         * la cantidad pasa automáticamente a cero,
         * salvo que el usuario haya enviado una
         * cantidad explícita.
         *
         * Si se cambia de otro estado a trabajado,
         * se debe indicar una cantidad válida.
         */

        let cantidad;

        if (data.cantidad_efectiva !== undefined) {
            cantidad = data.cantidad_efectiva;
        } else if (estado !== "trabajado") {
            cantidad = 0;
        } else {
            cantidad = actual.cantidad_efectiva;
        }

        /*
         * Al cambiar el estado, se recalcula cobrable.
         * Si no cambia, se conserva el valor existente.
         *
         * Esto evita conservar accidentalmente
         * cobrable=false al pasar de suspendido
         * a trabajado.
         */

        let cobrable;

        if (data.cobrable !== undefined) {
            cobrable = data.cobrable;
        } else if (estado !== actual.estado) {
            cobrable = estado === "trabajado";
        } else {
            cobrable = actual.cobrable;
        }

        const duplicado = await client.query(
            `
            SELECT id
            FROM jornadas_alquiler

            WHERE detalle_contrato_id = $1
              AND fecha = $2
              AND id <> $3
            `,
            [
                actual.detalle_contrato_id,
                fecha,
                id,
            ]
        );

        if (duplicado.rows.length > 0) {
            throw new Error(
                "Ya existe una jornada registrada para este activo en la fecha seleccionada"
            );
        }

        /*
         * Se utiliza el precio almacenado en la
         * jornada, NO el precio actual del detalle.
         *
         * Esto conserva la tarifa histórica.
         */

        const calculo = calcularJornada({
            estado,
            cantidadEfectiva: cantidad,
            cantidadContratada:
                actual.cantidad_contratada,
            precioDiario:
                actual.precio_historico,
            cobrable,
        });

        const result = await client.query(
            `
            UPDATE jornadas_alquiler

            SET
                fecha = $2,
                estado = $3,
                cantidad_efectiva = $4,
                precio_diario = $5,
                cobrable = $6,
                total_dia = $7,
                motivo = $8,
                observaciones = $9,
                fecha_actualizacion = NOW()

            WHERE id = $1

            RETURNING *
            `,
            [
                id,
                fecha,
                estado,
                calculo.cantidadEfectiva,
                calculo.precioDiario,
                calculo.cobrable,
                calculo.totalDia,

                data.motivo !== undefined
                    ? data.motivo || null
                    : actual.motivo,

                data.observaciones !== undefined
                    ? data.observaciones || null
                    : actual.observaciones,
            ]
        );

        await client.query("COMMIT");

        return result.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");

        if (error.code === "23505") {
            throw new Error(
                "Ya existe una jornada registrada para este activo en la fecha seleccionada"
            );
        }

        throw error;
    } finally {
        client.release();
    }
};

/* =====================================================
   ELIMINAR JORNADA
===================================================== */

/*
 * Se conserva la función exportada para no romper
 * los controladores y las rutas existentes.
 *
 * Sin embargo, se deshabilita el DELETE físico.
 *
 * Motivo:
 * eliminar una jornada puede cambiar el valor
 * efectivo de un contrato y destruir evidencia
 * de los días utilizados.
 *
 * Las correcciones deben hacerse mediante edición.
 *
 * Una futura anulación administrativa deberá
 * guardar usuario, fecha, motivo y valores anteriores.
 */

const eliminarJornada = async (id) => {
    const result = await pool.query(
        `
        SELECT id
        FROM jornadas_alquiler
        WHERE id = $1
        `,
        [id]
    );

    if (result.rows.length === 0) {
        throw new Error(
            "Jornada de alquiler no encontrada"
        );
    }

    throw new Error(
        "La eliminación definitiva de jornadas está deshabilitada para proteger el historial. Utilice la edición o un procedimiento de anulación administrativa."
    );
};

/* =====================================================
   RESUMEN EFECTIVO DEL CONTRATO
===================================================== */

const obtenerResumenContrato = async (
    contratoId
) => {
    const resultado =
        await listarJornadasPorContrato(
            contratoId
        );

    return {
        contrato: resultado.contrato,
        resumen: resultado.resumen,
    };
};

/* =====================================================
   EXPORTACIONES
===================================================== */

module.exports = {
    registrarJornada,
    listarJornadasPorContrato,
    listarJornadasPorDetalle,
    obtenerJornadaPorId,
    actualizarJornada,
    eliminarJornada,
    obtenerResumenContrato,
};