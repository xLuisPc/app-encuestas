import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import Button from '../ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { surveysApi } from '../../api/surveys'

interface SurveyNavBarProps {
  title?: string
  onBack?: () => void
  onPreview?: () => void
  onSave?: () => void
  onShare?: () => void
  onMenuClick?: () => void
  mode?: 'main' | 'survey'
}

const SurveyNavBar: React.FC<SurveyNavBarProps> = ({
  title = '',
  onBack,
  onPreview,
  onSave,
  onShare,
  onMenuClick,
  mode = 'survey'
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()
  const { user, logout } = useAuth()
  const [surveyTitle, setSurveyTitle] = useState<string>('')
  const [loadingSurvey, setLoadingSurvey] = useState(false)

  // Detectar si estamos en una ruta de encuesta específica
  const isSurveyDetailRoute = location.pathname.match(/\/surveys\/([^/]+)\/(edit|stats)/)
  const surveyId = isSurveyDetailRoute ? params.id : null

  // Cargar el nombre de la encuesta si estamos en una ruta de detalle
  useEffect(() => {
    if (surveyId && !title) {
      setLoadingSurvey(true)
      surveysApi.getSurvey(surveyId)
        .then((survey) => {
          setSurveyTitle(survey.title)
        })
        .catch((error) => {
          console.error('Error loading survey:', error)
          setSurveyTitle('Encuesta')
        })
        .finally(() => {
          setLoadingSurvey(false)
        })
    }
  }, [surveyId, title])

  // Determinar el título a mostrar
  const getDisplayTitle = () => {
    if (title) return title
    if (surveyTitle) return surveyTitle
    if (loadingSurvey) return 'Cargando...'
    
    // Títulos según la ruta
    if (location.pathname === '/') return 'Dashboard'
    if (location.pathname === '/surveys') return 'Encuestas'
    if (location.pathname === '/surveys/new') return 'Nueva Encuesta'
    if (location.pathname.match(/\/surveys\/\d+\/edit/)) return surveyTitle || 'Editar Encuesta'
    if (location.pathname.match(/\/surveys\/\d+\/stats/)) return surveyTitle || 'Estadísticas'
    
    return 'Dashboard'
  }

  // Determinar qué botones mostrar según la ruta
  const getButtonsForRoute = () => {
    // Siempre mostrar botones de navegación en todas las rutas
    return (
      <>
        <Button
          variant="primary"
          onClick={() => navigate('/surveys')}
        >
          Encuestas
        </Button>

        {(user?.role === 'admin' || user?.role === 'creator') && (
          <Button
            variant="primary"
            onClick={() => navigate('/surveys/new')}
          >
            Nueva Encuesta
          </Button>
        )}

        <Button
          variant="secondary"
          onClick={handleLogout}
        >
          Cerrar Sesión
        </Button>
      </>
    )
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Modo de navegación principal
  if (mode === 'main') {
    const displayTitle = getDisplayTitle()
    const routeButtons = getButtonsForRoute()
    
    return (
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left side: Back button, icon, and title */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <button
                onClick={() => navigate('/')}
                className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Inicio"
              >
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <path d="M12 11h4" />
                  <path d="M12 16h4" />
                  <path d="M8 11h.01" />
                  <path d="M8 16h.01" />
                </svg>
              </div>

              <h1 className="text-lg font-medium text-gray-900 truncate flex-1 min-w-0">
                {displayTitle}
              </h1>
            </div>

            {/* Right side: Action buttons */}
            {routeButtons && (
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                {routeButtons}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Modo de encuesta
  return (
    <div className="max-w-7xl mx-auto px-4 pt-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side: Back button, icon, and title */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            onClick={handleBack}
            className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Volver"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>

            <h1 className="text-lg font-medium text-gray-900 truncate flex-1 min-w-0">
              {title}
            </h1>
          </div>

          {/* Right side: Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {onPreview && (
            <Button
              variant="primary"
              onClick={onPreview}
              className="flex items-center gap-2"
            >
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Preview
            </Button>
          )}

          {onSave && (
            <Button
              variant="primary"
              onClick={onSave}
            >
              Save
            </Button>
          )}

          {onShare && (
            <Button
              variant="secondary"
              onClick={onShare}
            >
              Share
            </Button>
          )}

            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Más opciones"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SurveyNavBar

