import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { surveysApi, Survey } from '../api/surveys'
import { format } from 'date-fns'

const SurveyList = () => {
  const { user } = useAuth()
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadSurveys()
  }, [])

  const loadSurveys = async () => {
    try {
      const data = await surveysApi.getSurveys()
      setSurveys(data)
    } catch (error) {
      console.error('Error loading surveys:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta encuesta?')) return

    try {
      await surveysApi.deleteSurvey(id)
      loadSurveys()
    } catch (error) {
      console.error('Error deleting survey:', error)
      alert('Error al eliminar la encuesta')
    }
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Encuestas</h1>
          {(user?.role === 'admin' || user?.role === 'creator') && (
            <Link
              to="/surveys/new"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Nueva Encuesta
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">Cargando...</div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No hay encuestas disponibles
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {surveys.map((survey) => (
                <li key={survey.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            {survey.title}
                          </p>
                          <p className="mt-1 text-sm text-gray-500 truncate">
                            {survey.description}
                          </p>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex space-x-2">
                        {survey.is_open ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Activa
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Inactiva
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {format(new Date(survey.start_date), 'dd MMM yyyy')} - {format(new Date(survey.end_date), 'dd MMM yyyy')}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 space-x-4">
                        <p>{survey.total_responses || 0} respuestas</p>
                        <button
                          onClick={() => {
                            const publicUrl = `${window.location.origin}/survey/${survey.id}`
                            navigator.clipboard.writeText(publicUrl).then(() => {
                              alert('Enlace copiado al portapapeles: ' + publicUrl)
                            }).catch(() => {
                              // Fallback para navegadores que no soportan clipboard API
                              const textArea = document.createElement('textarea')
                              textArea.value = publicUrl
                              document.body.appendChild(textArea)
                              textArea.select()
                              document.execCommand('copy')
                              document.body.removeChild(textArea)
                              alert('Enlace copiado al portapapeles: ' + publicUrl)
                            })
                          }}
                          className="text-purple-600 hover:text-purple-800 font-medium"
                          title="Copiar enlace público"
                        >
                          📋 Compartir
                        </button>
                        <Link
                          to={`/surveys/${survey.id}/stats`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Ver Estadísticas
                        </Link>
                        {(user?.role === 'admin' || (user?.role === 'creator' && survey.creator === user.id)) && (
                          <>
                            <button
                              onClick={() => navigate(`/surveys/${survey.id}/edit`)}
                              className="text-green-600 hover:text-green-800"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(survey.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SurveyList

