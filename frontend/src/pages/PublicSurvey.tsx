import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { surveysApi, Survey, Answer, Response } from '../api/surveys'
import { formatDateTimeForError } from '../utils/dateUtils'

const PublicSurvey = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState<Record<number, any>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (id) {
      loadSurvey()
    }
  }, [id])

  const loadSurvey = async () => {
    try {
      const data = await surveysApi.getPublicSurvey(id!)
      console.log('Survey loaded:', data) // Debug
      console.log('Questions:', data.questions) // Debug
      setSurvey(data)
      
      // Inicializar respuestas
      const initialAnswers: Record<number, any> = {}
      data.questions.forEach((q) => {
        console.log(`Question ${q.id}: type=${q.question_type}, options=${q.options?.length}, matrix_rows=${q.matrix_rows?.length}`) // Debug
        if (q.question_type === 'multiple') {
          initialAnswers[q.id!] = []
        } else if (q.question_type === 'matrix') {
          initialAnswers[q.id!] = {}
        } else if (q.question_type === 'matrix_mul') {
          // Para matriz múltiple: objeto { rowId: number[] }
          initialAnswers[q.id!] = {}
        } else if (q.question_type === 'open') {
          // Para respuesta abierta: cadena vacía
          initialAnswers[q.id!] = ''
        }
      })
      setAnswers(initialAnswers)
    } catch (error: any) {
      console.error('Error loading public survey:', error)
      let errorMessage = 'Error al cargar la encuesta'
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Encuesta no encontrada'
        } else if (error.response.status === 400) {
          let errorMsg = error.response.data?.error || 'Esta encuesta no está disponible actualmente'
          // Formatear fechas en el mensaje de error si están presentes
          if (errorMsg.includes('Fechas:')) {
            // Buscar fechas en formato ISO o cualquier formato
            const dateMatch = errorMsg.match(/Fechas:\s*(.+?)\s*-\s*(.+?)(?:\s|$|\.)/)
            if (dateMatch && dateMatch.length >= 3) {
              const startDate = formatDateTimeForError(dateMatch[1].trim())
              const endDate = formatDateTimeForError(dateMatch[2].trim())
              errorMsg = errorMsg.replace(/Fechas:.*/, `Fechas: ${startDate} - ${endDate}`)
            }
          }
          // También formatear fechas en otros mensajes de error
          if (errorMsg.includes('Inicia el')) {
            const dateMatch = errorMsg.match(/Inicia el\s+(.+?)(?:\.|$)/)
            if (dateMatch && dateMatch.length >= 2) {
              const startDate = formatDateTimeForError(dateMatch[1].trim())
              errorMsg = errorMsg.replace(/Inicia el\s+.*?(?=\.|$)/, `Inicia el ${startDate}`)
            }
          }
          if (errorMsg.includes('cerró el')) {
            const dateMatch = errorMsg.match(/cerró el\s+(.+?)(?:\.|$)/)
            if (dateMatch && dateMatch.length >= 2) {
              const endDate = formatDateTimeForError(dateMatch[1].trim())
              errorMsg = errorMsg.replace(/cerró el\s+.*?(?=\.|$)/, `cerró el ${endDate}`)
            }
          }
          errorMessage = errorMsg
        } else {
          errorMessage = error.response.data?.error || error.response.data?.detail || errorMessage
        }
      } else if (error.request) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.'
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId: number, value: any, questionType: string) => {
    setAnswers((prev) => {
      if (questionType === 'multiple') {
        const current = prev[questionId] || []
        if (current.includes(value)) {
          return { ...prev, [questionId]: current.filter((v: any) => v !== value) }
        } else {
          return { ...prev, [questionId]: [...current, value] }
        }
      } else if (questionType === 'matrix') {
        return { ...prev, [questionId]: { ...prev[questionId], ...value } }
      } else if (questionType === 'matrix_mul') {
        // value viene como { [rowId]: colId }
        const rowId = Object.keys(value)[0]
        const colId = value[rowId]
        const currentForQuestion = prev[questionId] || {}
        const currentForRow: number[] = currentForQuestion[rowId] || []
        const exists = currentForRow.includes(colId)
        const newForRow = exists
          ? currentForRow.filter((c) => c !== colId)
          : [...currentForRow, colId]
        return {
          ...prev,
          [questionId]: {
            ...currentForQuestion,
            [rowId]: newForRow,
          },
        }
      } else {
        return { ...prev, [questionId]: value }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const responseAnswers: Answer[] = []

      survey?.questions.forEach((question) => {
        const answer = answers[question.id!]

        if (question.question_type === 'single') {
          if (answer) {
            responseAnswers.push({
              question: question.id!,
              selected_option: answer,
            })
          }
        } else if (question.question_type === 'multiple') {
          if (Array.isArray(answer) && answer.length > 0) {
            answer.forEach((optionId: number) => {
              responseAnswers.push({
                question: question.id!,
                selected_option: optionId,
              })
            })
          }
        } else if (question.question_type === 'matrix') {
          if (answer && typeof answer === 'object') {
            Object.entries(answer).forEach(([rowId, colId]) => {
              responseAnswers.push({
                question: question.id!,
                matrix_row: parseInt(rowId),
                matrix_column: colId as number,
              })
            })
          }
        } else if (question.question_type === 'matrix_mul') {
          if (answer && typeof answer === 'object') {
            Object.entries(answer).forEach(([rowId, cols]) => {
              if (Array.isArray(cols)) {
                cols.forEach((colId: number) => {
                  responseAnswers.push({
                    question: question.id!,
                    matrix_row: parseInt(rowId),
                    matrix_column: colId,
                  })
                })
              }
            })
          }
        } else if (question.question_type === 'open') {
          if (answer && typeof answer === 'string' && answer.trim() !== '') {
            responseAnswers.push({
              question: question.id!,
              text_answer: answer.trim(),
            })
          }
        }
      })

      const response: Response = {
        survey: id!,
        answers: responseAnswers,
      }

      console.log('Submitting response:', response) // Debug
      await surveysApi.submitResponse(response)
      setSuccess(true)
      // Limpiar respuestas después de enviar
      setAnswers({})
    } catch (error: any) {
      console.error('Error submitting response:', error) // Debug
      let errorMessage = 'Error al enviar la respuesta'
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'No autorizado. Verifica que la encuesta esté activa y dentro de las fechas permitidas.'
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.error || error.response.data?.detail || 'Datos inválidos'
        } else {
          errorMessage = error.response.data?.error || error.response.data?.detail || errorMessage
        }
      } else if (error.request) {
        errorMessage = 'No se pudo conectar con el servidor'
      }
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Cargando encuesta...</div>
      </div>
    )
  }

  if (error && !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow text-center">
          <div className="text-green-600 text-xl font-semibold mb-4">
            ¡Gracias por tu respuesta!
          </div>
          <p className="text-gray-700 mb-4">
            Tu respuesta ha sido guardada exitosamente.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  if (!survey) return null

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{survey.title}</h1>
          {survey.description && (
            <p className="text-gray-600 mb-6">{survey.description}</p>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {survey.questions.map((question, index) => {
              // Debug: mostrar información de la pregunta
              console.log(`Rendering question ${index + 1}:`, {
                id: question.id,
                type: question.question_type,
                hasOptions: !!question.options && question.options.length > 0,
                hasMatrixRows: !!question.matrix_rows && question.matrix_rows.length > 0,
                hasMatrixColumns: !!question.matrix_columns && question.matrix_columns.length > 0,
              })
              
              return (
              <div key={question.id} className="border-t border-gray-200 pt-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  {index + 1}. {question.text}
                  {question.is_required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {question.question_type === 'single' && question.options && question.options.length > 0 && (
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <label key={option.id} className="flex items-center">
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={option.id}
                          checked={answers[question.id!] === option.id}
                          onChange={() => handleAnswerChange(question.id!, option.id, 'single')}
                          required={question.is_required}
                          className="mr-2"
                        />
                        <span>{option.text}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.question_type === 'multiple' && question.options && question.options.length > 0 && (
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <label key={option.id} className="flex items-center">
                        <input
                          type="checkbox"
                          value={option.id}
                          checked={(answers[question.id!] || []).includes(option.id)}
                          onChange={() => handleAnswerChange(question.id!, option.id, 'multiple')}
                          className="mr-2"
                        />
                        <span>{option.text}</span>
                      </label>
                    ))}
                  </div>
                )}

                {(question.question_type === 'matrix' || question.question_type === 'matrix_mul') && question.matrix_rows && question.matrix_rows.length > 0 && question.matrix_columns && question.matrix_columns.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300">
                      <thead>
                        <tr>
                          <th className="border border-gray-300 px-4 py-2"></th>
                          {question.matrix_columns.map((col) => (
                            <th key={col.id} className="border border-gray-300 px-4 py-2 text-center">
                              {col.text}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {question.matrix_rows.map((row) => (
                          <tr key={row.id}>
                            <td className="border border-gray-300 px-4 py-2 font-medium">
                              {row.text}
                            </td>
                            {question.matrix_columns?.map((col) => (
                              <td key={col.id} className="border border-gray-300 px-4 py-2 text-center">
                                {question.question_type === 'matrix' ? (
                                  <input
                                    type="radio"
                                    name={`question-${question.id}-row-${row.id}`}
                                    checked={
                                      answers[question.id!]?.[row.id!] === col.id
                                    }
                                    onChange={() =>
                                      handleAnswerChange(
                                        question.id!,
                                        { [row.id!]: col.id },
                                        'matrix'
                                      )
                                    }
                                    required={question.is_required}
                                  />
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={
                                      Array.isArray(answers[question.id!]?.[row.id!]) &&
                                      answers[question.id!]?.[row.id!].includes(col.id)
                                    }
                                    onChange={() =>
                                      handleAnswerChange(
                                        question.id!,
                                        { [row.id!]: col.id },
                                        'matrix_mul'
                                      )
                                    }
                                  />
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {/* Debug: mostrar si no se renderizó ningún tipo */}
                {question.question_type === 'open' && (
                  <textarea
                    value={answers[question.id!] || ''}
                    onChange={(e) =>
                      handleAnswerChange(question.id!, e.target.value, 'open')
                    }
                    required={question.is_required}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={4}
                    placeholder="Escribe tu respuesta..."
                  />
                )}

                {question.question_type !== 'single' &&
                  question.question_type !== 'multiple' &&
                  question.question_type !== 'matrix' &&
                  question.question_type !== 'matrix_mul' &&
                  question.question_type !== 'open' && (
                  <div className="text-red-500 text-sm">
                    Tipo de pregunta desconocido: {question.question_type}
                  </div>
                )}
                {question.question_type === 'single' && (!question.options || question.options.length === 0) && (
                  <div className="text-yellow-500 text-sm">
                    Pregunta de opción única sin opciones definidas
                  </div>
                )}
                {question.question_type === 'multiple' && (!question.options || question.options.length === 0) && (
                  <div className="text-yellow-500 text-sm">
                    Pregunta de opción múltiple sin opciones definidas
                  </div>
                )}
              </div>
            )})}

            <div className="border-t border-gray-200 pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Enviar Respuesta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PublicSurvey

