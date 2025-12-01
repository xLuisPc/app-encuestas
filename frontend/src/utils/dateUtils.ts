/**
 * Utilidades para manejo de fechas con conversión UTC <-> Hora Local
 */

/**
 * Convierte una fecha UTC (string ISO) a formato datetime-local para inputs HTML
 * @param utcDateString - Fecha en formato ISO UTC (ej: "2025-12-01T18:06:00Z")
 * @returns Fecha en formato datetime-local (ej: "2025-12-01T13:06")
 */
export function utcToLocalDateTime(utcDateString: string): string {
  if (!utcDateString) return ''
  
  const date = new Date(utcDateString)
  if (isNaN(date.getTime())) return ''
  
  // Obtener componentes de fecha en hora local
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Convierte una fecha datetime-local a formato ISO UTC para enviar al backend
 * @param localDateTimeString - Fecha en formato datetime-local (ej: "2025-12-01T13:06")
 * @returns Fecha en formato ISO UTC (ej: "2025-12-01T18:06:00Z")
 */
export function localDateTimeToUTC(localDateTimeString: string): string {
  if (!localDateTimeString) return ''
  
  // Crear fecha en hora local
  const localDate = new Date(localDateTimeString)
  if (isNaN(localDate.getTime())) return ''
  
  // Convertir a ISO string (automáticamente en UTC)
  return localDate.toISOString()
}

/**
 * Formatea una fecha UTC para mostrar en la interfaz (hora local)
 * @param utcDateString - Fecha en formato ISO UTC
 * @returns Fecha formateada en hora local (ej: "01/12/2025 13:06")
 */
export function formatLocalDateTime(utcDateString: string): string {
  if (!utcDateString) return ''
  
  const date = new Date(utcDateString)
  if (isNaN(date.getTime())) return ''
  
  return date.toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  })
}

/**
 * Formatea una fecha UTC para mostrar en mensajes de error
 * @param utcDateString - Fecha en formato ISO UTC
 * @returns Fecha formateada en hora local (ej: "01/12/2025 13:06 COT")
 */
export function formatDateTimeForError(utcDateString: string): string {
  if (!utcDateString) return ''
  
  // Limpiar la cadena de fecha si tiene espacios extra
  const cleanDateString = utcDateString.trim()
  
  try {
    const date = new Date(cleanDateString)
    if (isNaN(date.getTime())) return cleanDateString
    
    // Formatear en hora local del usuario
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  } catch (e) {
    return cleanDateString
  }
}

