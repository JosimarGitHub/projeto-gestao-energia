import os
import sys
import django
import json
import paho.mqtt.client as mqtt

# Add backend directory to Python path so Django can find the core module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configura o ambiente do Django para o script funcionar "fora" do servidor web
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from sensores.models import LeituraEnergia

def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print(f"Conectado ao Broker Mosquitto com sucesso!")
        client.subscribe("sensor/energia/+")
    else:
        print(f"Falha na conexão. Código: {reason_code}")

def on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode())
        # Extrai o ID do sensor a partir do tópico (ex: casa_01)
        sensor_id = msg.topic.split('/')[-1]
        
        # Salva no Banco de Dados (TimescaleDB via Django)
        LeituraEnergia.objects.create(
            sensor_id=sensor_id,
            tensao=data.get('v', 0),
            corrente=data.get('i', 0),
            potencia=data.get('p', 0),
            consumo=data.get('c', 0),
            timestamp=django.utils.timezone.now()
        )
        print(f"Dados salvos: {sensor_id} -> {data}")
    except Exception as e:
        print(f"Erro ao processar mensagem: {e}")

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.on_connect = on_connect
client.on_message = on_message

# 'mosquitto' é o nome do serviço no seu docker-compose.yml
client.connect("mosquitto", 1883, 60)
client.loop_forever()
