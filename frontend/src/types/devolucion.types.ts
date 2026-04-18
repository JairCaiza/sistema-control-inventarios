export type Devolucion = {
  id: string;
  contrato_id: string;
  numero_contrato: string;
  cliente: string;
  fecha_devolucion: string;
  dias_retraso: number;
  penalidad_total: number;
  nota_id?: string; // opcional
};
