#!/bin/sh

# Espera o banco de dados ficar pronto
echo "Aguardando o banco de dados..."
sleep 5

# Roda as migrações automaticamente
python manage.py migrate --noinput

# Inicia o comando passado pelo Docker Compose
exec "$@"
