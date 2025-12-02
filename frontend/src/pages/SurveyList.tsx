import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { surveysApi, Survey } from '../api/surveys'
import { format } from 'date-fns'
import { Button, Mosaic } from '../components/ui'
import Swal from 'sweetalert2'

const SurveyList = () => {
  const { user } = useAuth()
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [filteredSurveys, setFilteredSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearchLoader, setShowSearchLoader] = useState(false)
  const [deletingSurveyId, setDeletingSurveyId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadSurveys()
  }, [])

  const loadSurveys = async () => {
    try {
      const data = await surveysApi.getSurveys()
      setSurveys(data)
      setFilteredSurveys(data)
    } catch (error) {
      console.error('Error loading surveys:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar encuestas según el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSurveys(surveys)
    } else {
      const filtered = surveys.filter((survey) => {
        const searchLower = searchTerm.toLowerCase()
        return (
          survey.title.toLowerCase().includes(searchLower) ||
          survey.description?.toLowerCase().includes(searchLower)
        )
      })
      setFilteredSurveys(filtered)
    }
  }, [searchTerm, surveys])

  const handleSearch = () => {
    setShowSearchLoader(true)
    setTimeout(() => {
      setShowSearchLoader(false)
    }, 5000)
  }

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'La encuesta se eliminará permanentemente y no podrá ser recuperada',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      reverseButtons: true
    })

    if (!result.isConfirmed) return

    setDeletingSurveyId(id)
    try {
      await surveysApi.deleteSurvey(id)
      await loadSurveys()
      Swal.fire({
        title: '¡Eliminada!',
        text: 'La encuesta ha sido eliminada exitosamente',
        icon: 'success',
        confirmButtonColor: '#2563eb',
        timer: 2000,
        showConfirmButton: false
      })
    } catch (error) {
      console.error('Error deleting survey:', error)
      Swal.fire({
        title: 'Error',
        text: 'No se pudo eliminar la encuesta',
        icon: 'error',
        confirmButtonColor: '#2563eb'
      })
    } finally {
      setDeletingSurveyId(null)
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Barra de búsqueda */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-full max-w-xl">
            {/* “píldora” blanca con sombra suave */}
            <div className="rounded-full bg-gradient-to-r from-gray-200 to-gray-100 p-[3px] shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
              <div className="flex items-center bg-white rounded-full pl-6 pr-16 py-4">
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      // ya filtras en tiempo real, esto es solo por si quieres manejar algo aquí
                    }
                  }}
                  className="w-full bg-transparent text-base text-gray-800 placeholder-gray-400 focus:outline-none"
                />
              </div>
            </div>

            {/* botón circular que "flota" a la derecha */}
            <button
              type="button"
              onClick={handleSearch}
              aria-label="Buscar"
              className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/4
                        w-14 h-14 rounded-full flex items-center justify-center
                        shadow-[0_12px_30px_rgba(37,99,235,0.35)]
                        transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent"
              style={{ backgroundColor: '#2563eb' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando...</div>
        ) : showSearchLoader ? (
          <div className="fixed inset-0 flex justify-center items-center bg-gray-50 bg-opacity-75 z-50">
            <Mosaic color="#2563eb" size="medium" text="" textColor="" />
          </div>
        ) : deletingSurveyId ? (
          <div className="fixed inset-0 flex justify-center items-center bg-gray-50 bg-opacity-75 z-50">
            <Mosaic color="#2563eb" size="medium" text="" textColor="" />
          </div>
        ) : filteredSurveys.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? 'No se encontraron encuestas que coincidan con tu búsqueda' : 'No hay encuestas disponibles'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredSurveys.map((survey) => (
              <div
                key={survey.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="mb-4">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 truncate flex-1 min-w-0">
                      {survey.title}
                    </h3>
                    {survey.is_open ? (
                      <span className="px-4 py-1.5 inline-flex text-sm font-semibold rounded-full bg-green-100 text-green-800 flex-shrink-0">
                        Activa
                      </span>
                    ) : (
                      <span className="px-4 py-1.5 inline-flex text-sm font-semibold rounded-full bg-gray-100 text-gray-800 flex-shrink-0">
                        Inactiva
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    {survey.description ? (
                      <p className="text-base text-gray-500 line-clamp-2 flex-1 min-w-0">
                        {survey.description}
                      </p>
                    ) : (
                      <div className="flex-1"></div>
                    )}
                    <span className="text-base text-gray-500 flex-shrink-0">
                      {survey.total_responses || 0} respuestas
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-base text-gray-500 mb-4">
                  <span>
                    {format(new Date(survey.start_date), 'dd MMM yyyy')} - {format(new Date(survey.end_date), 'dd MMM yyyy')}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="primary"
                    onClick={() => {
                      const publicUrl = `${window.location.origin}/survey/${survey.id}`
                      Swal.fire({
                        title: 'Enlace de Invitación',
                        html: `
                          <div class="text-left">
                            <p class="mb-4 text-gray-700">Comparte este enlace para que otros puedan responder la encuesta:</p>
                            <div class="bg-gray-100 p-3 rounded-lg mb-4">
                              <code class="text-sm break-all">${publicUrl}</code>
                            </div>
                          </div>
                        `,
                        icon: 'info',
                        showCancelButton: true,
                        confirmButtonText: 'Copiar Enlace',
                        cancelButtonText: 'Cerrar',
                        confirmButtonColor: '#2563eb',
                        cancelButtonColor: '#6b7280',
                        reverseButtons: true
                      }).then((result) => {
                        if (result.isConfirmed) {
                          navigator.clipboard.writeText(publicUrl).then(() => {
                            Swal.fire({
                              title: '¡Copiado!',
                              text: 'El enlace ha sido copiado al portapapeles',
                              icon: 'success',
                              confirmButtonColor: '#2563eb',
                              timer: 2000,
                              showConfirmButton: false
                            })
                          }).catch(() => {
                            // Fallback para navegadores que no soportan clipboard API
                            const textArea = document.createElement('textarea')
                            textArea.value = publicUrl
                            document.body.appendChild(textArea)
                            textArea.select()
                            document.execCommand('copy')
                            document.body.removeChild(textArea)
                            Swal.fire({
                              title: '¡Copiado!',
                              text: 'El enlace ha sido copiado al portapapeles',
                              icon: 'success',
                              confirmButtonColor: '#2563eb',
                              timer: 2000,
                              showConfirmButton: false
                            })
                          })
                        }
                      })
                    }}
                    className="text-sm"
                  >
                    Compartir
                  </Button>
                  <Link to={`/surveys/${survey.id}/stats`}>
                    <Button variant="primary" className="text-sm">
                      Ver Estadísticas
                    </Button>
                  </Link>
                  {(user?.role === 'admin' || (user?.role === 'creator' && survey.creator === user.id)) && (
                    <>
                      <Button
                        variant="primary"
                        onClick={() => navigate(`/surveys/${survey.id}/edit`)}
                        className="text-sm"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => handleDelete(survey.id)}
                        className="text-sm text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        Eliminar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SurveyList

