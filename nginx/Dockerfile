FROM nginx:alpine

# Copie la config nginx dans l'image directement
COPY nginx.conf /etc/nginx/nginx.conf

# Copie les certificats SSL dans l'image
COPY certs/ /etc/nginx/certs/

EXPOSE 80 443
