# 🐸 Gmail OTP Extension (Frogus)

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.1.5-green.svg)](https://github.com/froggychips/gmail-otp-extension)

**Gmail OTP Extension** is an Open Source tool that saves you 20 seconds with every login. It automatically finds One-Time Passcodes (OTP) in your Gmail and allows you to paste them with a single click, without switching to your mail tab.

[📥 Install from Chrome Web Store (Recommended)](#) | [💎 Get Pro Version](#how-to-get-pro)

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
| **Auto-Magic Fill** (Auto insertion)| ❌   | ✅    |
| **Telegram Forwarding**           | ❌   | ✅    |
| **Accelerated Monitoring** (Fast)  | ❌   | ✅    |
| **Unlimited History & Search**    | ❌   | ✅    |
| **Custom Regex Rules**            | ❌   | ✅    |
| **Unlimited Gmail Accounts**      | ❌   | ✅    |

---

## 💎 How to get Pro?

To support the project and unlock all features, you can purchase a license key:

-   **International / Crypto:** [Buy via Sellix / Gumroad](#)
-   **Russian Cards / RU Passport:** [Buy via Lava.top / Boosty](#)
-   **Direct Telegram:** [Contact via @your_bot](#)

*After purchase, you will receive a key like `PRO-XXXX-XXXX`. Enter it in the "Tools" tab of the extension.*

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

[📥 Установить из Chrome Web Store (Рекомендуется)](#) | [💎 Купить Pro Версию](#как-получить-pro)

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

## 💎 Freemium: Бесплатно vs Pro

| Возможность                           | Free | Pro   |
| :-------------------------------- | :--: | :---: |
| Поиск OTP в 1 клик             | ✅   | ✅    |
| Поддержка 1 аккаунта Gmail          | ✅   | ✅    |
| Контекстное меню (Paste OTP)          | ✅   | ✅    |
| **Auto-Magic Fill** (Авто-вставка) | ❌   | ✅    |
| **Пересылка в Telegram**           | ❌   | ✅    |
| **Ускоренный мониторинг** (Fast)   | ❌   | ✅    |
| **Безлимитная история и Поиск**    | ❌   | ✅    |
| **Свои Regex-правила**             | ❌   | ✅    |
| **Безлимитные аккаунты Gmail**     | ❌   | ✅    |

---

## 💎 Как получить Pro?

Чтобы поддержать проект и разблокировать все функции, вы можете приобрести лицензионный ключ:

-   **Карты РФ / СБП:** [Купить через Lava.top / Boosty](#)
-   **Зарубежные карты / Крипта:** [Купить через Sellix](#)
-   **Через Telegram:** [Связаться с @your_bot](#)

*После оплаты вы получите ключ формата `PRO-XXXX-XXXX`. Введите его на вкладке «Инструменты» (Tools) внутри расширения.*

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
