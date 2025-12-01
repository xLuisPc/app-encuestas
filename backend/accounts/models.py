from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Usuario personalizado con roles"""
    ROLE_CHOICES = [
        ('admin', 'Administrador'),
        ('creator', 'Creador'),
        ('viewer', 'Visualizador'),
    ]
    
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='viewer')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_admin(self):
        return self.role == 'admin' or self.is_superuser
    
    def is_creator(self):
        return self.role == 'creator' or self.is_admin()
    
    def is_viewer(self):
        return self.role == 'viewer' or self.is_creator()

    class Meta:
        db_table = 'users'

