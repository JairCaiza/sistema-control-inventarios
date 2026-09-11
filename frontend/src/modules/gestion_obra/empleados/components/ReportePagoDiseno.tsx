import { forwardRef } from "react";

import logoGuaraca from "../../../../assets/logoguaraca.png";

/* =====================================================
   TYPES
===================================================== */

export interface ReportePagoEmpleadoData {
  numero_comprobante: string;

  fecha_emision: string;

  estado: string;

  empresa: {
    nombre: string;
    ruc?: string;
    direccion_matriz?: string;
    direccion_sucursal?: string;
    telefono?: string;
    correo?: string;
    obligado_contabilidad?: string;
  };

  empleado: {
    nombres: string;
    apellidos: string;
    cedula: string;
    cargo?: string;
  };

  obra?: {
    codigo?: string;
    nombre?: string;
  } | null;

  periodo: {
    descripcion: string;
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
  };

  pago: {
    tipo_pago: string;

    monto: number | string;

    metodo_pago?: string | null;

    cuenta_nombre?: string | null;

    referencia?: string | null;

    observaciones?: string | null;

    transaccion_id?: string | null;
  };
}

interface ReportePagoDisenoProps {
  data: ReportePagoEmpleadoData;

  /*
   * En vista previa podemos reducir visualmente
   * la hoja sin alterar su tamaño real A4.
   */
  className?: string;
}

/* =====================================================
   HELPERS
===================================================== */

const numero = (value: number | string | null | undefined): number => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

