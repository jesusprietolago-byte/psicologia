export const translateStatus = (status: string) => {
  const statuses: Record<string, string> = {
    'SCHEDULED': 'Programada',
    'CANCELLED': 'Cancelada',
    'PENDING_CONFIRMATION': 'Pendiente de confirmar',
    'PENDING_APPROVAL': 'Pendiente de aprobación',
    'APPROVED': 'Aprobado',
    'REJECTED': 'Rechazado',
    'COMPLETED': 'Completada'
  };
  return statuses[status] || status;
};