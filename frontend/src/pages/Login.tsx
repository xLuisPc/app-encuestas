import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const backgroundImageUrl = '/loggin.jpg'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(username, password)
      navigate('/')
    } catch (err: any) {
      console.error('Error de login:', err)
      let errorMessage = 'Error al iniciar sesión'
      if (err.response) {
        if (err.response.data) {
          errorMessage = err.response.data.detail ||
            err.response.data.error ||
            err.response.data.message ||
            JSON.stringify(err.response.data)
        } else {
          errorMessage = `Error ${err.response.status}: ${err.response.statusText}`
        }
      } else if (err.request) {
        errorMessage = 'No se pudo conectar con el servidor.'
      } else {
        errorMessage = err.message || 'Error desconocido'
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-6">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-lg overflow-hidden grid grid-cols-1 lg:grid-cols-2">

        {/* IZQUIERDA */}
        <div className="p-10 flex flex-col justify-between">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-2xl font-bold text-green-600">App Encuestas</h1>

            <div className="text-sm flex items-center gap-1 cursor-pointer text-gray-600 hover:text-gray-900">
              <span>ES</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Form */}
          <div>
            <h2 className="text-4xl font-bold text-gray-900">Bienvenido!</h2>
            <p className="text-gray-600 mt-3 mb-8">
              Para conectarte a tu cuenta, escribe tu email y tu contraseña.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">

              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <input
                type="text"
                placeholder="Tu dirección email"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-100 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:bg-white transition"
              />

              <input
                type="password"
                placeholder="Tu contraseña"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-100 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:bg-white transition"
              />

              {/* <div className="text-right">
                <button className="text-sm text-green-600 hover:text-green-700">
                  ¿Has olvidado tu contraseña?
                </button>
              </div> */}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition disabled:opacity-50"
              >
                {loading ? "Iniciando..." : "Iniciar sesión"}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center mt-10">
            <p className="text-sm text-gray-600">¿Necesitas ayuda?</p>
            <a href="mailto:support@encuestas.com" className="text-green-600 text-sm hover:text-green-700">
              support@encuestas.com
            </a>

            <p className="text-xs text-gray-500 mt-4">
              © Todos los derechos reservados App Encuestas 2025
            </p>
          </div>

        </div>

        {/* DERECHA */}
        <div
          className="relative bg-cover bg-center"
          style={{
            backgroundImage: `url(${backgroundImageUrl})`
          }}>

        </div>

      </div>
    </div>
  )
}

export default Login
