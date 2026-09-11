/* =====================================================
   VALIDAR CÉDULA ECUATORIANA
===================================================== */

const validarCedulaEcuador = (valor) => {
    const cedula =
        String(valor || "").trim();

    if (!/^\d{10}$/.test(cedula)) {
        return false;
    }

    const provincia =
        Number(
            cedula.substring(0, 2)
        );

    /*
     * Provincias ecuatorianas.
     *
     * También dejamos 30 para identificaciones
     * especiales que pueden existir en ciertos
     * registros administrativos.
     */
    if (
        provincia < 1 ||
        (
            provincia > 24 &&
            provincia !== 30
        )
    ) {
        return false;
    }

    const tercerDigito =
        Number(cedula[2]);

    /*
     * Persona natural.
     */
    if (tercerDigito >= 6) {
        return false;
    }

    let suma = 0;

    for (
        let i = 0;
        i < 9;
        i++
    ) {
        let numero =
            Number(cedula[i]);

        if (i % 2 === 0) {
            numero *= 2;

            if (numero > 9) {
                numero -= 9;
            }
        }

        suma += numero;
    }

    const residuo =
        suma % 10;

    const digitoVerificador =
        residuo === 0
            ? 0
            : 10 - residuo;

    return (
        digitoVerificador ===
        Number(cedula[9])
    );
};

/* =====================================================
   RUC PERSONA NATURAL
===================================================== */

const validarRucPersonaNatural = (
    valor
) => {
    const ruc =
        String(valor || "").trim();

    if (!/^\d{13}$/.test(ruc)) {
        return false;
    }

    const cedula =
        ruc.substring(0, 10);

    if (
        !validarCedulaEcuador(
            cedula
        )
    ) {
        return false;
    }

    /*
     * Los últimos tres dígitos representan
     * establecimiento.
     *
     * No aceptamos 000.
     */
    const establecimiento =
        ruc.substring(10, 13);

    return (
        establecimiento !== "000"
    );
};

/* =====================================================
   VALIDAR RUC
===================================================== */

/*
 * IMPORTANTE:
 *
 * Esta función hace validación estructural.
 *
 * No demuestra que el RUC esté realmente
 * registrado y activo en el SRI.
 *
 * Además existen distintos tipos de RUC.
 */
const validarRucEcuador = (
    valor
) => {
    const ruc =
        String(valor || "").trim();

    if (!/^\d{13}$/.test(ruc)) {
        return false;
    }

    const tercerDigito =
        Number(ruc[2]);

    /*
     * Persona natural.
     */
    if (tercerDigito < 6) {
        return validarRucPersonaNatural(
            ruc
        );
    }

    /*
     * Para sociedades/entidades no vamos a
     * inventar una validación universal.
     *
     * Validamos de forma estructural:
     *
     * - 13 dígitos
     * - establecimiento distinto de 000
     */
    const establecimiento =
        ruc.substring(10, 13);

    return (
        establecimiento !== "000"
    );
};

/* =====================================================
   PASAPORTE
===================================================== */

const validarPasaporte = (
    valor
) => {
    const pasaporte =
        String(valor || "")
            .trim();

    /*
     * Validación estructural.
     *
     * Un pasaporte extranjero no puede
     * validarse oficialmente con un único
     * algoritmo local.
     */
    return /^[A-Za-z0-9-]{5,20}$/.test(
        pasaporte
    );
};

/* =====================================================
   EXPORTACIONES
===================================================== */

module.exports = {
    validarCedulaEcuador,
    validarRucPersonaNatural,
    validarRucEcuador,
    validarPasaporte
};