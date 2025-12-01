from rest_framework import permissions


class IsAdminOrCreator(permissions.BasePermission):
    """Permite acceso a admin o creador"""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_admin() or request.user.is_creator()


class IsSurveyCreatorOrAdmin(permissions.BasePermission):
    """Permite acceso solo al creador de la encuesta o admin"""
    def has_object_permission(self, request, view, obj):
        if request.user.is_admin():
            return True
        return obj.creator == request.user


class IsAssignedViewerOrAdmin(permissions.BasePermission):
    """Permite acceso a visualizadores asignados o admin"""
    def has_object_permission(self, request, view, obj):
        if request.user.is_admin():
            return True
        if obj.creator == request.user:
            return True
        return request.user in obj.assigned_viewers.all()


class CanViewStatistics(permissions.BasePermission):
    """Permite ver estadísticas si eres admin, creador o visualizador asignado"""
    def has_object_permission(self, request, view, obj):
        # Si no está autenticado, no puede ver estadísticas
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin puede ver todo
        if request.user.is_admin():
            return True
        
        # El creador puede ver sus propias encuestas
        if obj.creator == request.user:
            return True
        
        # Visualizador puede ver encuestas asignadas
        if request.user.role == 'viewer' and request.user in obj.assigned_viewers.all():
            return True
        
        return False

