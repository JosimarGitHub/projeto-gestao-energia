from rest_framework import serializers
from .models import LeituraEnergia

class LeituraEnergiaSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeituraEnergia
        fields = '__all__' # Envia ID, sensor_id, voltagem, corrente, potencia e timestamp
