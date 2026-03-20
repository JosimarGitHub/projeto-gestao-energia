from django.shortcuts import render
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer
from .models import LeituraEnergia
from .serializers import LeituraEnergiaSerializer
from rest_framework.response import Response
from rest_framework.decorators import api_view

class LeituraEnergiaList(generics.ListAPIView):
    permission_classes = [IsAuthenticated] # Bloqueia acesso sem Token
    serializer_class = LeituraEnergiaSerializer

    def get_queryset(self):
        queryset = LeituraEnergia.objects.all().order_by('-timestamp')
        sensor = self.request.query_params.get('sensor')
        inicio = self.request.query_params.get('inicio')
        fim = self.request.query_params.get('fim')
        
        if sensor:
            # Filtra apenas as leituras do sensor clicado
            queryset = queryset.filter(sensor_id=sensor)
        
        if inicio and fim:
            # MODO HISTÓRICO: Busca TUDO no período sem limite curto
            return queryset.filter(timestamp__range=[inicio, fim]).order_by('timestamp')
                
        return queryset[:1000] # Retorna as últimas 50 daquele sensor

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

@api_view(['GET'])
def lista_sensores_unicos(request):
    # O comando .distinct() do Postgres/Timescale pega IDs sem repetir
    sensores = LeituraEnergia.objects.values_list('sensor_id', flat=True).distinct()
    return Response(sensores)
