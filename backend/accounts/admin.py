from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'role_badge', 'is_active', 'date_joined')
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Rol', {
            'fields': ('role',),
            'description': 'Selecciona el rol del usuario. Los administradores pueden crear y gestionar todo.'
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Rol', {
            'fields': ('role',),
            'description': 'Selecciona el rol del usuario. Los administradores pueden crear y gestionar todo.'
        }),
    )
    
    def role_badge(self, obj):
        """Muestra el rol con un badge de color"""
        colors = {
            'admin': 'red',
            'creator': 'blue',
            'viewer': 'green',
        }
        color = colors.get(obj.role, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color,
            obj.get_role_display()
        )
    role_badge.short_description = 'Rol'
    role_badge.admin_order_field = 'role'

