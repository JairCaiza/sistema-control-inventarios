import { useEffect, useRef, useState } from "react";

import { createPortal } from "react-dom";

import { X, Printer, FileText, Maximize2, Minimize2 } from "lucide-react";

import ReportePagoDiseno, {
  type ReportePagoEmpleadoData,
} from "./ReportePagoDiseno";

/* =====================================================
   PROPS
===================================================== */

interface VistaPreviaPagoModalProps {
  isOpen: boolean;

  data: ReportePagoEmpleadoData | null;

  onClose: () => void;
}

/* =====================================================
   COMPONENT
===================================================== */

function VistaPreviaPagoModal({
  isOpen,
  data,
  onClose,
}: VistaPreviaPagoModalProps) {
  const reporteRef = useRef<HTMLDivElement | null>(null);

  const [pantallaCompleta, setPantallaCompleta] = useState(false);

  const [imprimiendo, setImprimiendo] = useState(false);

  /* ===================================================
     BLOQUEAR SCROLL DEL BODY
  =================================================== */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const overflowAnterior = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, [isOpen]);

  /* ===================================================
     ESC PARA CERRAR
  =================================================== */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  /* ===================================================
     AFTER PRINT
  =================================================== */

  useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove("imprimiendo-vista-pago");

      setImprimiendo(false);
    };

    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  /* ===================================================
     IMPRIMIR
  =================================================== */

  const handleImprimir = () => {
    if (!data || imprimiendo) {
      return;
    }

    setImprimiendo(true);

    /*
     * Esta clase permite que durante la impresión
     * desaparezca todo el ERP y quede únicamente
     * ReportePagoDiseno.
     */

    document.body.classList.add("imprimiendo-vista-pago");

    /*
     * Esperamos un momento para que React/CSS
     * terminen de actualizar el DOM.
     */

    window.setTimeout(() => {
      window.print();
    }, 150);
  };

  /* ===================================================
     CERRAR
  =================================================== */

  const handleCerrar = () => {
    if (imprimiendo) {
      return;
    }

    setPantallaCompleta(false);

    onClose();
  };

  /* ===================================================
     NO RENDER
  =================================================== */

  if (!isOpen || !data) {
    return null;
  }

  /* ===================================================
     PORTAL
  =================================================== */

  return createPortal(
    <>
      {/* =================================================
          MODAL
      ================================================= */}

      <div
        className="vista-previa-pago-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Vista previa del comprobante de pago"
      >
        <div
          className={`vista-previa-pago-modal ${
            pantallaCompleta ? "vista-previa-pago-modal-full" : ""
          }`}
        >
          {/* ===============================================
              HEADER
          =============================================== */}

          <div className="vista-previa-pago-header">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FileText size={21} />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-gray-900">
                  Vista previa del comprobante
                </h2>

                <p className="truncate text-xs text-gray-500">
                  {data.numero_comprobante}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* PANTALLA COMPLETA */}

              <button
                type="button"
                onClick={() => setPantallaCompleta((actual) => !actual)}
                title={pantallaCompleta ? "Restaurar ventana" : "Ampliar vista"}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
              >
                {pantallaCompleta ? (
                  <Minimize2 size={18} />
                ) : (
                  <Maximize2 size={18} />
                )}
              </button>

              {/* CERRAR */}

              <button
                type="button"
                onClick={handleCerrar}
                title="Cerrar"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* ===============================================
              TOOLBAR
          =============================================== */}

          <div className="vista-previa-pago-toolbar">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Comprobante de pago a empleado
              </p>

              <p className="mt-0.5 text-xs text-gray-500">
                Revise el documento antes de imprimirlo o guardarlo como PDF.
              </p>
            </div>

            <button
              type="button"
              onClick={handleImprimir}
              disabled={imprimiendo}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Printer size={17} />

              {imprimiendo ? "Preparando..." : "Imprimir / Guardar PDF"}
            </button>
          </div>

          {/* ===============================================
              ÁREA GRIS DEL VISOR
          =============================================== */}

          <div className="vista-previa-pago-documento">
            <div className="vista-previa-pago-scroll">
              {/* ===========================================
                  HOJA EN PANTALLA
              =========================================== */}

              <div className="vista-previa-pago-hoja-preview">
                <ReportePagoDiseno data={data} />
              </div>
            </div>
          </div>

          {/* ===============================================
              FOOTER
          =============================================== */}

          <div className="vista-previa-pago-footer">
            <div className="text-xs text-gray-500">
              Documento interno generado por ConstructSys.
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCerrar}
                disabled={imprimiendo}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={handleImprimir}
                disabled={imprimiendo}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Printer size={17} />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          VERSIÓN EXCLUSIVA PARA IMPRESIÓN

          Esta segunda instancia NO se ve en pantalla.

          Cuando se ejecuta window.print(), ocultamos
          absolutamente todo y dejamos únicamente esta.
      ================================================= */}

      <div ref={reporteRef} className="vista-previa-pago-print-root">
        <ReportePagoDiseno data={data} />
      </div>

      {/* =================================================
          ESTILOS
      ================================================= */}

      <style>
        {`
          /* ===============================================
             OVERLAY
          =============================================== */

          .vista-previa-pago-overlay {
            position: fixed;
            inset: 0;

            z-index: 99990;

            display: flex;
            align-items: center;
            justify-content: center;

            padding: 24px;

            background: rgba(15, 23, 42, 0.72);

            backdrop-filter: blur(3px);
          }

          /* ===============================================
             MODAL
          =============================================== */

          .vista-previa-pago-modal {
            width: min(1180px, 96vw);
            height: min(920px, 94vh);

            display: flex;
            flex-direction: column;

            overflow: hidden;

            background: #ffffff;

            border-radius: 16px;

            box-shadow:
              0 25px 50px -12px
              rgba(0, 0, 0, 0.35);
          }

          .vista-previa-pago-modal-full {
            width: 100vw;
            height: 100vh;

            max-width: none;
            max-height: none;

            border-radius: 0;
          }

          /* ===============================================
             HEADER
          =============================================== */

          .vista-previa-pago-header {
            flex: 0 0 auto;

            min-height: 64px;

            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 16px;

            padding: 10px 18px;

            border-bottom: 1px solid #e5e7eb;

            background: #ffffff;
          }

          /* ===============================================
             TOOLBAR
          =============================================== */

          .vista-previa-pago-toolbar {
            flex: 0 0 auto;

            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 16px;

            padding: 12px 18px;

            border-bottom: 1px solid #e5e7eb;

            background: #f8fafc;
          }

          /* ===============================================
             VISOR
          =============================================== */

          .vista-previa-pago-documento {
            flex: 1 1 auto;

            min-height: 0;

            overflow: hidden;

            background: #475569;
          }

          .vista-previa-pago-scroll {
            width: 100%;
            height: 100%;

            overflow: auto;

            padding: 28px;

            box-sizing: border-box;
          }

          /* ===============================================
             HOJA A4 EN VISTA PREVIA
          =============================================== */

          .vista-previa-pago-hoja-preview {
            width: 210mm;
            min-height: 297mm;

            margin: 0 auto;

            background: white;

            box-shadow:
              0 10px 30px
              rgba(0, 0, 0, 0.28);
          }

          /* ===============================================
             FOOTER
          =============================================== */

          .vista-previa-pago-footer {
            flex: 0 0 auto;

            min-height: 62px;

            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 16px;

            padding: 10px 18px;

            border-top: 1px solid #e5e7eb;

            background: #ffffff;
          }

          /* ===============================================
             ROOT EXCLUSIVO DE IMPRESIÓN

             NO SE VE EN PANTALLA.
          =============================================== */

          .vista-previa-pago-print-root {
            display: none;
          }

          /* ===============================================
             RESPONSIVE
          =============================================== */

          @media (max-width: 900px) {

            .vista-previa-pago-overlay {
              padding: 10px;
            }

            .vista-previa-pago-modal {
              width: 100%;
              height: 96vh;
            }

            .vista-previa-pago-toolbar {
              align-items: flex-start;
              flex-direction: column;
            }

            .vista-previa-pago-footer {
              align-items: stretch;
              flex-direction: column;
            }

            .vista-previa-pago-scroll {
              padding: 14px;
            }

            /*
             * La hoja conserva tamaño A4.
             * El contenedor permitirá desplazarse.
             */
          }

          /* ===============================================
             IMPRESIÓN
          =============================================== */

          @media print {

            @page {
              size: A4 portrait;
              margin: 0;
            }

            html,
            body {
              margin: 0 !important;
              padding: 0 !important;

              width: 210mm !important;
              min-width: 210mm !important;

              background: #ffffff !important;

              overflow: visible !important;

              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /*
             * Si NO estamos imprimiendo desde este modal,
             * el print-root permanece oculto.
             */

            .vista-previa-pago-print-root {
              display: none !important;
            }

            /*
             * Cuando pulsamos IMPRIMIR:
             *
             * todos los hijos directos del body
             * desaparecen excepto el documento.
             */

            body.imprimiendo-vista-pago
              > *:not(.vista-previa-pago-print-root) {
              display: none !important;
            }

            /*
             * Mostramos solamente la hoja destinada
             * a impresión.
             */

            body.imprimiendo-vista-pago
              > .vista-previa-pago-print-root {
              display: block !important;

              position: static !important;

              width: 210mm !important;
              min-height: 297mm !important;

              margin: 0 !important;
              padding: 0 !important;

              background: #ffffff !important;

              overflow: visible !important;
            }

            /*
             * El ReportePagoDiseno debe comenzar
             * exactamente en 0,0 de la página.
             */

            body.imprimiendo-vista-pago
              > .vista-previa-pago-print-root
              > .reporte-pago-a4 {
              width: 210mm !important;
              min-height: 297mm !important;

              margin: 0 !important;

              box-shadow: none !important;
            }
          }
        `}
      </style>
    </>,
    document.body,
  );
}

export default VistaPreviaPagoModal;
