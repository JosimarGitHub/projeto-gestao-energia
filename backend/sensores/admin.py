from django.contrib import admin
from .models import LeituraEnergia

@admin.register(LeituraEnergia)
class LeituraEnergiaAdmin(admin.ModelAdmin):
    # Colunas que aparecerão na listagem
    list_display = ('timestamp', 'sensor_id', 'tensao', 'corrente', 'potencia', 'consumo')
    
    # Filtros laterais para facilitar a busca por tempo ou sensor
    list_filter = ('sensor_id', 'timestamp')
    
    # Ordenação padrão (mais recentes primeiro)
    ordering = ('-timestamp',)
