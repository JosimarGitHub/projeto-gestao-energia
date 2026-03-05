from django.db import models

class LeituraEnergia(models.Model):
    # Definimos primary_key=True mas deixamos o banco lidar com a restrição real
    timestamp = models.DateTimeField(primary_key=True) 
    sensor_id = models.TextField()
    tensao = models.FloatField()
    corrente = models.FloatField()
    potencia = models.FloatField()
    consumo = models.FloatField()

    class Meta:
        db_table = 'leitura_energia'
        managed = True
