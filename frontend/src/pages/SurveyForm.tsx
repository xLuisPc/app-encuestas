import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { surveysApi, Survey, Question, SurveyCreate } from '../api/surveys'
import { useAuth } from '../contexts/AuthContext'
import { authApi, User } from '../api/auth'
import { utcToLocalDateTime, localDateTimeToUTC } from '../utils/dateUtils'

const SurveyForm = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [viewers, setViewers] = useState<User[]>([])
  const [survey, setSurvey] = useState<SurveyCreate>({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    is_active: true,
    questions: [],
    assigned_viewers: [],
  })

  useEffect(() => {
    loadViewers()
    if (id) {
      loadSurvey()
    }
  }, [id])

  const loadViewers = async () => {
    try {
      // Solo cargar si el usuario es admin o creator
      if (user && (user.role === 'admin' || user.role === 'creator')) {
        console.log('Cargando visualizadores...')
        const data = await authApi.getViewers()
        console.log('Viewers recibidos del API:', data)
        console.log('Tipo de datos:', typeof data, Array.isArray(data))
        console.log('Cantidad de viewers:', data?.length)
        
        // Asegurar que sea un array
        if (Array.isArray(data)) {
          setViewers(data)
          console.log('Viewers establecidos en estado:', data)
        } else if (data && data.results) {
          // Si viene paginado
          setViewers(data.results)
          console.log('Viewers establecidos desde results:', data.results)
        } else {
          console.warn('Formato de datos inesperado:', data)
          setViewers([])
        }
      } else {
        console.log('Usuario no tiene permisos para ver viewers:', user?.role)
      }
    } catch (error: any) {
      console.error('Error loading viewers:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      // Mostrar mensaje si hay error pero permitir continuar
      setViewers([])
    }
  }

  // Cuando cambia la lista de viewers, filtrar los IDs guardados que ya no sean válidos
  useEffect(() => {
    if (!id || viewers.length === 0) return

    setSurvey((prev) => {
      if (!prev.assigned_viewers || prev.assigned_viewers.length === 0) {
        return prev
      }

      const validIds = prev.assigned_viewers.filter((viewerId) =>
        viewers.some((viewer) => viewer.id === viewerId)
      )

      if (validIds.length === prev.assigned_viewers.length) {
        return prev
      }

      return {
        ...prev,
        assigned_viewers: validIds,
      }
    })
  }, [viewers, id])

  const loadSurvey = async () => {
    try {
      const data = await surveysApi.getSurvey(id!)
      console.log('Encuesta cargada:', data)
      setSurvey({
        title: data.title,
        description: data.description,
        start_date: utcToLocalDateTime(data.start_date), // Convertir UTC a hora local para mostrar
        end_date: utcToLocalDateTime(data.end_date), // Convertir UTC a hora local para mostrar
        is_active: data.is_active,
        questions: data.questions,
        assigned_viewers: data.assigned_viewers || [], // Asegurar que siempre sea un array
      })
      console.log('assigned_viewers cargados:', data.assigned_viewers)
    } catch (error) {
      console.error('Error loading survey:', error)
    }
  }

  const addQuestion = () => {
    setSurvey({
      ...survey,
      questions: [
        ...survey.questions,
        {
          text: '',
          question_type: 'single',
          is_required: true,
          order: survey.questions.length,
          options: [],
        },
      ],
    })
  }

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const questions = [...survey.questions]
    questions[index] = { ...questions[index], [field]: value }
    setSurvey({ ...survey, questions })
  }

  const removeQuestion = (index: number) => {
    const questions = survey.questions.filter((_, i) => i !== index)
    setSurvey({ ...survey, questions })
  }

  const addOption = (questionIndex: number) => {
    const questions = [...survey.questions]
    const question = questions[questionIndex]
    if (!question.options) question.options = []
    question.options.push({ text: '', order: question.options.length })
    setSurvey({ ...survey, questions })
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const questions = [...survey.questions]
    const question = questions[questionIndex]
    if (question.options) {
      question.options[optionIndex].text = value
      setSurvey({ ...survey, questions })
    }
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const questions = [...survey.questions]
    const question = questions[questionIndex]
    if (question.options) {
      question.options = question.options.filter((_, i) => i !== optionIndex)
      setSurvey({ ...survey, questions })
    }
  }

  const addMatrixRow = (questionIndex: number) => {
    const questions = [...survey.questions]
    const question = questions[questionIndex]
    if (!question.matrix_rows) question.matrix_rows = []
    question.matrix_rows.push({ text: '', order: question.matrix_rows.length })
    setSurvey({ ...survey, questions })
  }

  const updateMatrixRow = (questionIndex: number, rowIndex: number, value: string) => {
    const questions = [...survey.questions]
    const question = questions[questionIndex]
    if (question.matrix_rows) {
      question.matrix_rows[rowIndex].text = value
      setSurvey({ ...survey, questions })
    }
  }

  const removeMatrixRow = (questionIndex: number, rowIndex: number) => {
    const questions = [...survey.questions]
    const question = questions[questionIndex]
    if (question.matrix_rows) {
      question.matrix_rows = question.matrix_rows.filter((_, i) => i !== rowIndex)
      setSurvey({ ...survey, questions })
    }
  }

  const addMatrixColumn = (questionIndex: number) => {
    const questions = [...survey.questions]
    const question = questions[questionIndex]
    if (!question.matrix_columns) question.matrix_columns = []
    question.matrix_columns.push({ text: '', order: question.matrix_columns.length })
    setSurvey({ ...survey, questions })
  }

  const updateMatrixColumn = (questionIndex: number, colIndex: number, value: string) => {
    const questions = [...survey.questions]
    const question = questions[questionIndex]
    if (question.matrix_columns) {
      question.matrix_columns[colIndex].text = value
      setSurvey({ ...survey, questions })
    }
  }

  const removeMatrixColumn = (questionIndex: number, colIndex: number) => {
    const questions = [...survey.questions]
    const question = questions[questionIndex]
    if (question.matrix_columns) {
      question.matrix_columns = question.matrix_columns.filter((_, i) => i !== colIndex)
      setSurvey({ ...survey, questions })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Convertir fechas de hora local a UTC antes de enviar
      // Asegurar que assigned_viewers sea un array de números válidos y que existan en viewers
      const viewerIdsSet = new Set(viewers.map((viewer) => viewer.id))
      const assignedViewersIds = Array.isArray(survey.assigned_viewers)
        ? survey.assigned_viewers
            .map((id) => (typeof id === 'string' ? parseInt(id, 10) : id))
            .filter((id) => !isNaN(id) && viewerIdsSet.has(id))
        : []
      
      const surveyToSend = {
        title: survey.title,
        description: survey.description,
        start_date: localDateTimeToUTC(survey.start_date),
        end_date: localDateTimeToUTC(survey.end_date),
        is_active: survey.is_active,
        questions: survey.questions,
        assigned_viewers: assignedViewersIds,
      }
      
      console.log('Enviando encuesta:', surveyToSend)
      console.log('assigned_viewers:', assignedViewersIds)
      
      let surveyId = id
      if (id) {
        await surveysApi.updateSurvey(id, surveyToSend)
      } else {
        const createdSurvey = await surveysApi.createSurvey(surveyToSend)
        surveyId = createdSurvey.id
      }
      
      // Mostrar enlace de compartir después de guardar
      const publicUrl = `${window.location.origin}/survey/${surveyId}`
      const shouldShare = window.confirm(
        `¡Encuesta guardada exitosamente!\n\n` +
        `Enlace público: ${publicUrl}\n\n` +
        `¿Deseas copiar el enlace al portapapeles?`
      )
      
      if (shouldShare) {
        navigator.clipboard.writeText(publicUrl).then(() => {
          alert('Enlace copiado al portapapeles!')
        }).catch(() => {
          // Fallback
          const textArea = document.createElement('textarea')
          textArea.value = publicUrl
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
          alert('Enlace copiado al portapapeles!')
        })
      }
      
      navigate('/surveys')
    } catch (error: any) {
      console.error('Error saving survey:', error)
      if (error.response) {
        console.error('Response status:', error.response.status)
        console.error('Response data:', error.response.data)
        alert(`Error al guardar la encuesta: ${JSON.stringify(error.response.data)}`)
      } else {
        alert('Error al guardar la encuesta')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {id ? 'Editar Encuesta' : 'Nueva Encuesta'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Información General</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Título</label>
                <input
                  type="text"
                  required
                  value={survey.title}
                  onChange={(e) => setSurvey({ ...survey, title: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  value={survey.description}
                  onChange={(e) => setSurvey({ ...survey, description: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha Inicio</label>
                  <input
                    type="datetime-local"
                    required
                    value={survey.start_date}
                    onChange={(e) => setSurvey({ ...survey, start_date: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha Fin</label>
                  <input
                    type="datetime-local"
                    required
                    value={survey.end_date}
                    onChange={(e) => setSurvey({ ...survey, end_date: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={survey.is_active}
                    onChange={(e) => setSurvey({ ...survey, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Activa</span>
                </label>
              </div>
              {(user?.role === 'admin' || user?.role === 'creator') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Visualizadores asignados
                  </label>
                  {viewers.length > 0 ? (
                    <div className="mt-2 space-y-2 border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto">
                      {viewers.map((viewer) => {
                        const isSelected = survey.assigned_viewers?.includes(viewer.id) || false
                        return (
                          <label
                            key={viewer.id}
                            className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-50 border-2 border-blue-500'
                                : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const currentViewers = survey.assigned_viewers || []
                                if (e.target.checked) {
                                  // Agregar viewer
                                  setSurvey({
                                    ...survey,
                                    assigned_viewers: [...currentViewers, viewer.id],
                                  })
                                } else {
                                  // Remover viewer
                                  setSurvey({
                                    ...survey,
                                    assigned_viewers: currentViewers.filter((id) => id !== viewer.id),
                                  })
                                }
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-900">
                                  {viewer.username}
                                </span>
                                {isSelected && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    Seleccionado
                                  </span>
                                )}
                              </div>
                              {viewer.email && (
                                <p className="text-xs text-gray-500 mt-1">{viewer.email}</p>
                              )}
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        No hay usuarios con rol "viewer" disponibles. Crea usuarios con rol "viewer" para poder asignarlos a esta encuesta.
                      </p>
                    </div>
                  )}
                  {survey.assigned_viewers && survey.assigned_viewers.length > 0 && (
                    <p className="mt-3 text-sm text-green-600 font-medium">
                      ✓ {survey.assigned_viewers.length} visualizador(es) seleccionado(s)
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Preguntas</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
              >
                Agregar Pregunta
              </button>
            </div>

            {survey.questions.map((question, qIndex) => (
              <div key={qIndex} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium">Pregunta {qIndex + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Eliminar
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Texto de la pregunta</label>
                    <input
                      type="text"
                      required
                      value={question.text}
                      onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <select
                      value={question.question_type}
                      onChange={(e) => updateQuestion(qIndex, 'question_type', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="single">Opción Única</option>
                      <option value="multiple">Opción Múltiple</option>
                      <option value="matrix">Matriz de Satisfacción</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={question.is_required}
                        onChange={(e) => updateQuestion(qIndex, 'is_required', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Requerida</span>
                    </label>
                  </div>

                  {question.question_type === 'single' || question.question_type === 'multiple' ? (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Opciones</label>
                        <button
                          type="button"
                          onClick={() => addOption(qIndex)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          + Agregar Opción
                        </button>
                      </div>
                      {question.options?.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center space-x-2 mb-2">
                          <input
                            type="text"
                            required
                            value={option.text}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Texto de la opción"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : question.question_type === 'matrix' ? (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700">Filas</label>
                          <button
                            type="button"
                            onClick={() => addMatrixRow(qIndex)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            + Agregar Fila
                          </button>
                        </div>
                        {question.matrix_rows?.map((row, rIndex) => (
                          <div key={rIndex} className="flex items-center space-x-2 mb-2">
                            <input
                              type="text"
                              required
                              value={row.text}
                              onChange={(e) => updateMatrixRow(qIndex, rIndex, e.target.value)}
                              className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                              placeholder="Texto de la fila"
                            />
                            <button
                              type="button"
                              onClick={() => removeMatrixRow(qIndex, rIndex)}
                              className="text-red-600 hover:text-red-800"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700">Columnas</label>
                          <button
                            type="button"
                            onClick={() => addMatrixColumn(qIndex)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            + Agregar Columna
                          </button>
                        </div>
                        {question.matrix_columns?.map((col, cIndex) => (
                          <div key={cIndex} className="flex items-center space-x-2 mb-2">
                            <input
                              type="text"
                              required
                              value={col.text}
                              onChange={(e) => updateMatrixColumn(qIndex, cIndex, e.target.value)}
                              className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                              placeholder="Texto de la columna"
                            />
                            <button
                              type="button"
                              onClick={() => removeMatrixColumn(qIndex, cIndex)}
                              className="text-red-600 hover:text-red-800"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/surveys')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

export default SurveyForm

