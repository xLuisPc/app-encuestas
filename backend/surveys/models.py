from django.db import models
from django.conf import settings
import uuid


class Survey(models.Model):
    """Modelo de Encuesta"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_surveys')
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Usuarios asignados para visualización (para rol viewer)
    assigned_viewers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='assigned_surveys',
        blank=True
    )

    class Meta:
        ordering = ['-created_at']
        db_table = 'surveys'

    def __str__(self):
        return self.title

    @property
    def is_open(self):
        from django.utils import timezone
        now = timezone.now()
        return self.is_active and self.start_date <= now <= self.end_date

    @property
    def total_responses(self):
        return self.responses.count()


class Question(models.Model):
    """Modelo de Pregunta"""
    QUESTION_TYPES = [
        ('single', 'Opción Única'),
        ('multiple', 'Opción Múltiple'),
        ('matrix', 'Matriz opción única'),
    ]
    
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    question_type = models.CharField(max_length=10, choices=QUESTION_TYPES)
    is_required = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']
        db_table = 'questions'

    def __str__(self):
        return f"{self.survey.title} - {self.text[:50]}"


class Option(models.Model):
    """Opciones para preguntas de tipo single o multiple"""
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    text = models.CharField(max_length=200)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']
        db_table = 'options'

    def __str__(self):
        return self.text


class MatrixRow(models.Model):
    """Filas para preguntas de tipo matriz"""
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='matrix_rows')
    text = models.CharField(max_length=200)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']
        db_table = 'matrix_rows'

    def __str__(self):
        return self.text


class MatrixColumn(models.Model):
    """Columnas para preguntas de tipo matriz (ej: Muy Satisfecho, Satisfecho, etc.)"""
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='matrix_columns')
    text = models.CharField(max_length=200)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']
        db_table = 'matrix_columns'

    def __str__(self):
        return self.text


class Response(models.Model):
    """Respuesta completa de un usuario a una encuesta"""
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='responses')
    respondent_name = models.CharField(max_length=200, blank=True)
    respondent_email = models.EmailField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-submitted_at']
        db_table = 'responses'

    def __str__(self):
        return f"Respuesta a {self.survey.title} - {self.submitted_at}"


class Answer(models.Model):
    """Respuesta individual a una pregunta"""
    response = models.ForeignKey(Response, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    # Para single/multiple: guarda el ID de la opción seleccionada
    selected_option = models.ForeignKey(Option, on_delete=models.CASCADE, null=True, blank=True)
    # Para multiple: puede haber múltiples respuestas
    # Para matrix: guarda el ID de la fila y columna
    matrix_row = models.ForeignKey(MatrixRow, on_delete=models.CASCADE, null=True, blank=True)
    matrix_column = models.ForeignKey(MatrixColumn, on_delete=models.CASCADE, null=True, blank=True)
    # Texto libre (por si se necesita en el futuro)
    text_answer = models.TextField(blank=True)

    class Meta:
        db_table = 'answers'

    def __str__(self):
        if self.selected_option:
            return f"{self.question.text}: {self.selected_option.text}"
        elif self.matrix_row and self.matrix_column:
            return f"{self.question.text}: {self.matrix_row.text} - {self.matrix_column.text}"
        return f"{self.question.text}: {self.text_answer}"

