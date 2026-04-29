# TCG Dev Edition — Makefile

.PHONY: up down build logs clean certs fclean re

## Lance tous les services
up:
	docker compose up -d

## Stoppe tous les services
down:
	docker compose down

## Rebuild et relance
build:
	docker compose up -d --build

## Affiche les logs en live
logs:
	docker compose logs -f

## Stoppe et supprime les volumes (reset complet)
clean:
	docker compose down -v

fclean: clean
	docker system prune -af

re: fclean build

## Génère des certificats SSL auto-signés pour le dev local
certs:
	mkdir -p nginx/certs
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout nginx/certs/key.pem \
		-out nginx/certs/cert.pem \
		-subj "/C=FR/ST=IDF/L=Paris/O=TCG/CN=localhost"
	@echo "Certificats générés dans nginx/certs/"