const moneda = (value: number | string | null | undefined): string => {
  return numero(value).toLocaleString("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const fecha = (value: string | null | undefined): string => {
  if (!value) {
    return "-";
  }

  const raw = value.includes("T") ? value.split("T")[0] : value;

  const partes = raw.split("-");

  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  return value;
};

const capitalizar = (value: string | null | undefined): string => {
  if (!value) {
    return "-";
  }

  const texto = value.replace(/_/g, " ").trim();

  if (!texto) {
    return "-";
  }

  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

const textoSeguro = (value: string | null | undefined): string => {
  if (!value || !value.trim()) {
    return "-";
  }

  return value.trim();
};

/* =====================================================
   COMPONENTE
===================================================== */

const ReportePagoDiseno = forwardRef<HTMLDivElement, ReportePagoDisenoProps>(
  ({ data, className = "" }, ref) => {
    const nombreEmpleado = [data.empleado.nombres, data.empleado.apellidos]
      .filter(Boolean)
      .join(" ")
      .trim();

    const monto = numero(data.pago.monto);

    const estado = data.estado?.toLowerCase() || "pagado";

    const esAnulado = estado === "anulado";

    return (
      <div
        ref={ref}
        className={`reporte-pago-a4 bg-white text-black ${className}`}
        style={{
          width: "210mm",
          minHeight: "297mm",
          boxSizing: "border-box",
          padding: "10mm",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "10px",
          lineHeight: 1.35,
          position: "relative",
        }}
      >
        {/* =================================================
          ENCABEZADO
      ================================================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "46% 54%",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          {/* ===============================================
            EMPRESA
        =============================================== */}

          <div
            style={{
              border: "1px solid #111",
              padding: "8px",
              minHeight: "112px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "6px",
              }}
            >
              <img
                src={logoGuaraca}
                alt="ConstructSys - Hnos Guaracas"
                style={{
                  width: "72px",
                  height: "72px",
                  objectFit: "contain",
                }}
              />
            </div>

            <div
              style={{
                textAlign: "center",
                fontWeight: 700,
                fontSize: "12px",
                marginBottom: "7px",
              }}
            >
              {data.empresa.nombre}
            </div>

            <div
              style={{
                fontSize: "8.5px",
                lineHeight: 1.45,
              }}
            >
              {data.empresa.ruc && (
                <div>
                  <strong>RUC:</strong> {data.empresa.ruc}
                </div>
              )}

              <div>
                <strong>Dirección Matriz:</strong>{" "}
                {textoSeguro(data.empresa.direccion_matriz)}
              </div>

              {data.empresa.direccion_sucursal && (
                <div>
                  <strong>Dirección Sucursal:</strong>{" "}
                  {data.empresa.direccion_sucursal}
                </div>
              )}

              {data.empresa.telefono && (
                <div>
                  <strong>Teléfono:</strong> {data.empresa.telefono}
                </div>
              )}

              {data.empresa.correo && (
                <div>
                  <strong>Correo:</strong> {data.empresa.correo}
                </div>
              )}

              <div>
                <strong>Obligado a llevar contabilidad:</strong>{" "}
                {textoSeguro(data.empresa.obligado_contabilidad)}
              </div>
            </div>
          </div>

          {/* ===============================================
            INFORMACIÓN COMPROBANTE
        =============================================== */}

          <div
            style={{
              border: "1px solid #111",
              padding: "8px",
              minHeight: "112px",
            }}
          >
            <div
              style={{
                fontSize: "8px",
                fontWeight: 700,
                marginBottom: "2px",
              }}
            >
              RUC:
            </div>

            <div
              style={{
                fontSize: "9px",
                marginBottom: "5px",
              }}
            >
              {textoSeguro(data.empresa.ruc)}
            </div>

            <div
              style={{
                fontSize: "15px",
                fontWeight: 800,
                lineHeight: 1.05,
                marginBottom: "7px",
              }}
            >
              COMPROBANTE DE PAGO
              <br />A EMPLEADO
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "95px 1fr",
                rowGap: "3px",
                fontSize: "8.5px",
              }}
            >
              <strong>N.º:</strong>

              <span>{data.numero_comprobante}</span>

              <strong>FECHA EMISIÓN:</strong>

              <span>{fecha(data.fecha_emision)}</span>

              <strong>ESTADO:</strong>

              <span
                style={{
                  fontWeight: 700,
                }}
              >
                {capitalizar(data.estado)}
              </span>

              <strong>TIPO DE PAGO:</strong>

              <span>{capitalizar(data.pago.tipo_pago)}</span>

              <strong>CUENTA:</strong>

              <span>{textoSeguro(data.pago.cuenta_nombre)}</span>

              <strong>REFERENCIA:</strong>

              <span>{textoSeguro(data.pago.referencia)}</span>

              <strong>TRANSACCIÓN:</strong>

              <span
                style={{
                  wordBreak: "break-all",
                }}
              >
                {textoSeguro(data.pago.transaccion_id)}
              </span>
            </div>

            {/* CÓDIGO VISUAL */}

            <div
              style={{
                marginTop: "8px",
                border: "1px solid #111",
                height: "34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                position: "relative",
                background:
                  "repeating-linear-gradient(90deg,#111 0px,#111 2px,#fff 2px,#fff 4px,#111 4px,#111 5px,#fff 5px,#fff 8px)",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  bottom: "1px",
                  background: "#fff",
                  padding: "0 4px",
                  fontSize: "6px",
                  fontWeight: 700,
                }}
              >
                {data.numero_comprobante}
              </span>
            </div>
          </div>
        </div>

        {/* =================================================
          DATOS EMPLEADO / PAGO
      ================================================= */}

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "8px",
            fontSize: "8.5px",
          }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  border: "1px solid #111",
                  padding: "4px",
                  width: "16%",
                  fontWeight: 700,
                }}
              >
                EMPLEADO:
              </td>

              <td
                style={{
                  border: "1px solid #111",
                  padding: "4px",
                  width: "34%",
                }}
              >
                {textoSeguro(nombreEmpleado)}
              </td>

              <td
                style={{
                  border: "1px solid #111",
                  padding: "4px",
                  width: "16%",
                  fontWeight: 700,
                }}
              >
                PERÍODO PAGADO:
              </td>

              <td
                style={{
                  border: "1px solid #111",
                  padding: "4px",
                }}
              >
                {textoSeguro(data.periodo.descripcion)}
              </td>
            </tr>

            <tr>
              <td
                style={{
                  border: "1px solid #111",
                  padding: "4px",
                  fontWeight: 700,
                }}
              >
                CÉDULA:
              </td>

              <td
                style={{
                  border: "1px solid #111",
                  padding: "4px",
                }}
              >
                {textoSeguro(data.empleado.cedula)}
              </td>

              <td
                style={{
                  border: "1px solid #111",
                  padding: "4px",
                  fontWeight: 700,
                }}
              >
                FECHA INICIO:
              </td>

              <td
                style={{
                  border: "1px solid #111",
                  padding: "4px",
                }}
              >
                {fecha(data.periodo.fecha_inicio)}
              </td>
            </tr>

            <tr>
              <td
                style={{
                  border: "1px solid #111",
                  padding: "4px",
                  fontWeight: 700,
                }}
              >
                CARGO:
              </td>

              <td
                style={{
                  border: "1px solid #111",
                  padding: "4px",
                }}
              >
                {textoSeguro(data.empleado.cargo)}
              </td>

              <td
                style={{
                  border: "1px solid #111",
                  padding: "4px",
                  fontWeight: 700,
                }}
              >
                FECHA FIN:
              </td>

              <td
                style={{
                  border: "1px solid #111",
                  padding: "4px",
                }}
              >
                {fecha(data.periodo.fecha_fin)}
              </td>
            </tr>

            <tr>
              <td
                style={{
                  border: "1px solid #111",
                  padding: "4px",
                  fontWeight: 700,
                }}
              >
                OBRA:
              </td>

              <td
                style={{
                  border: "1px solid #111",
                  padding: "4px",
                }}
              >
                {data.obra
                  ? `${textoSeguro(data.obra.codigo)} - ${textoSeguro(
                      data.obra.nombre,
                    )}`
                  : "No vinculado a obra"}
              </td>

              <td
                style={{
                  border: "1px solid #111",
                  padding: "4px",
                  fontWeight: 700,
                }}
              >
                FORMA DE PAGO:
              </td>

              <td
                style={{
                  border: "1px solid #111",
                  padding: "4px",
                }}
              >
                {capitalizar(data.pago.metodo_pago)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* =================================================
          DETALLE
      ================================================= */}

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "8px",
            fontSize: "8.5px",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  border: "1px solid #111",
                  padding: "5px",
                  width: "28%",
                }}
              >
                DESCRIPCIÓN
              </th>

              <th
                style={{
                  border: "1px solid #111",
                  padding: "5px",
                }}
              >
                DETALLE
              </th>

              <th
                style={{
                  border: "1px solid #111",
                  padding: "5px",
                  width: "20%",
                }}
              >
                VALOR
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td
                style={{
                  border: "1px solid #111",
                  padding: "6px",
                }}
              >
                Pago de empleado
              </td>

              <td
                style={{
                  border: "1px solid #111",
                  padding: "6px",
                }}
              >
                {data.periodo.descripcion}

                {data.obra?.nombre
                  ? ` correspondiente a la obra ${data.obra.nombre}`
                  : ""}
              </td>

              <td
                style={{
                  border: "1px solid #111",
                  padding: "6px",
                  textAlign: "right",
                  fontWeight: 700,
                }}
              >
                {moneda(monto)}
              </td>
            </tr>

            <tr>
              <td
                style={{
                  border: "1px solid #111",
                  padding: "8px",
                  height: "16px",
                }}
              />

              <td
                style={{
                  border: "1px solid #111",
                  padding: "8px",
                }}
              />

              <td
                style={{
                  border: "1px solid #111",
                  padding: "8px",
                }}
              />
            </tr>

            <tr>
              <td
                style={{
                  border: "1px solid #111",
                  padding: "8px",
                  height: "16px",
                }}
              />

              <td
                style={{
                  border: "1px solid #111",
                  padding: "8px",
                }}
              />

              <td
                style={{
                  border: "1px solid #111",
                  padding: "8px",
                }}
              />
            </tr>
          </tbody>

          <tfoot>
            <tr>
              <td
                colSpan={2}
                style={{
                  border: "1px solid #111",
                  padding: "6px",
                  textAlign: "right",
                  fontWeight: 800,
                }}
              >
                TOTAL PAGADO
              </td>

              <td
                style={{
                  border: "1px solid #111",
                  padding: "6px",
                  textAlign: "right",
                  fontWeight: 800,
                  fontSize: "10px",
                }}
              >
                {moneda(monto)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* =================================================
          INFORMACIÓN ADICIONAL + RESUMEN
      ================================================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "60% 40%",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              border: "1px solid #111",
              padding: "7px",
              minHeight: "72px",
            }}
          >
            <div
              style={{
                fontWeight: 800,
                marginBottom: "5px",
              }}
            >
              INFORMACIÓN ADICIONAL
            </div>

            <div>
              <strong>Observaciones:</strong>{" "}
              {textoSeguro(data.pago.observaciones)}
            </div>

            <div
              style={{
                marginTop: "4px",
              }}
            >
              <strong>Obra:</strong>{" "}
              {data.obra
                ? `${textoSeguro(data.obra.codigo)} - ${textoSeguro(
                    data.obra.nombre,
                  )}`
                : "Pago administrativo / no vinculado"}
            </div>

            {esAnulado && (
              <div
                style={{
                  marginTop: "6px",
                  padding: "5px",
                  border: "1px solid #111",
                  fontWeight: 800,
                }}
              >
                COMPROBANTE ANULADO
              </div>
            )}
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "8.5px",
            }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    border: "1px solid #111",
                    padding: "5px",
                    fontWeight: 700,
                  }}
                >
                  SUBTOTAL
                </td>

                <td
                  style={{
                    border: "1px solid #111",
                    padding: "5px",
                    textAlign: "right",
                  }}
                >
                  {moneda(monto)}
                </td>
              </tr>

              <tr>
                <td
                  style={{
                    border: "1px solid #111",
                    padding: "5px",
                    fontWeight: 700,
                  }}
                >
                  DESCUENTOS
                </td>

                <td
                  style={{
                    border: "1px solid #111",
                    padding: "5px",
                    textAlign: "right",
                  }}
                >
                  {moneda(0)}
                </td>
              </tr>

              <tr>
                <td
                  style={{
                    border: "1px solid #111",
                    padding: "5px",
                    fontWeight: 700,
                  }}
                >
                  OTROS
                </td>

                <td
                  style={{
                    border: "1px solid #111",
                    padding: "5px",
                    textAlign: "right",
                  }}
                >
                  {moneda(0)}
                </td>
              </tr>

              <tr>
                <td
                  style={{
                    border: "1px solid #111",
                    padding: "5px",
                    fontWeight: 800,
                  }}
                >
                  TOTAL
                </td>

                <td
                  style={{
                    border: "1px solid #111",
                    padding: "5px",
                    textAlign: "right",
                    fontWeight: 800,
                  }}
                >
                  {moneda(monto)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* =================================================
          FORMA DE PAGO
      ================================================= */}

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "16px",
            fontSize: "8.5px",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  border: "1px solid #111",
                  padding: "5px",
                }}
              >
                FORMA DE PAGO
              </th>

              <th
                style={{
                  border: "1px solid #111",
                  padding: "5px",
                }}
              >
                VALOR
              </th>

              <th
                style={{
                  border: "1px solid #111",
                  padding: "5px",
                }}
              >
                ESTADO
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td
                style={{
                  border: "1px solid #111",
                  padding: "6px",
                  textAlign: "center",
                }}
              >
                {capitalizar(data.pago.metodo_pago)}
              </td>

              <td
                style={{
                  border: "1px solid #111",
                  padding: "6px",
                  textAlign: "center",
                }}
              >
                {moneda(monto)}
              </td>

              <td
                style={{
                  border: "1px solid #111",
                  padding: "6px",
                  textAlign: "center",
                  fontWeight: 700,
                }}
              >
                {capitalizar(data.estado)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* =================================================
          DECLARACIÓN
      ================================================= */}

        <div
          style={{
            border: "1px solid #111",
            padding: "7px",
            marginBottom: "28px",
            fontSize: "7.5px",
            textAlign: "center",
          }}
        >
          Declaro que el valor indicado en este comprobante corresponde al pago
          recibido por el período señalado. Este documento constituye un
          respaldo interno del pago realizado por la empresa.
        </div>

        {/* =================================================
          FIRMAS
      ================================================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "55px",
            padding: "0 20px",
            marginTop: "38px",
          }}
        >
          {/* ENTREGA */}

          <div
            style={{
              textAlign: "center",
            }}
          >
            <div
              style={{
                borderTop: "1px solid #111",
                paddingTop: "5px",
                fontWeight: 800,
              }}
            >
              ENTREGUÉ CONFORME
            </div>

            <div
              style={{
                marginTop: "8px",
                textAlign: "left",
                fontSize: "8px",
              }}
            >
              <div>Nombre: ______________________</div>

              <div>C.I.: __________________________</div>

              <div>Cargo: ________________________</div>
            </div>
          </div>

          {/* RECIBE */}

          <div
            style={{
              textAlign: "center",
            }}
          >
            <div
              style={{
                borderTop: "1px solid #111",
                paddingTop: "5px",
                fontWeight: 800,
              }}
            >
              RECIBÍ CONFORME
            </div>

            <div
              style={{
                marginTop: "8px",
                textAlign: "left",
                fontSize: "8px",
              }}
            >
              <div>Nombre: {textoSeguro(nombreEmpleado)}</div>

              <div>C.I.: {textoSeguro(data.empleado.cedula)}</div>

              <div>Firma: _________________________</div>
            </div>
          </div>
        </div>

        {/* =================================================
          PIE
      ================================================= */}

        <div
          style={{
            position: "absolute",
            left: "10mm",
            right: "10mm",
            bottom: "10mm",
            borderTop: "1px solid #111",
            paddingTop: "5px",
            textAlign: "center",
            fontSize: "7px",
          }}
        >
          <strong>COMPROBANTE INTERNO DE PAGO A EMPLEADO</strong>
          <br />
          Documento generado mediante ConstructSys
          <br />
          Comprobante: {data.numero_comprobante}
        </div>
      </div>
    );
  },
);

ReportePagoDiseno.displayName = "ReportePagoDiseno";

export default ReportePagoDiseno;
