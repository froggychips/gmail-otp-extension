# 🐸 Gmail OTP Extension (Frogus)

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.1.3-green.svg)](https://github.com/froggychips/gmail-otp-extension)

**Gmail OTP Extension** is an Open Source tool that saves you 20 seconds with every login. It automatically finds One-Time Passcodes (OTP) in your Gmail and allows you to paste them with a single click, without switching to your mail tab.

[📥 Install from Chrome Web Store (Recommended)](https://chrome.google.com/webstore/detail/gmail-otp-extension/YOUR_EXTENSION_ID) | [💎 Get Pro Version](https://your-pro-version-link.com)

---

## ✨ Why is it convenient?
-   **No Context Switching:** The code appears directly in the extension or context menu.
-   **Smart Detector (Entropy Mode):** Finds codes even in complex emails (Steam, Facebook, Binance, bank notifications).
-   **100% Local:** All emails are processed within your browser. We do not see your mail.

## 🛡️ Security and Privacy
We take security seriously:
1.  **OAuth 2.0:** We do not ask for your Google password. Access is granted via the official Google Identity API.
2.  **Read-Only:** The extension only has *read* access to your emails. We cannot delete or send anything.
3.  **No Cloud:** We do not have servers that store your data. Emails are scanned locally.
4.  **Open Source:** You can personally review the code of every function in this repository.

---

## 💎 Freemium: Free vs Pro

| Feature                           | Free | Pro   |
| :-------------------------------- | :--: | :---: |
| 1-Click OTP Retrieval             | ✅   | ✅    |
| Supports 1 Gmail Account          | ✅   | ✅    |
| Context Menu (Paste OTP)          | ✅   | ✅    |
| **Automatic Monitoring (Watch Mode)** | ❌   | ✅    |
| **Multi-account Support**         | ❌   | ✅    |
| **Priority Deep Scan (Code History)** | ❌   | ✅    |
| **Custom Sender Rules**           | ❌   | ✅    |

> **Why pay for Pro?** The paid version allows the extension to run in the background and notify you of a code the moment an email arrives. It's the Apple Ecosystem level of convenience for any website.

---

## 🚀 Getting Started (For Developers)

If you want to build the extension manually:

1.  Clone the repository:
    ```bash
    git clone https://github.com/froggychips/gmail-otp-extension.git
    ```
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Enable **Developer mode**.
4.  Click **Load unpacked** and select the project folder.

*Note: Manual installation will not receive automatic updates.*

## 🛠 Technologies
-   **Manifest V3** (current Chrome standard)
-   **Gmail API** (via OAuth2)
-   **Entropy Detection Engine** (custom code probability assessment algorithm)

## ⚖️ License
This project is licensed under **AGPLv3**. You are free to use and modify the code, but you must retain attribution and open source your derivative works.

---
Developed with ❤️ for those who hate typing codes manually.

---
---

# 🐸 Gmail OTP Extension (Frogus) - Русский

**Gmail OTP Extension** — это Open Source инструмент, который экономит вам 20 секунд при каждом входе в систему. Он автоматически находит одноразовые коды (OTP) в вашем Gmail и позволяет вставить их в один клик, не переключаясь на вкладку почты.

[📥 Установить из Chrome Web Store (Рекомендуется)](https://chrome.google.com/webstore/detail/gmail-otp-extension/YOUR_EXTENSION_ID) | [💎 Купить Pro Версию](https://your-pro-version-link.com)

---

## ✨ Почему это удобно?
-   **Никакого переключения контекста:** Код появляется прямо в расширении или контекстном меню.
-   **Умный детектор (Entropy Mode):** Находит коды даже в сложных письмах (Steam, Facebook, Binance, банковские уведомления).
-   **100% Локально:** Все письма обрабатываются внутри вашего браузера. Мы не видим вашу почту.

## 🛡️ Безопасность и Конфиденциальность
Мы серьезно относимся к безопасности:
1.  **OAuth 2.0:** Мы не запрашиваем ваш пароль от Google. Доступ идет через официальный Google Identity API.
2.  **Read-Only:** Расширение имеет доступ только на *чтение* писем. Мы не можем ничего удалить или отправить.
3.  **No Cloud:** У нас нет серверов, которые хранят ваши данные. Письма сканируются локально.
4.  **Open Source:** Вы можете лично проверить код каждой функции в этом репозитории.

---

## 💎 Freemium: Free vs Pro

| Возможность                           | Free | Pro   |
| :-------------------------------- | :--: | :---: |
| Поиск OTP в 1 клик             | ✅   | ✅    |
| Поддержка 1 аккаунта Gmail          | ✅   | ✅    |
| Контекстное меню (Paste OTP)          | ✅   | ✅    |
| **Автоматический мониторинг (Watch Mode)** | ❌   | ✅    |
| **Поддержка нескольких аккаунтов (Multi-account)** | ❌   | ✅    |
| **Приоритетный Deep Scan (История кодов)** | ❌   | ✅    |
| **Кастомные правила для отправителей**   | ❌   | ✅    |

> **Зачем платить за Pro?** Платная версия позволяет расширению работать в фоне и уведомлять вас о коде в ту же секунду, когда письмо упало в ящик. Это уровень комфорта Apple Ecosystem для любого сайта.

---

## 🚀 Как начать (Разработчикам)

Если вы хотите собрать расширение вручную:

1.  Клонируйте репозиторий:
    ```bash
    git clone https://github.com/froggychips/gmail-otp-extension.git
    ```
2.  Откройте Chrome и перейдите в `chrome://extensions/`.
3.  Включите **Developer mode**.
4.  Нажмите **Load unpacked** и выберите папку с проектом.

*Примечание: При ручной установке обновления не будут приходить автоматически.*

## 🛠 Технологии
-   **Manifest V3** (актуальный стандарт Chrome)
-   **Gmail API** (через OAuth2)
-   **Entropy Detection Engine** (собственный алгоритм оценки вероятности кода)

## ⚖️ Лицензия
Этот проект распространяется под лицензией **AGPLv3**. Вы можете свободно использовать и изменять код, но обязаны сохранять авторство и открывать исходный код своих производных работ.

---
Разработано с ❤️ для тех, кто ненавидит вводить коды вручную.
