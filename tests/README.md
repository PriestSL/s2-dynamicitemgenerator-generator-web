# Контрольна база етапу 0

## Оновлення етапу 1 — 6 жовтня 2026

TypeScript 6.0.3 і typescript-eslint 8.71.1 додані разом із lockfile. `npm run typecheck` перевіряє всі `src/**/*.ts` та `tests/types/**/*.ts` з strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes, noUnusedLocals/Parameters і erasableSyntaxOnly. `npm run build` виконує `tsc --noEmit && vite build`, тому помилка типів зупиняє збірку. JS збережений за явною межею міграції, без декларацій, які удають його перевіреним.

Перенесено defaults у `src/model/defaults.ts`; `src/js/configs.js` зберігає всі старі exports. Типи конфігурації, view, фракцій/класів/категорій і рангів описані в types.ts. config.ts створює незалежні глибокі копії config/baseConfig, заморожує базу й окремо ініціалізує view. Старі modified*-поля AppState тепер спрямовують читання/запис до одного config. Зовнішні JSON-поля, методи AppState і входи генератора збережені.

Правила чисел та overrides описані в [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md); values.ts перевіряє скінченність, невід'ємність, діапазони, цілочисельність count і min ≤ max. Ці функції ще не підключено до legacy UI або CFG, тож вони не видаються за виправлення F07–F09. `helmetSpawn: true` з defaults явно збережено як спадковий виняток. SID лишаються динамічними рядками; наявність посилань перевірятиметься під час імпорту в етапі 2.

