const { pool } = require("../../../config/db");

const generarCodigoActivo = async (categoria_id) => {

    const categoria = await pool.query(
        `SELECT tipo FROM categorias WHERE id = $1`,
        [categoria_id]
    );

    const tipo = categoria.rows[0].tipo;

    let prefijo = "";

    if (tipo === "equipo") prefijo = "EQ";
    if (tipo === "herramienta") prefijo = "HR";
    if (tipo === "encofrado") prefijo = "EN";

    const ultimo = await pool.query(
        `SELECT codigo 
         FROM activos
         WHERE codigo LIKE $1
         ORDER BY codigo DESC
         LIMIT 1`,
        [`${prefijo}-%`]
    );

    let numero = 1;

    if (ultimo.rows.length > 0) {

        const ultimoCodigo = ultimo.rows[0].codigo;
        numero = parseInt(ultimoCodigo.split("-")[1]) + 1;

    }

    return `${prefijo}-${String(numero).padStart(4, "0")}`;
};

const crearActivo = async (data) => {

    const codigo = await generarCodigoActivo(data.categoria_id);

    const result = await pool.query(
        `INSERT INTO activos
        (codigo,nombre,descripcion,categoria_id,ubicacion_id,estado,tipo_control,cantidad_total,valor_reposicion)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING *`,
        [
            codigo,
            data.nombre,
            data.descripcion,
            data.categoria_id,
            data.ubicacion_id,
            data.estado,
            data.tipo_control,
            data.cantidad_total,
            data.valor_reposicion
        ]
    );

    return result.rows[0];
};

const listarActivos = async () => {

    const result = await pool.query(
        `SELECT 
            a.*,
            c.nombre as categoria,
            u.nombre as ubicacion
        FROM activos a
        JOIN categorias c ON a.categoria_id = c.id
        JOIN ubicaciones u ON a.ubicacion_id = u.id
        ORDER BY a.fecha_creacion DESC`
    );

    return result.rows;
};

module.exports = {
    crearActivo,
    listarActivos
};