# TMS GeoSun

## Цель

`tms-geosun` — веб-приложение для системы Transport Management System компании GeoSun (TMS GeoSun).  
Текущая цель: предоставить стабильный frontend и базовый backend API-слой для дальнейшей разработки модулей (включая авторизацию/аутентификацию и бизнес-фичи).

## Что уже умеет система

- Frontend на Angular 21 с маршрутизацией и базовой конфигурацией приложения.
- Поддержка i18n через `@ngx-translate/core` (язык по умолчанию: `uk`).
- Базовый backend на Google Apps Script с тестовым endpoint (`doGet` -> JSON `{ ok: true, service: "tms-geosun" }`).
- Деплой frontend на GitHub Pages через GitHub Actions (`main`/`master`).

## Как работает (высокоуровнево)

Пользователь -> Angular frontend -> Backend API (Google Apps Script / future API layer) -> Данные -> Ответ пользователю.

## Основные сущности

- **User**: пользователь системы (будущая сущность для auth и прав доступа).
- **Role**: роль пользователя (`admin`, `manager`, `user`) для RBAC.
- **Session/Token**: access/refresh контекст для авторизации запросов.
- **Feature Module**: изолированный модуль бизнес-логики, развиваемый отдельно.

## Основные API (текущее состояние)

- `GET /` (GAS `doGet`) — health-check/базовый ответ сервиса.

Планируемые API (ближайшие):

- `POST /auth/login` — вход пользователя.
- `POST /auth/refresh` — обновление токена доступа.
- `POST /auth/logout` — завершение сессии.
- `GET /auth/me` — профиль текущего пользователя.

## Структура проекта

- `frontend/` — Angular приложение.
- `backend/` — Google Apps Script код и манифест (`appsscript.json`).
- `docs/specs/` — ТЗ по фичам.
- `docs/templates/` — шаблоны ТЗ и промптов для LLM.

## Как запустить

- Frontend:
  - `cd frontend`
  - `npm install`
  - `npm start`
  - app URL: `http://localhost:4200/`
- Backend (GAS):
  - работа через `clasp` и `backend/src/Code.gs`
  - деплой как Web App в Google Apps Script (при необходимости)

## Важные правила разработки

- Разрабатывать фичи в отдельных ветках (`feature/`*, `fix/`*), не напрямую в `main/master`.
- Перед реализацией формировать/обновлять ТЗ в `docs/specs/`.
- Использовать шаблоны из `docs/templates/` для стабильного процесса с LLM.
- Не добавлять зависимости без обоснования.
- Не хранить секреты и токены в репозитории.

## Что менять осторожно

- `frontend/src/app/app.config.ts` — глобальные провайдеры, роутинг, i18n-конфигурация.
- `.github/workflows/deploy.yml` — логика деплоя на GitHub Pages.
- `backend/appsscript.json` — настройки runtime/логирования для GAS.
- `backend/src/Code.gs` — публичные web endpoint-функции (`doGet` и будущие `doPost`-роуты).