Фактично перевірено:

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` — успіх на Node 26.10.0 / npm 11.19.1.
- **26/26 поведінкових тестів**: попередні 19 (включно з 12 KNOWN) та 7 нових у model.test.mjs. Повторно підтверджено обидва історичні JSON/CFG без зміни fixtures, A → B → A та ZIP round-trip.
- Тести моделі обходять усі вкладені об'єкти: defaults, вхідна конфігурація, обидві конфігурації двох редакторів не мають спільних посилань. Перевірено глибоку заморозку baseConfig, редагування config, прямі legacy writes, importState/exportState/resetState та правила числових одиниць.
- `tests/types/model.ts` містить 12 негативних compile-only перевірок: неправильні ранги/ідентифікатори/типи чисел, неповний конфіг, мутація readonly-бази, неперевірений indexed access та unknown JSON. `@ts-expect-error` застосовується лише до цих очікуваних помилок; зникнення помилки саме ламає typecheck. У production TS немає any, assertions над JSON чи вимкнень перевірок.
- У браузері відкрито production preview: початкові таблиці відображаються; Neutral / Primary / GunObrez_SG змінено клавіатурою з 90 на 120, після Armor → Primary залишилося 120; глобальну мінімальну міцність змінено з 25 на 30, після навігації залишилося 30. Журнал інструмента не показав console errors у цьому сценарії. Автоматичне очікування JSON-download завершилося тайм-аутом; браузерне завантаження файлів тут не підтверджене. JSON/CFG/ZIP перевірені модульними тестами.

Межі: AppState, UI, імпортер, генератор та REST лишаються JS; прямі записи з них можуть порушувати контракт LoadoutConfig. Наявний `view` ще не керує навігацією; baseConfig у AppState поки є базою defaults і не перемикається при старому імпорті. Порівняння/reset у UI, повна runtime-валідація, F01/F02 та інші функціональні виправлення не входять до цього етапу. REST/PAK/гра і чисте встановлення не перевірялися. Попередження Node/Vite module mode та Sass залишилися. npm install повідомив про непогоджений install script уже наявного @parcel/watcher; він не запускався додатково, build пройшов.

Ручне рев'ю: запустити чотири команди вище; переглянути types.ts, config.ts та JS-фасад; повторити зміну ваги 90 → 120 із навігацією й переконатися, що JSON має той самий формат. Для індивідуальних атрибутів і фракційних Pistols відомі F01/F02 ще очікуються. Далі наведено історичний звіт етапу 0; його результати та обмеження стосуються стану на момент того етапу.

Зафіксовано 6 жовтня 2026 року з реалізації `0352e46`. Це початкова поведінка для порівняння, а не перевірений vanilla чи еталон правильного CFG.

## Запуск і межі

```sh
npm test
npm run lint
npm run build
```

Перевірено на Windows, Node 26.10.0, npm 11.19.1 із наявними локальними залежностями. Додаткового test framework не потрібно: використано `node:test` та `node:assert/strict`. Нових залежностей немає. Чисте встановлення й Docker не перевірялися; `typecheck` з'явиться на етапі 1.

У цьому середовищі команда `npm` у PATH посилається на відсутній npm-cli.js. Фактичний запуск npm-команд виконано так (приклад для тестів):

```powershell
& 'C:\Program Files\nodejs\node.exe' 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' test
```

Результат: **19/19 тестів, lint і build успішні**. Залишилися попередні попередження module mode у Node/Vite та Sass/Bootstrap deprecations; вони не приховані й не виправляються цим етапом.

`git diff --check` показує trailing whitespace лише у двох CFG-fixtures: це збережені пробіли чинного генератора в заголовку, SID та struct.end. Їх навмисно не прибрано, щоб не змінювати контрольний вихід. Для решти файлів етапу перевірка diff проходить.

Тести викликають реальні AppState, chancesController, EventManager.importFromJSON, createLoadout та JSZip. Для полів, labels, файлового input і FileReader є мінімальні підстановки в `helpers.mjs`; це не браузер, не перевірка layout чи справжнього файлового діалогу. ZIP перевіряється на рівні JSZip з тим самим шляхом, а не натисканням кнопки generateConfig. REST не викликається. PAK і гра не перевірялися. UI-поведінка застосунку не змінена; єдина правка production-коду прибирає невикористане присвоєння `null` перед гілками, кожна з яких створює поле.

## Fixtures

| Файл | Походження та призначення |
| --- | --- |
| [defaults.json](fixtures/defaults.json) | Повний серіалізований `new AppState().exportState()`, усі 13 секцій/скалярів |
| [changed.json](fixtures/changed.json) | Незалежний повний JSON із контрольними змінами, описаними нижче |
| [defaults.cfg](fixtures/defaults.cfg) | Історичний вихід генератора: 621 666 символів до Git-перетворень EOL |
| [changed.cfg](fixtures/changed.cfg) | Історичний вихід зміненого прикладу: 625 983 символи до Git-перетворень EOL; містить F07 |

У зміненому прикладі:

- Neutral / CloseCombat / GunObrez_SG: ваги `[200, 80, 40, 10]`, minCondition `67`, maxCondition `90`, maxAmmo `0`.
- Боєприпаси SG: `[2, 7]`; глобальна міцність: `20–80`; шанс пістолета: `35`.
- Neutral / Jemmy_Neutral_Armor та GunPM_HG: ваги `[10, 20, 30, 40]`.
- Light_Neutral_Helmet: `[10, 25, 50, 100]`; GrenadeF1: chances `[10, 20, 30, 40]`.

JSON-зразків старих пресетів у робочому дереві чи доступній Git-історії не знайдено (за пошуком JSON-файлів, окрім package/lock). Вигаданих legacy fixtures немає. Обгортка `Generic_settings` відтворюється викликом чинного імпортера й не оголошується підтримуваним старим форматом.

Тести читають збережені fixtures, не регенерують їх. Для свідомого оновлення після перегляду diff є `node tests/capture-baseline.mjs --write`; без `--write` скрипт відмовляється писати. Порівняння CFG нормалізує лише CRLF → LF, зберігаючи весь інший текст, у тому числі пробіл наприкінці згенерованого заголовка. Виправлення дефекту має змінювати відповідний поведінковий тест і лише потім погоджений CFG, а не автоматично перезаписувати snapshots.

## Повторно відтворені дефекти

`KNOWN` — виконувані characterization-тести: вони перевіряють конкретний спостережений збій. Зелений результат означає «дефект відтворено». Це не skipped/todo тести й не перевірки бажаної поведінки. Після виправлення на відповідному етапі замінити їх на позитивні регресійні перевірки.

| ID | Повторне підтвердження | Межа доказу |
| --- | --- | --- |
| F01 | Реально згенеровані weapon/armor поля дають TypeError через dataset; checkbox навіть із виправленим dataset записує `on` замість false | Renderer і handler, DOM-підстановка |
| F02 | Після штатного fillSettings пістолетів немає; edit і add кидають TypeError | Контролер і незмінність даних після помилки |
| F03 | Реальний importFromJSON повідомляє success, але не викликає renderer для активної img-категорії; наступний edit змінює старий об'єкт | FileReader/DOM-підстановки; не справжній файловий picker |
| F04 | Власний JSON проходить помилкову міграцію шоломів; кількість Head у CFG змінюється 66 → 0 | Реальний імпортер і генератор |
| F07 | minCondition `67` не змінює CFG; maxAmmo `0` дає `7`, позитивний override `3` працює; maxCondition `0` дає глобальне `0.8` | CFG конкретного GunObrez_SG; не всі можливі overrides |
| F08 | Поле з `-5` має validation-error, але стан/JSON містять рядок `-5`, а validateGameConfig вважає його валідним; нульова сума дає `~NaN%` | Реальний handler/validator, DOM-підстановка |
| F09 | Шолом приймає `200`, генератор пише Chance `2`; невикористаний validateWeaponChances відхиляє відносну вагу `200` | Частково підтверджено виконанням; Armor Drop UI та інші одиниці залишаються висновками за кодом |

Відомі дефекти не узаконюються CFG snapshot-ами. Зокрема, у changed.cfg для GunObrez_SG мінімальна міцність залишається `0.2` замість індивідуального `0.67`, а AmmoMaxCount — `7` замість явного `0`. F01–F04 проявляються в шляху UI/імпорту: прямий `AppState.importState()` fixture їх обходить, тому успіх його round-trip не підтверджує справність файлового імпорту.

Окремі позитивні перевірки: повнота JSON, direct round-trip обох прикладів, збереження Newbie та решти рангів у CFG, відсутність undefined/NaN у двох CFG, A → B → A без мутації входів, точний CFG після розпакування ZIP. F05–F06, серверні частини F15/F18/F19 та PAK не перевірялись.

## Точки входу, які потрібно зберегти

Це інвентаризація поточних споживачів за кодом, а не підтвердження справності серверної інтеграції.

| Споживач | Поточний контракт |
| --- | --- |
| `Application` → `PresetsManager` | `new PresetsManager(state, chancesCtrl)`; `state.getChancesSettings()` → `chancesCtrl.fillSettings(...)`; початкове `chancesCtrl.typeToTable = state.typeToTable` |
| `PresetsManager.handleSavePresetSubmit/handleEditPresetSubmit` | `state.exportState()` як поле `data` payload; інші поля: name, author, description, created, version, pin. Поточна save-форма вимагає 8 цифр PIN |
| `PresetsManager._loadPreset` | Читає відповідь `data.data`, напряму записує modifiedWeaponSettings, modifiedArmorSettings, modifiedGrenadeSettings, modifiedAmmoByWeaponClass, modifiedWeaponList, modifiedDropConfigs, modsCompatibility, modifiedArmorSpawnSettings, modifiedHelmetSpawnSettings; викликає fillSettings(getChancesSettings()) |
| PresetsManager → Application | `window` event `presetLoaded`, detail `{ presetId, type, preset }`; Application оновлює категорію через chancesCtrl.currentCategory |
| `EventManager` → fileGenerator | Об'єкт `{ generateConfig }`; PAK: `generateConfig(appState)` із default `useRESTPacking = true`; ZIP: `generateConfig(appState, false)` |
| `generateConfig` → генератор | `await createLoadout(appState)` → текст CFG; використовується в обох шляхах. Поля AppState: modifiedWeaponSettings, modifiedArmorSettings, modifiedWeaponList, modifiedArmorSpawnSettings, modifiedHelmetSpawnSettings, modifiedDropConfigs, modifiedPistolSettings, modifiedPistolSpawnChance, modifiedMinWeaponDurability, modifiedMaxWeaponDurability, modifiedGrenadeSettings, modifiedAmmoByWeaponClass |
| `generateConfig` → PAK | `downloadPackage(fileName, cfg)`; ім'я з DOM `config_name`, fallback `Stalker2Loadout`, пробіли видаляються |
| REST pack | POST `${VITE_RESTUrl}/pack`, JSON `{ fileName, structure }`; CFG за шляхом `Stalker2/Content/GameLite/GameData/ItemGeneratorPrototypes/New_NPC_Loadouts.cfg` |
| REST exports | fetchHeaders(), getPreset(id, type), checkPin(id, pin), createPreset(presetData), updatePreset(id, presetData), deletePreset(id, pin), downloadPackage(name, data); endpoints/payload без змін |

Відомі розриви лишаються відкритими: _loadPreset не відновлює всі поля; getChancesSettings пропускає pistol; `downloadPackage` повертає `{ blob, fileName }`, тоді як generateConfig читає `resultFileName`; ZIP-гілка не очікує завершення generateAsync у своєму Promise. Майбутній фасад має зберігати потрібні точки входу, не видаючи ці дефекти за гарантії.

## Ручний огляд етапу

1. Переглянути diff defaults.json → changed.json та пару CFG, звернути увагу на GunObrez_SG і описані F07.
2. Запустити `npm test`: очікуються 19 успішних тестів, з яких 12 мають префікс KNOWN. Перевірити, що їх назви описують збої.
3. Запустити lint/build; звірити попередження з цим документом.
4. Перевірити таблицю інтеграцій і відсутність змін REST/PAK-коду. Схвалення етапу 0 не означає виправлення F01–F09.
