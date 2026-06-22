# Используем официальный Node.js образ на базе Debian (slim) для легкой установки Python
FROM node:20-slim AS builder

WORKDIR /app

# Устанавливаем системные зависимости: Python 3, pip и необходимые утилиты
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Создаем виртуальное окружение Python и устанавливаем зависимости
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Устанавливаем Node.js зависимости
COPY package*.json ./
RUN npm ci

# Копируем исходный код проекта
COPY . .

# Собираем Next.js приложение
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# -----------------
# Финальный легковесный образ
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PATH="/opt/venv/bin:$PATH"

RUN apt-get update && apt-get install -y \
    python3 \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Копируем собранное виртуальное окружение Python из билдера
COPY --from=builder /opt/venv /opt/venv

# Копируем собранное приложение и необходимые файлы
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "start"]
