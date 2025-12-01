from django.contrib import admin
from .models import Survey, Question, Option, MatrixRow, MatrixColumn, Response, Answer


class OptionInline(admin.TabularInline):
    model = Option
    extra = 2


class MatrixRowInline(admin.TabularInline):
    model = MatrixRow
    extra = 2


class MatrixColumnInline(admin.TabularInline):
    model = MatrixColumn
    extra = 4


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    fields = ('text', 'question_type', 'is_required', 'order')


@admin.register(Survey)
class SurveyAdmin(admin.ModelAdmin):
    list_display = ('title', 'creator', 'start_date', 'end_date', 'is_active', 'created_at')
    list_filter = ('is_active', 'start_date', 'end_date')
    search_fields = ('title', 'description')
    filter_horizontal = ('assigned_viewers',)
    inlines = [QuestionInline]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('text', 'survey', 'question_type', 'is_required', 'order')
    list_filter = ('question_type', 'is_required')
    inlines = [OptionInline, MatrixRowInline, MatrixColumnInline]


@admin.register(Response)
class ResponseAdmin(admin.ModelAdmin):
    list_display = ('survey', 'respondent_name', 'respondent_email', 'submitted_at')
    list_filter = ('submitted_at', 'survey')
    readonly_fields = ('submitted_at',)


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ('response', 'question', 'selected_option', 'matrix_row', 'matrix_column')
    list_filter = ('question',)

