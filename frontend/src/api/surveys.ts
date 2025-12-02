import api from './axios'

export interface Option {
  id?: number
  text: string
  order: number
}

export interface MatrixRow {
  id?: number
  text: string
  order: number
}

export interface MatrixColumn {
  id?: number
  text: string
  order: number
}

export interface Question {
  id?: number
  text: string
  question_type: 'single' | 'multiple' | 'matrix' | 'matrix_mul'
  is_required: boolean
  order: number
  options?: Option[]
  matrix_rows?: MatrixRow[]
  matrix_columns?: MatrixColumn[]
}

export interface Survey {
  id: string
  title: string
  description: string
  creator: number
  creator_name: string
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
  updated_at: string
  questions: Question[]
  assigned_viewers?: number[]
  is_open?: boolean
  total_responses?: number
}

export interface SurveyCreate {
  title: string
  description: string
  start_date: string
  end_date: string
  is_active: boolean
  questions: Question[]
  assigned_viewers?: number[]
}

export interface Answer {
  question: number
  selected_option?: number
  matrix_row?: number
  matrix_column?: number
  text_answer?: string
}

export interface Response {
  survey: string
  respondent_name?: string
  respondent_email?: string
  answers: Answer[]
}

export interface QuestionStats {
  id: number
  text: string
  question_type: 'single' | 'multiple' | 'matrix' | 'matrix_mul'
  total_answers: number
  data: Record<string, number> | Record<string, Record<string, number>>
}

export interface SurveyStats {
  survey: {
    id: string
    title: string
    total_responses: number
  }
  questions: QuestionStats[]
}

export const surveysApi = {
  getSurveys: async (): Promise<Survey[]> => {
    const response = await api.get('/surveys/')
    return response.data.results || response.data
  },

  getSurvey: async (id: string): Promise<Survey> => {
    const response = await api.get(`/surveys/${id}/`)
    return response.data
  },

  getPublicSurvey: async (id: string): Promise<Survey> => {
    // Para encuestas públicas, usar axios directamente sin token
    const axios = (await import('axios')).default
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const response = await axios.get(`${API_URL}/api/surveys/public/${id}/`)
    return response.data
  },

  createSurvey: async (survey: SurveyCreate): Promise<Survey> => {
    const response = await api.post('/surveys/', survey)
    return response.data
  },

  updateSurvey: async (id: string, survey: Partial<SurveyCreate>): Promise<Survey> => {
    const response = await api.patch(`/surveys/${id}/`, survey)
    return response.data
  },

  deleteSurvey: async (id: string): Promise<void> => {
    await api.delete(`/surveys/${id}/`)
  },

  getStatistics: async (id: string): Promise<SurveyStats> => {
    const response = await api.get(`/surveys/${id}/statistics/`)
    return response.data
  },

  exportExcel: async (id: string): Promise<Blob> => {
    const response = await api.get(`/surveys/${id}/export_excel/`, {
      responseType: 'blob',
    })
    return response.data
  },

  submitResponse: async (response: Response): Promise<{ message: string }> => {
    // Para respuestas públicas, usar axios directamente sin token
    const axios = (await import('axios')).default
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const apiResponse = await axios.post(`${API_URL}/api/surveys/respond/`, response)
    return apiResponse.data
  },
}

