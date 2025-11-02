# Диагностика проблемы с входом

## Шаг 1: Проверьте статус базы данных

Откройте в браузере:
```
https://airport-system-api.onrender.com/api/db-status
```

**Что должно быть:**
- `tablesExist: true`
- `adminExists: true`

**Если adminExists: false** - создайте admin пользователя (см. Шаг 2)

## Шаг 2: Создайте admin пользователя (если нужно)

Откройте в браузере или используйте curl:
```
POST https://airport-system-api.onrender.com/api/create-admin
```

Или через curl:
```bash
curl -X POST https://airport-system-api.onrender.com/api/create-admin
```

Должен вернуться ответ о создании пользователя.

## Шаг 3: Проверьте логи backend

1. Откройте Render Dashboard
2. Перейдите в ваш сервис `airport-system-api`
3. Откройте вкладку **"Logs"**
4. Попробуйте войти снова
5. Посмотрите, есть ли ошибки в логах

## Шаг 4: Проверьте, что API работает

Откройте в браузере:
```
https://airport-system-api.onrender.com/api/health
```

Должен вернуться: `{"status":"OK","message":"Server is running"}`

## Шаг 5: Проверьте консоль браузера

1. Откройте ваш frontend сайт
2. Нажмите F12 (откроется Developer Tools)
3. Перейдите на вкладку **"Console"**
4. Попробуйте войти
5. Посмотрите, какие ошибки появляются

Возможные ошибки:
- **CORS error** - проблема с настройкой CORS
- **Network error** - frontend не может достучаться до API
- **404 Not Found** - неправильный URL API

## Шаг 6: Проверьте Network запросы

1. В Developer Tools перейдите на вкладку **"Network"**
2. Попробуйте войти
3. Найдите запрос к `/api/auth/login`
4. Посмотрите:
   - **Status Code** (должен быть 200)
   - **Response** (что вернул сервер)
   - **Request URL** (правильный ли URL)

## Шаг 7: Проверьте REACT_APP_API_URL

1. Откройте Render Dashboard
2. Перейдите в ваш Static Site `airport-system-app`
3. Откройте **"Environment"**
4. Проверьте, что есть переменная `REACT_APP_API_URL`
5. Значение должно быть: `https://airport-system-api.onrender.com` (без `/api` в конце!)

**Важно:** После изменения переменных окружения нужно пересобрать frontend!

## Шаг 8: Проверьте CORS на backend

Убедитесь, что в backend есть переменная `FRONTEND_URL`:
- Key: `FRONTEND_URL`
- Value: URL вашего frontend (например, `https://airport-system-app.onrender.com`)

## Частые проблемы:

### Проблема: "Invalid credentials"
**Решение:** 
- Убедитесь, что используете `admin` / `admin123`
- Проверьте через `/api/db-status`, что admin пользователь существует
- Создайте admin через `/api/create-admin` если нужно

### Проблема: CORS error
**Решение:**
- Проверьте `FRONTEND_URL` в backend environment variables
- Должен быть полный URL без слеша в конце

### Проблема: Network error / 404
**Решение:**
- Проверьте `REACT_APP_API_URL` в frontend environment variables
- Должен быть: `https://airport-system-api.onrender.com` (без `/api`)
- После изменения пересоберите frontend

### Проблема: База данных пустая
**Решение:**
- Проверьте логи backend при запуске
- Должна быть строка: `Database initialized successfully`
- Должна быть строка: `Default admin user created`
- Если нет - создайте admin через `/api/create-admin`

