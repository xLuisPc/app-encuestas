from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SurveyViewSet, SurveyPublicView, ResponseCreateView

urlpatterns = [
    # Rutas específicas primero (antes del router para que tengan prioridad)
    path('surveys/respond/', ResponseCreateView, name='survey-respond'),
    path('surveys/public/<uuid:id>/', SurveyPublicView.as_view(), name='survey-public'),
]

# Router al final para que no capture las rutas específicas
router = DefaultRouter()
router.register(r'surveys', SurveyViewSet, basename='survey')
urlpatterns += router.urls

