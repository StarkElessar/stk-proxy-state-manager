# stk-proxy-state-manager

Лёгкая TypeScript-библиотека для реактивного управления состоянием на основе [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy). Без лишних зависимостей, с полной типизацией и встроенной системой подписок.

---

## Содержание

- [Что это такое?](#что-это-такое)
- [Установка](#установка)
- [Быстрый старт](#быстрый-старт)
- [API](#api)
  - [Конструктор](#конструктор)
  - [state](#state)
  - [get](#get)
  - [set](#set)
  - [update](#update)
  - [subscribe](#subscribe)
- [Примеры](#примеры)
- [Разработка](#разработка)
- [Тесты](#тесты)
- [Сборка](#сборка)
- [Линтинг](#линтинг)

---

## Что это такое?

`stk-proxy-state-manager` — это класс-обёртка над JavaScript `Proxy`, который позволяет:

- хранить состояние приложения в одном месте;
- **реактивно** подписываться на изменения конкретных полей;
- получать и устанавливать значения с полной **TypeScript-типизацией**;
- использовать как в браузере, так и в Node.js / серверном окружении.

Библиотека не тянет за собой никаких рантайм-зависимостей.

---

## Установка

### Из npm (если опубликована)

```bash
npm install stk-proxy-state-manager
```

### Из GitHub

```bash
npm install github:your-username/stk-proxy-state-manager
```

### Локально (для разработки)

```bash
git clone https://github.com/your-username/stk-proxy-state-manager.git
cd stk-proxy-state-manager
npm install
npm run build
```

---

## Быстрый старт

```typescript
import { StkProxyStateManager } from 'stk-proxy-state-manager';

// 1. Описываем тип состояния
type AppState = {
  count: number;
  user: string;
};

// 2. Создаём менеджер с начальным состоянием
const manager = new StkProxyStateManager<AppState>({
  count: 0,
  user: 'Alice',
});

// 3. Подписываемся на изменение поля
const unsubscribe = manager.subscribe(
	'count',
	(newCount) => {
		console.log('count изменился:', newCount);
	}
);

// 4. Меняем значение — подписчик сработает автоматически
manager.set('count', 42); // → "count изменился: 42"

// 5. Отписываемся, когда нужно
unsubscribe();
```

---

## API

### Конструктор

```typescript
new StkProxyStateManager<State>(initialState: State)
```

Создаёт менеджер состояния с начальными значениями.

> ⚠️ Нельзя добавить новые ключи после создания — только те, что переданы в `initialState`.

```typescript
const manager = new StkProxyStateManager({ theme: 'dark', lang: 'ru' });
```

---

### `state`

```typescript
manager.state // Readonly<State>
```

Геттер, возвращающий всё состояние целиком как объект **только для чтения**.

```typescript
console.log(manager.state.theme); // 'dark'
```

---

### `get`

```typescript
manager.get(key: K): State[K]
```

Возвращает значение конкретного поля. Тип возвращаемого значения определяется автоматически.

```typescript
const lang = manager.get('lang'); // 'ru'
```

---

### `set`

```typescript
manager.set(key: K, value: State[K]): void;
```

Устанавливает новое значение поля. Если новое значение **равно** текущему — подписчики **не вызываются**.

```typescript
manager.set('lang', 'en'); // изменит и уведомит подписчиков
manager.set('lang', 'en'); // ничего не произойдёт — значение то же
```

---

### `update`

```typescript
manager.update(updater: (prevState: Readonly<State>) => State): void;
```

Обновляет несколько полей за раз. Принимает функцию, которая получает текущее состояние и возвращает объект с изменениями.

```typescript
manager.update((prev) => ({
  ...prev,
  theme: 'light',
  lang: 'de',
}));
```

> Для каждого изменённого поля подписчики уведомляются отдельно.

---

### `subscribe`

```typescript
manager.subscribe(
  key: K,
  callback: (newValue: State[K]) => void,
  options?: { emitImmediately?: boolean }
): () => void;
```

Подписывается на изменение конкретного поля. Возвращает функцию **отписки**.

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| `key` | `keyof State` | — | Поле, за которым следим |
| `callback` | `(newValue) => void` | — | Вызывается при каждом изменении |
| `options.emitImmediately` | `boolean` | `false` | Если `true` — callback вызовется сразу с текущим значением |

```typescript
// Обычная подписка
const unsub = manager.subscribe(
	'theme',
	(theme) => {
		document.body.dataset.theme = theme;
	}
);

// С немедленным вызовом (удобно для инициализации UI)
manager.subscribe(
	'theme',
	(theme) => {
		document.body.dataset.theme = theme;
	},
	{ emitImmediately: true }
);

// Отписка
unsub();
```

---

## Примеры

### Счётчик

```typescript
const counter = new StkProxyStateManager({ value: 0 });

counter.subscribe('value', (v) => console.log('Счётчик:', v));

counter.set('value', counter.get('value') + 1); // Счётчик: 1
counter.set('value', counter.get('value') + 1); // Счётчик: 2
```

### Несколько подписчиков на одно поле

```typescript
const store = new StkProxyStateManager({ status: 'idle' });

store.subscribe('status', (s) => console.log('Logger:', s));
store.subscribe('status', (s) => updateUI(s));

store.set('status', 'loading'); // Оба callback сработают
```

### Отписка при размонтировании компонента

```typescript
const manager = new StkProxyStateManager({ visible: false });

// При монтировании
const unsub = manager.subscribe('visible', (v) => render(v));

// При размонтировании
unsub();
```

---

## Разработка

```bash
# Установка зависимостей
npm install

# Сборка в режиме watch (пересборка при изменениях)
npm run dev
```

---

## Тесты

```bash
# Запустить тесты один раз
npm run test

# Запустить тесты в режиме наблюдения (пересборка при изменениях)
npm run test:watch
```

Тесты написаны с использованием [Rstest](https://rstest.rs/) и находятся в папке `tests/`.

---

## Сборка

```bash
npm run build
```

Собранные файлы появятся в папке `dist/`:

| Файл | Формат | Назначение |
|---|---|---|
| `dist/index.js` | ESM | Современные сборщики (Vite, Webpack 5, etc.) |
| `dist/index.cjs` | CommonJS | Node.js, старые сборщики |
| `dist/index.d.ts` | TypeScript | Типы для IDE и компилятора |

---

## Линтинг

```bash
# Проверка кода
npm run lint

# Автоматическое исправление ошибок
npm run lint:fix
```

---

## Структура проекта

```
stk-proxy-state-manager/
├── src/
│   ├── index.ts                    ← публичная точка входа
│   ├── stk-proxy-state-manager.ts  ← основной класс
│   ├── types.ts                    ← TypeScript-типы
│   └── env.d.ts                    ← объявления окружения
├── tests/
│   └── stk-proxy-state-manager.test.ts
├── dist/                           ← собранная библиотека (после build)
├── package.json
├── tsconfig.json
└── rslib.config.ts                 ← конфигурация сборщика
```

---

## Требования

- **Node.js** ≥ 18
- **TypeScript** ≥ 5

---

## Лицензия

MIT
