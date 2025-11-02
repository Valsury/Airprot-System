# Быстрый старт

## Локальная установка

### 1. Установите зависимости
```bash
npm run install-all
```

### 2. Настройте PostgreSQL

Создайте базу данных:
```sql
CREATE DATABASE airport_db;
```

### 3. Создайте файл `server/.env`
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/airport_db
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:3000
```

### 4. Запустите приложение
```bash
npm run dev
```

Приложение будет доступно:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### 5. Войдите в систему

Откройте http://localhost:3000 и используйте:
- **Username:** admin
- **Password:** admin123

---

## Деплой на Render (бесплатно)

1. Загрузите код в GitHub/GitLab
2. Следуйте инструкциям в `DEPLOY.md`
3. Или используйте автоматический деплой через `render.yaml`

---

**Готово!** 🎉
