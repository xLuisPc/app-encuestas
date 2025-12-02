from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Survey, Question, Option, MatrixRow, MatrixColumn, 
    Response, Answer
)

User = get_user_model()


class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ['id', 'text', 'order']


class MatrixRowSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatrixRow
        fields = ['id', 'text', 'order']


class MatrixColumnSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatrixColumn
        fields = ['id', 'text', 'order']


class QuestionSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, required=False)
    matrix_rows = MatrixRowSerializer(many=True, required=False)
    matrix_columns = MatrixColumnSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = ['id', 'text', 'question_type', 'is_required', 'order', 
                  'options', 'matrix_rows', 'matrix_columns']
        
    def to_representation(self, instance):
        """Asegurar que las opciones se devuelvan correctamente"""
        representation = super().to_representation(instance)
        
        # Siempre devolver opciones (aunque estén vacías) para preguntas single/multiple
        if instance.question_type in ['single', 'multiple']:
            representation['options'] = OptionSerializer(
                instance.options.all().order_by('order'), 
                many=True
            ).data
            # Limpiar campos de matriz si no son necesarios
            representation['matrix_rows'] = []
            representation['matrix_columns'] = []
        # Siempre devolver filas y columnas para preguntas de matriz
        elif instance.question_type == 'matrix':
            representation['matrix_rows'] = MatrixRowSerializer(
                instance.matrix_rows.all().order_by('order'),
                many=True
            ).data
            representation['matrix_columns'] = MatrixColumnSerializer(
                instance.matrix_columns.all().order_by('order'),
                many=True
            ).data
            # Limpiar opciones si no son necesarias
            representation['options'] = []
        else:
            # Para otros tipos, asegurar que todos los campos estén presentes
            if 'options' not in representation or representation['options'] is None:
                representation['options'] = []
            if 'matrix_rows' not in representation or representation['matrix_rows'] is None:
                representation['matrix_rows'] = []
            if 'matrix_columns' not in representation or representation['matrix_columns'] is None:
                representation['matrix_columns'] = []
        
        return representation
    
    def create(self, validated_data):
        # Extraer datos anidados antes de crear la pregunta
        options_data = validated_data.pop('options', [])
        matrix_rows_data = validated_data.pop('matrix_rows', [])
        matrix_columns_data = validated_data.pop('matrix_columns', [])
        
        question = Question.objects.create(**validated_data)
        
        # Crear opciones si existen
        if options_data:
            for idx, option_data in enumerate(options_data):
                # Si es un dict, usar directamente; si tiene id, excluirlo para crear nuevo
                option_dict = dict(option_data) if isinstance(option_data, dict) else {}
                option_dict.pop('id', None)  # Remover id si existe para crear nuevo
                option_dict['order'] = option_dict.get('order', idx)
                Option.objects.create(question=question, **option_dict)
        
        # Crear filas de matriz si existen
        if matrix_rows_data:
            for idx, row_data in enumerate(matrix_rows_data):
                row_dict = dict(row_data) if isinstance(row_data, dict) else {}
                row_dict.pop('id', None)
                row_dict['order'] = row_dict.get('order', idx)
                MatrixRow.objects.create(question=question, **row_dict)
        
        # Crear columnas de matriz si existen
        if matrix_columns_data:
            for idx, column_data in enumerate(matrix_columns_data):
                col_dict = dict(column_data) if isinstance(column_data, dict) else {}
                col_dict.pop('id', None)
                col_dict['order'] = col_dict.get('order', idx)
                MatrixColumn.objects.create(question=question, **col_dict)
        
        return question

    def update(self, instance, validated_data):
        """
        Actualiza la pregunta y sus relaciones sin borrar todo,
        para no perder estadísticas/respuestas existentes.
        """
        options_data = validated_data.pop('options', None)
        matrix_rows_data = validated_data.pop('matrix_rows', None)
        matrix_columns_data = validated_data.pop('matrix_columns', None)

        # Campos simples de la pregunta
        instance.text = validated_data.get('text', instance.text)
        instance.question_type = validated_data.get('question_type', instance.question_type)
        instance.is_required = validated_data.get('is_required', instance.is_required)
        instance.order = validated_data.get('order', instance.order)
        instance.save()

        # ----- Opciones (single / multiple) -----
        if options_data is not None:
            existing_options = {opt.id: opt for opt in instance.options.all()}
            used_ids = set()

            for idx, option_data in enumerate(options_data):
                option_dict = dict(option_data)
                opt_id = option_dict.pop('id', None)

                # Asegurar orden consistente
                option_dict['order'] = option_dict.get('order', idx)

                if opt_id and opt_id in existing_options:
                    # Actualizar opción existente (se mantienen los Answer vinculados)
                    opt = existing_options[opt_id]
                    opt.text = option_dict.get('text', opt.text)
                    opt.order = option_dict.get('order', opt.order)
                    opt.save()
                    used_ids.add(opt_id)
                else:
                    # Crear nueva opción
                    new_opt = Option.objects.create(question=instance, **option_dict)
                    used_ids.add(new_opt.id)

            # Eliminar opciones que ya no están en el payload -> se eliminan también sus Answers
            to_delete = [opt_id for opt_id in existing_options.keys() if opt_id not in used_ids]
            if to_delete:
                instance.options.filter(id__in=to_delete).delete()

        # ----- Filas de matriz -----
        if matrix_rows_data is not None:
            existing_rows = {row.id: row for row in instance.matrix_rows.all()}
            used_row_ids = set()

            for idx, row_data in enumerate(matrix_rows_data):
                row_dict = dict(row_data)
                row_id = row_dict.pop('id', None)
                row_dict['order'] = row_dict.get('order', idx)

                if row_id and row_id in existing_rows:
                    row = existing_rows[row_id]
                    row.text = row_dict.get('text', row.text)
                    row.order = row_dict.get('order', row.order)
                    row.save()
                    used_row_ids.add(row_id)
                else:
                    new_row = MatrixRow.objects.create(question=instance, **row_dict)
                    used_row_ids.add(new_row.id)

            # Eliminar filas que ya no estén -> se eliminan también sus Answers asociados
            rows_to_delete = [row_id for row_id in existing_rows.keys() if row_id not in used_row_ids]
            if rows_to_delete:
                instance.matrix_rows.filter(id__in=rows_to_delete).delete()

        # ----- Columnas de matriz -----
        if matrix_columns_data is not None:
            existing_cols = {col.id: col for col in instance.matrix_columns.all()}
            used_col_ids = set()

            for idx, col_data in enumerate(matrix_columns_data):
                col_dict = dict(col_data)
                col_id = col_dict.pop('id', None)
                col_dict['order'] = col_dict.get('order', idx)

                if col_id and col_id in existing_cols:
                    col = existing_cols[col_id]
                    col.text = col_dict.get('text', col.text)
                    col.order = col_dict.get('order', col.order)
                    col.save()
                    used_col_ids.add(col_id)
                else:
                    new_col = MatrixColumn.objects.create(question=instance, **col_dict)
                    used_col_ids.add(new_col.id)

            # Eliminar columnas que ya no estén
            cols_to_delete = [col_id for col_id in existing_cols.keys() if col_id not in used_col_ids]
            if cols_to_delete:
                instance.matrix_columns.filter(id__in=cols_to_delete).delete()

        return instance


class SurveySerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, required=False)
    creator_name = serializers.CharField(source='creator.username', read_only=True)
    assigned_viewers = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.all(),
        required=False,
        allow_null=True
    )
    is_open = serializers.BooleanField(read_only=True)
    total_responses = serializers.IntegerField(read_only=True)

    class Meta:
        model = Survey
        fields = ['id', 'title', 'description', 'creator', 'creator_name',
                  'start_date', 'end_date', 'is_active', 'created_at', 
                  'updated_at', 'questions', 'assigned_viewers', 
                  'is_open', 'total_responses']
        read_only_fields = ['id', 'creator', 'created_at', 'updated_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Ya se establece el queryset completo en la definición; se conserva por compatibilidad
        pass

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        assigned_viewers = validated_data.pop('assigned_viewers', [])
        
        survey = Survey.objects.create(
            creator=self.context['request'].user,
            **validated_data
        )
        
        survey.assigned_viewers.set(assigned_viewers)
        
        for question_data in questions_data:
            QuestionSerializer(context=self.context).create({
                **question_data,
                'survey': survey
            })
        
        return survey

    def update(self, instance, validated_data):
        """
        Update de encuesta que intenta conservar preguntas y respuestas
        cuando sea posible (no borra todo indiscriminadamente).
        """
        questions_data = validated_data.pop('questions', None)
        assigned_viewers = validated_data.pop('assigned_viewers', None)

        instance.title = validated_data.get('title', instance.title)
        instance.description = validated_data.get('description', instance.description)
        instance.start_date = validated_data.get('start_date', instance.start_date)
        instance.end_date = validated_data.get('end_date', instance.end_date)
        instance.is_active = validated_data.get('is_active', instance.is_active)
        instance.save()

        if assigned_viewers is not None:
            instance.assigned_viewers.set(assigned_viewers)

        if questions_data is not None:
            # Mapear preguntas existentes por id para reusar cuando sea posible
            existing_questions = {q.id: q for q in instance.questions.all()}
            sent_ids = set()

            for q_data in questions_data:
                q_dict = dict(q_data)
                q_id = q_dict.get('id')

                if q_id and q_id in existing_questions:
                    # Actualizar pregunta existente (y sus opciones/matriz) usando su serializer
                    question_instance = existing_questions[q_id]
                    QuestionSerializer(
                        instance=question_instance,
                        data=q_dict,
                        context=self.context,
                        partial=True
                    ).is_valid(raise_exception=True)
                    QuestionSerializer(
                        instance=question_instance,
                        data=q_dict,
                        context=self.context,
                        partial=True
                    ).save()
                    sent_ids.add(q_id)
                else:
                    # Crear nueva pregunta
                    QuestionSerializer(context=self.context).create({
                        **q_dict,
                        'survey': instance
                    })

            # Opcional: eliminar preguntas que ya no vengan en el payload
            # (esto también elimina sus Answers asociados por cascade)
            to_delete = [qid for qid in existing_questions.keys() if qid not in sent_ids]
            if to_delete:
                instance.questions.filter(id__in=to_delete).delete()

        return instance

    def validate_assigned_viewers(self, value):
        """Asegura que solo se asignen usuarios con rol viewer"""
        invalid_users = [user.username for user in value if user.role != 'viewer']
        if invalid_users:
            raise serializers.ValidationError(
                f"Los siguientes usuarios no son visualizadores: {', '.join(invalid_users)}"
            )
        return value


class SurveyPublicSerializer(serializers.ModelSerializer):
    """Serializer para mostrar encuestas públicas (sin información sensible)"""
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Survey
        fields = ['id', 'title', 'description', 'start_date', 'end_date', 
                  'questions', 'is_open']


class AnswerSerializer(serializers.ModelSerializer):
    selected_option = serializers.PrimaryKeyRelatedField(
        queryset=Option.objects.all(),
        required=False,
        allow_null=True
    )
    matrix_row = serializers.PrimaryKeyRelatedField(
        queryset=MatrixRow.objects.all(),
        required=False,
        allow_null=True
    )
    matrix_column = serializers.PrimaryKeyRelatedField(
        queryset=MatrixColumn.objects.all(),
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = Answer
        fields = ['question', 'selected_option', 'matrix_row', 
                  'matrix_column', 'text_answer']


class ResponseSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True)
    respondent_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    respondent_email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Response
        fields = ['survey', 'respondent_name', 'respondent_email', 'answers']

    def create(self, validated_data):
        answers_data = validated_data.pop('answers')
        request = self.context.get('request')
        
        response = Response.objects.create(
            ip_address=request.META.get('REMOTE_ADDR') if request else None,
            **validated_data
        )
        
        # Crear respuestas (answers) para cada pregunta
        created_answers = []
        for answer_data in answers_data:
            try:
                # El serializer ya validó los datos, así que podemos usarlos directamente
                # answer_data ya contiene los objetos ForeignKey correctos
                answer = Answer.objects.create(
                    response=response,
                    question=answer_data.get('question'),
                    selected_option=answer_data.get('selected_option'),
                    matrix_row=answer_data.get('matrix_row'),
                    matrix_column=answer_data.get('matrix_column'),
                    text_answer=answer_data.get('text_answer', '')
                )
                created_answers.append(answer)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f'Error creando answer: {str(e)}, data: {answer_data}')
                import traceback
                logger.error(traceback.format_exc())
                # Continuar con las demás respuestas
                continue
        
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f'Response {response.id} creada con {len(created_answers)} answers de {len(answers_data)} esperados')
        
        if len(created_answers) != len(answers_data):
            logger.warning(f'No se crearon todas las respuestas. Esperadas: {len(answers_data)}, Creadas: {len(created_answers)}')
        
        return response

