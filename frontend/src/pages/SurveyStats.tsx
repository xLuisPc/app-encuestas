import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { surveysApi, SurveyStats } from '../api/surveys'
import Chart from '../components/Chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const SurveyStatsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [stats, setStats] = useState<SurveyStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Resetear estado cuando cambia el ID
    setStats(null)
    setLoading(true)
    
    if (id) {
      loadStats()
    } else {
      setLoading(false)
    }
  }, [id])

  const loadStats = async () => {
    if (!id) return
    
    setLoading(true)
    setStats(null) // Limpiar stats anteriores
    
    try {
      const data = await surveysApi.getStatistics(id)
      console.log('Stats loaded:', data) // Debug
      console.log('Questions:', data.questions) // Debug
      console.log('Questions count:', data.questions?.length) // Debug
      
      // Validar que los datos sean correctos
      if (data && data.survey && Array.isArray(data.questions)) {
        setStats(data)
      } else {
        console.error('Datos inválidos recibidos:', data)
        alert('Error: Los datos recibidos no son válidos')
      }
    } catch (error: any) {
      console.error('Error loading stats:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      
      let errorMessage = 'Error al cargar las estadísticas'
      if (error.response) {
        if (error.response.status === 403) {
          errorMessage = 'No tienes permisos para ver las estadísticas de esta encuesta'
        } else if (error.response.status === 404) {
          errorMessage = 'Encuesta no encontrada'
        } else {
          errorMessage = error.response.data?.detail || error.response.data?.error || errorMessage
        }
      } else if (error.request) {
        errorMessage = 'No se pudo conectar con el servidor'
      }
      
      // Mostrar error pero permitir que la página se renderice
      alert(errorMessage)
      setStats(null) // Asegurar que stats sea null en caso de error
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const blob = await surveysApi.exportExcel(id!)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `encuesta_${id}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting:', error)
      alert('Error al exportar el archivo')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-lg text-gray-600">Cargando estadísticas...</div>
        </div>
      </Layout>
    )
  }

  if (!stats || !stats.survey) {
    return (
      <Layout>
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center py-12">
            <div className="text-red-600 text-lg font-semibold mb-2">
              No se pudieron cargar las estadísticas
            </div>
            <button
              onClick={() => {
                setLoading(true)
                loadStats()
              }}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Reintentar
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{stats.survey.title}</h1>
            <p className="text-gray-600 mt-2">
              Total de respuestas: {stats.survey.total_responses}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                const publicUrl = `${window.location.origin}/survey/${id}`
                navigator.clipboard.writeText(publicUrl).then(() => {
                  alert('Enlace copiado al portapapeles:\n' + publicUrl)
                }).catch(() => {
                  // Fallback para navegadores que no soportan clipboard API
                  const textArea = document.createElement('textarea')
                  textArea.value = publicUrl
                  document.body.appendChild(textArea)
                  textArea.select()
                  document.execCommand('copy')
                  document.body.removeChild(textArea)
                  alert('Enlace copiado al portapapeles:\n' + publicUrl)
                })
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
              title="Copiar enlace público para compartir"
            >
              📋 Copiar Enlace
            </button>
            <button
              onClick={handleExport}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Exportar a Excel
            </button>
          </div>
        </div>

        {stats.questions.map((question, index) => (
          <div key={question.id} className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {index + 1}. {question.text}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Total de respuestas: {question.total_answers}
            </p>

            {/* Renderizar gráficas según el tipo de pregunta */}
            {question.question_type === 'single' || question.question_type === 'multiple' ? (
              (() => {
                const data = question.data as Record<string, number>
                const hasData = data && Object.keys(data).length > 0 && question.total_answers > 0
                
                if (!hasData) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      No hay datos para mostrar
                    </div>
                  )
                }
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Chart
                        data={data}
                        type="pie"
                      />
                    </div>
                    <div>
                      <Chart
                        data={data}
                        type="bar"
                      />
                    </div>
                  </div>
                )
              })()
            ) : (question.question_type === 'matrix' || question.question_type === 'matrix_mul') ? (
              (() => {
                const matrixData = question.data as Record<string, Record<string, number>>
                const hasData = matrixData && Object.keys(matrixData).length > 0 && question.total_answers > 0
                
                if (!hasData) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      No hay datos para mostrar
                    </div>
                  )
                }
                
                const firstRow = Object.keys(matrixData)[0]
                const columns = firstRow && matrixData[firstRow] ? Object.keys(matrixData[firstRow]) : []
                
                if (columns.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      No hay datos para mostrar
                    </div>
                  )
                }
                
                return (
                  <div>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={Object.entries(matrixData).map(([row, cols]) => ({
                          name: row,
                          ...cols,
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {columns.map((col, idx) => (
                          <Bar key={col} dataKey={col} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )
              })()
            ) : (
              <div className="text-center py-8 text-gray-500">
                Tipo de pregunta desconocido
              </div>
            )}

            {question.question_type === 'single' || question.question_type === 'multiple' ? (
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2">Datos detallados:</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Opción
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cantidad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Porcentaje
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(question.data as Record<string, number>).map(([option, count]) => {
                        const percentage = question.total_answers > 0 
                          ? ((count / question.total_answers) * 100).toFixed(1) 
                          : '0.0'
                        return (
                          <tr key={option}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {option}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {count}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {percentage}%
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        ))}

        {stats.questions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No hay preguntas en esta encuesta
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SurveyStatsPage

