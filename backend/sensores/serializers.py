from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import LeituraEnergia

class LeituraEnergiaSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeituraEnergia
        fields = '__all__' # Envia ID, sensor_id, voltagem, corrente, potencia e timestamp

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Adiciona o nome do usuário dentro do Token (opcional)
        token['name'] = user.first_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Adiciona o nome do usuário na RESPOSTA do JSON (O que o React lê)
        data['first_name'] = self.user.first_name or self.user.username
        data['email'] = self.user.email
        return data
