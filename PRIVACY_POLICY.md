# Privacy Policy for Gmail OTP

**Effective Date:** February 24, 2026

## Introduction

**Gmail OTP** (the "Extension") helps users find one-time passwords (OTP) and verification codes in Gmail.
We designed the Extension to process data locally and minimize data exposure.

## Data We Access

The Extension requests Gmail read access (`https://www.googleapis.com/auth/gmail.readonly`) and reads only data required for OTP detection:

1. Email subject
2. Email snippet
3. Parsed email body text
4. Sender/domain and message metadata needed for ranking and history

## Why We Access This Data

We use this data only to:

1. Detect OTP/verification codes
2. Display detected codes in the extension popup/history
3. Support user actions such as correcting/ignoring detected codes
4. Improve local detection behavior using local preferences

## Local Processing and Storage

- OTP detection and scoring are performed locally in the browser.
- Operational settings and history are stored locally using `chrome.storage.local`.
- Data stored locally may include account metadata, search settings, local logs, OTP history, allowlist/blocklist, and detection preferences.

## Data Sharing, Selling, and Advertising

- No email content, metadata, or extracted OTP codes are sent to our own servers.
- We do not sell personal data.
- We do not use personal data for advertising.
- We do not transfer data to data brokers.

## Third-Party Services

The Extension communicates directly with Google APIs for user-authorized Gmail access.
Google’s handling is governed by [Google Privacy Policy](https://policies.google.com/privacy).

## Security Practices

- HTTPS-only insertion targets for OTP paste flow.
- Optional site allowlist for OTP insertion.
- Optional clipboard auto-clear after copying OTP.
- No OTP logging to page console.

## Data Retention and User Control

- Local data remains on the user’s device until the user clears extension data or uninstalls the extension.
- Users can revoke Google access anytime via [Google Account permissions](https://myaccount.google.com/permissions).

## Remote Code

The Extension does not execute remotely hosted code.

## Policy Updates

We may update this policy over time. The effective date above will be updated when changes are made.

## Contact

For privacy questions, contact the developer via the support link in the Chrome Web Store listing.

---

# Политика конфиденциальности Gmail OTP

**Дата вступления в силу:** 24 февраля 2026

## Введение

**Gmail OTP** («Расширение») помогает находить OTP и коды подтверждения в Gmail.
Расширение спроектировано так, чтобы обрабатывать данные локально и минимизировать их передачу.

## Какие данные доступны расширению

Расширение запрашивает доступ Gmail read-only (`https://www.googleapis.com/auth/gmail.readonly`) и использует только данные, необходимые для распознавания OTP:

1. Тема письма
2. Фрагмент письма (snippet)
3. Извлеченный текст тела письма
4. Домен/отправитель и служебные метаданные для ранжирования и истории

## Зачем нужен доступ

Данные используются только для:

1. Поиска OTP/кодов подтверждения
2. Отображения найденных кодов в popup/истории
3. Поддержки действий пользователя (исправить/игнорировать код)
4. Локальной настройки качества распознавания

## Локальная обработка и хранение

- Распознавание и ранжирование OTP выполняется локально в браузере.
- Настройки и история хранятся локально в `chrome.storage.local`.
- Локально могут храниться: метаданные аккаунтов, параметры поиска, логи, история OTP, allowlist/blocklist и предпочтения распознавания.

## Передача, продажа и реклама

- Содержимое писем, метаданные и OTP-коды не отправляются на серверы разработчика.
- Мы не продаём персональные данные.
- Мы не используем данные для рекламы.
- Мы не передаём данные брокерам данных.

## Сторонние сервисы

Расширение напрямую взаимодействует с Google API для доступа к Gmail по разрешению пользователя.
Обработка на стороне Google регулируется [политикой конфиденциальности Google](https://policies.google.com/privacy).

## Меры безопасности

- Вставка OTP только на HTTPS-страницах.
- Опциональный allowlist сайтов для вставки OTP.
- Опциональная автоочистка буфера обмена.
- OTP не логируются в консоль страницы.

## Срок хранения и контроль пользователя

- Локальные данные хранятся на устройстве пользователя до очистки данных расширения или удаления расширения.
- Пользователь может отозвать доступ к Google-аккаунту через [настройки разрешений Google](https://myaccount.google.com/permissions).

## Удалённый код

Расширение не выполняет удалённо загружаемый код.

## Обновления политики

Политика может обновляться. При изменениях обновляется дата вступления в силу.

## Контакты

По вопросам конфиденциальности используйте ссылку поддержки в карточке расширения в Chrome Web Store.
