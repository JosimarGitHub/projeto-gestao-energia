from django.shortcuts import render
from rest_framework import generics
from .models import LeituraEnergia
from .serializers import LeituraEnergiaSerializer

class LeituraEnergiaList(generics.ListAPIView):
    # Retorna apenas as últimas 50 leituras para o gráfico do React
    queryset = LeituraEnergia.objects.all().order_by('-timestamp')[:50]
    serializer_class = LeituraEnergiaSerializer