# Исправление ошибки деплоя Frontend

## Проблема
Build Command содержит опечатку: `yarn instacd client && npm install && npm run buildll`

## Решение

1. Откройте ваш Static Site `airport-system-app` в Render Dashboard
2. Перейдите на вкладку **"Settings"**
3. Найдите секцию **"Build Command"**
4. Измените команду на:
   ```
   cd client && npm install && npm run build
   ```
5. Нажмите **"Save Changes"**
6. Render автоматически запустит новый билд

## Правильные настройки Static Site:

- **Name:** `airport-system-app`
- **Branch:** `main`
- **Root Directory:** (оставьте пустым)
- **Build Command:** `cd client && npm install && npm run build`
- **Publish Directory:** `client/build`
- **Environment Variable:**
  - Key: `REACT_APP_API_URL`
  - Value: `https://airport-system-api.onrender.com`

После сохранения дождитесь завершения билда (3-5 минут).

