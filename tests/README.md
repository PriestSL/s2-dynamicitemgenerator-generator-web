# Перевірки рефакторингу

## Етап 4 — 14 жовтня 2026

Реалізовані порівняння з вибраною базою, метадані документа, локальні reset і спільний імпорт JSON/серверного `data`. **56/56 тестів**, `npm run lint`, strict `npm run typecheck` (також у складі `npm run build`) і production build пройшли на наявному Node 26.10.0 / npm 11.19.1. Нових залежностей немає. Build і preview виконувалися з дозволом поза sandbox через раніше підтверджені обмеження читання PNG/доступу браузера до socket. Відомі попередження Node/Vite module mode та Sass/Bootstrap залишаються.

Автоматичні перевірки:

- `comparison-import.test.ts`: усі три незмінені legacy-fixtures; числові рядки, старі шоломи, відсутні налаштування, правило `min > max → max = min`, повторна нормалізація без змін, рівність локального й серверного результатів, незалежність замороженої бази, JSON і реальний CFG/ZIP round-trip. Некоректні дані не замінюють config/baseConfig/метадані/view.
- Структурний diff ігнорує порядок ключів/предметів, розрізняє порядок рангів і відсутній override. Перевірені add/remove/re-add/reset у власному scope, reset поля нового предмета через видалення цілого рядка, усі різновиди пар min/max, відновлення відсутніх overrides та атомарна відмова при конфлікті з успадкованими значеннями поза scope.
- `preset-loading.test.ts`: виконуються фактичні `_loadPreset` та `restCalls.getPreset` з локально підміненим fetch. Для всіх трьох файлів перевірені 13 полів, база, ім'я/ID/версія, `fillSettings` і `presetLoaded`; неправильний data, відсутня обгортка, null та HTTP 500 не змінюють документ/ім'я й не породжують подію успішного завантаження. REST endpoint і GET збережені. JS-адаптер не оголошується typechecked: тест перевіряє його unknown-export під час виконання.
- Попередні модельні/редакторські/генераторні/файлові контракти залишилися зеленими. Шість старих негативних імпортних випадків стали дозволеною нормалізацією й замінені позитивними перевірками; strict validateConfig не послаблений. Звідси 56 тестів після попередніх 49, а не сума лише доданих тестів.

Браузер, production preview `127.0.0.1:4174`, 13–14 жовтня:

1. Neutral → Primary: вага GunObrez_SG змінена, базове значення й лічильник різниці збережені; reset прибрав зміну. Delete показав один сірий напівпрозорий рядок у кінці, а відносна частка іншого предмета стала 100%. Add Item того самого SID прибрав приглушений дубль і створив активні нульові ваги; reset повернув базові. Окремий Restore теж перевірений.
2. Новий для CloseCombat GunPM_HG отримав позначку «Added — absent from base»; reset рядка й reset окремого рангу прибрали весь предмет без приглушеного залишку.
3. Глобальна міцність зброї скинулася парою 30/60 → 25/50. У відкритому Armor Drop reset min повернув пару 0.2/0.8; reset checkbox вимкнув drop та сховав залежні поля. Для GrenadeF1 ранг Veteran скинув 2/4 → 0/1.
4. Rei імпортувався з 1232 числовими перетвореннями та двома maxAmmo 4 → 7. Найстаріший My new loadout — 950 перетворень, 27 defaults, 10 старих шоломів; показані rank-значення 70 і 0/70/70/70. Подальше редагування шолома та reset повернули імпортовану базу. Vonamorio — 1211 перетворень без додаткових defaults/міграцій. Load defaults після імпорту відновив окрему базу Defaults і початковий view.
5. Після видалення GunObrez_SG браузер завантажив JSON із рівно 13 полями та без цього SID у CloseCombat. Повторний імпорт залишив його відсутнім і встановив нову базу без diff. Браузер завантажив ZIP; розпакований `New_NPC_Loadouts.cfg` за штатним ігровим шляхом має **621142 символи** й точно дорівнює `generateLoadout` із того самого JSON. Це перевірка реального браузерного download і вмісту, а не лише натискання кнопки.
6. На фінальній збірці некоректний package.json не замінив Defaults із видаленим предметом; Restore повернув лічильник до нуля. Точний текст помилки й атомарність додатково перевірені автоматично. Журнал браузерного інструмента не показав console errors/warnings у перевірених сценаріях.

Межі: живий сервер, серверний CRUD/PIN, PAK-пакування та гра не перевірялись; тестових записів немає. JS UI (app/chances/renderers/events/modal/helpers та controller-contract.test.mjs) лишається до етапу 5; решта PresetsManager/REST — до етапу 7. Новий `ui/comparison.ts` декорує чинні renderer-и, не дублює стан і не підміняє майбутню уніфікацію UI. Наявна щільність таблиць і перекриття ваги/відсотка у вузькому viewport лишаються в обсязі етапів 5–6. Вихідні `json_examples` не змінені; у Git включаються окремі контрольні копії в fixtures/legacy.

Ручне рев'ю:

1. Імпортувати кожен legacy-fixture та перевірити назву бази, повідомлення перетворень, шоломи й Rei maxAmmo = 7.
2. Neutral → Primary → CloseCombat: edit → reset, delete → Restore, delete → Add Item того самого SID → reset; додати GunPM_HG й скинути його. Зміни в іншій фракції/класі мають зберігатися при локальному reset.
3. Перевірити парні reset глобальної/індивідуальної міцності, Ammo, Armor Drop і одного рангу гранати; окремо «Reset entire configuration to base» та «Load defaults».
4. Export → Import → ZIP: повний JSON не містить diff/метаданих/приглушених рядків, імпорт стає новою базою. Спробувати некоректний JSON: робочі зміни мають залишитися.

Нижче — історичні звіти попередніх етапів; їхні лічильники та відкриті на той момент дефекти описують відповідний стан коду.

## Етап 3 — 8 жовтня 2026

Етап 2 позначено схваленим за явною вказівкою власника. Генератор, ZIP, файлові операції та сумісні точки входу перенесено на TS. `npm run typecheck`, `npm run lint`, `npm test` (**49/49**) та `npm run build` пройшли. Build і dev-сервер потребували дозволу поза sandbox: у sandbox були EPERM realpath PNG, хибна помилка пошуку Sass та недоступний браузеру socket. Відомі попередження Node/Vite module mode і 318 повторних Sass/Bootstrap deprecations залишаються.

Автоматичні перевірки:

- `generator.test.ts`: defaults JSON/CFG та сумісний `createLoadout(AppState)`; позитивні/відсутні/нульові ammo й condition для primary, Guard і pistols; A → B → A, паралельні async-входи, незмінність config/base й заморожений input; відмова для невалідних діапазонів/NaN, порожнього набору NPC та відсутніх kit/Secondary-посилань.
- Історичні fixtures не перезаписувалися. `changed.json` лишається невалідним доказом F07. Тест додає йому лише minAmmo=0, після чого перевіряє весь CFG проти історичного тексту з явною заміною тільки GunObrez/GuardGunObrez minCondition та ammo-полів. Два KNOWN-тести замінено позитивними регресіями.
- `downloads.test.ts`: реальний `generateConfig` → `packZip` → зворотне читання JSZip; один CFG за потрібним шляхом, точна рівність чистому генератору, ім'я й fallback; завершення Promise після save; помилки пакування/валідації без save; pending, придушення дубля та retry.
- Незмінений `restCalls.js` у тесті виконується з тестовим origin і підміною `fetch`. Перевірено POST `/pack`, headers, `{fileName, structure}`, вкладений шлях і CFG, успіх, HTTP 500, відмову мережі та malformed-відповіді адаптера. JS-модуль не оголошується typechecked: його відповідь на TS-межі — `unknown`. F15 fallback `<name>.pak` збережено явно, попри реальний серверний `fileName`.
- Спільне браузерне збереження Blob покривається `json-download.test.ts`; JSON-операції залишаються відокремленими від ZIP. File input під час вибору приєднується до DOM і видаляється після вибору/скасування/помилки запуску.

У браузері на локальному dev-сервері пройдено: defaults → Generic Primary → GunObrez maxCondition=90, minCondition=67, ammo=0/0 → ZIP. Завантажено `_Stage3Verified_1_P.zip`; зворотне читання саме браузерного файлу підтвердило один CFG у правильному каталозі та всі 9 primary/Guard-блоків із MinDurability=0.67, MaxDurability=0.9, AmmoMinCount=0, AmmoMaxCount=0. Ввід підтверджувався клавіатурою/Tab, оскільки програмний fill сам по собі не викликав change. Після імпорту структурно допустимого JSON без Neutral pistol kit показано помилку генерації, обидві кнопки доступні; після імпорту defaults повтор успішно завантажив `_Stage3Retry_1_P.zip`. Console errors у фінальному сценарії немає. Тимчасовий JSON для браузерного тесту прибрано.

Сумісні входи та залишкові межі:

| Код / споживачі | Поточний контракт / завершення |
| --- | --- |
| `textGenerators.ts` → `generator/loadout.ts` | `await createLoadout(state)` читає актуальний config; чистий `generateLoadout(config)` не використовує DOM/REST |
| `app.js` / `EventManager` → `ui/downloads.ts` → `fileStreamGenerator.ts` | Об'єкт `{ generateConfig }` збережений; boolean другого аргументу та default PAK збережені; третій аргумент — ім'я з UI |
| `app.js` → `setPackageTransport(downloadPackage)` | Підключає фактичний JS REST до TS-адаптера; endpoints/payload/PIN/CRUD не змінено; REST/PresetsManager — етап 7 |
| Локальний app/chances/renderers/events/modal/helpers та `controller-contract.test.mjs` | Етап 5; нова логіка завантаження вже TS |
| `configs.js`, Vite/ESLint-конфігурації та решта tooling | Етап 7; `capture-baseline.ts` уже перенесено разом із генератором |

`node tests/capture-baseline.ts --write` створює кандидати у `tests/fixtures/candidates/`, не перезаписує історичні докази. Без `--write` відмовляється писати. Старі `baseline.test.mjs`, `known-defects.test.mjs` і `helpers.mjs` прибрано після перенесення потрібних перевірок; модельний helper — `fixtures.ts`.

Ручне рев'ю: у Generic Primary для GunObrez спочатку задати maxCondition=90, потім minCondition=67, minAmmo=0 та maxAmmo=0; завантажити ZIP із власним ім'ям і перевірити відповідні CFG-поля 0.67/0.9/0/0. Аналогічно задати індивідуальні ammo пістолету. Перевірити імпорт/повторне завантаження; під час пакування кнопки блокуються, після успіху/помилки доступні знову.

Реальний REST/PAK, серверні CRUD та гра не перевірялися; серверних записів не було. Bootstrap, UI-layout і мережевий workflow загалом не рефакторилися. Етап 3 очікує рев'ю; етап 4 не розпочато. Нижче — історичні звіти попередніх станів коду.

## Етап 2 — 7 жовтня 2026

Локальне редагування, runtime-валідація, файловий JSON та AppState перенесені на TS. `npm run typecheck` перевіряє всі `src/**/*.ts` і `tests/**/*.ts` двома strict-конфігураціями; `build` виконує ту саму повну команду перед Vite. `npm test` запускає `.mjs` та `.ts` через Node 26. Для типізації Node-тестів додано `@types/node`.

Результат: **46/46 тестів**, typecheck, lint і build пройшли. Попередження module mode у Node/Vite та Sass/Bootstrap залишилися. Sandbox блокував realpath ресурсу PNG та пошук Sass; повторний build із дозволом поза sandbox завершився успішно.

Перевірено автоматично:

- `editing.test.ts`: ваги Weapon/Armor/Pistols 200, 1000 і 10000; відмова понад MAX_ITEM_WEIGHT; окремі відсотки та ймовірності; числа, checked/select, blank/0, min/max, додавання/видалення, актуальний config після імпорту, нульова сума без NaN.
- Повний JSON round-trip defaults і валідного зміненого прикладу; 18 варіантів помилкової структури/типів/посилань/діапазонів, синтаксичні помилки та незмінність config/baseConfig при відмові. Немає обгортки HelmetsSettings. Успішний імпорт викликає render, невдалий — ні.
- `json-download.test.ts` викликає реальний файловий helper із мінімальною підстановкою DOM/URL: перевіряє повний вміст Blob після редагування, ім'я JSON, запуск завантаження, очищення ресурсів і відмову до створення файлу для невалідних legacy-даних. Це перевірка браузерної межі, а не запису файлу на диск.
- `model.test.ts` та `fixtures.ts` перенесені разом із моделлю. `controller-contract.test.mjs` перевіряє JS-контролер після заміни config, reset і legacy-записів PresetsManager; `fillSettings` лишився сумісним no-op, `typeToTable` тепер обчислюється з актуальних даних. `getChancesSettings` включає Pistols.
- Історичні CFG незмінні; перевірки A → B → A й розпакованого ZIP проходять. Залишилися **2 KNOWN-тести F07**: вони підтверджують невиправлені помилки генератора, а не правильність overrides.

`fixtures/changed.json` з етапу 0 містить суперечливий ammo-діапазон: SG min=2 та GunObrez_SG maxAmmo=0 без min override. Новий імпортер правильно відхиляє його. Fixture і CFG збережено як історичні докази F07; `helpers.mjs` для цих тестів явно обходить новий імпортер прямим присвоєнням config. Для позитивного round-trip використовується `editedConfig()` із `fixtures.ts` із валідною парою overrides 0/0. Це не послаблення перевірки імпорту.

У локальному браузері перевірено числовий weapon override, armor checkbox/select, додавання та редагування пістолетів із переходами між категоріями. Ваги 10000 і 2500 збережено з частками 80%/20%; Helmet=200 відхилено. Реальний файловий picker успішно імпортував defaults і відразу оновив Pistols; наступна вага 1200 збереглася після навігації. Помилковий changed.json показав шлях `WeaponList.GunObrez_SG.ammo`, попередня вага нового пістолета 2500 лишилася. Нових console errors у перевіреному сценарії немає. Add Item має рядки заввишки 36 px і gap 4 px замість розтягування порожнім простором.

Автоматичне очікування браузерного JSON-download знову завершилося тайм-аутом: отримання файлу на диск цим інструментом не підтверджене. Серіалізація, імпорт і збереження всіх полів перевірені модульно, файловий імпорт — також через браузер. REST, PAK і гра не перевірялися; серверних записів не створено.

Залишкові JS-межі:

| Код / споживачі | Етап завершення |
| --- | --- |
| textGenerators/fileStreamGenerator, baseline/known-defects та їхній helpers.mjs | 3: генератор, CFG/ZIP і сумісні входи |
| app, chances, renderer-и, eventManager, modalManager, UI helpers/legacy validation; controller-contract.test.mjs | 5: повний локальний UI; вони вже викликають TS editing/JSON |
| REST, PresetsManager, виклик PAK та прямі modified*-сеттері | 7: інтеграції зі збереженням мережевих контрактів |
| configs.js re-export, capture-baseline.mjs, Vite/ESLint-конфігурації та решта скриптів | 7: завершення міграції й інвентаризація |

База AppState поки походить із defaults і не замінюється локальним імпортом; вибір бази й reset у UI — етап 4. Публічні modified*-сеттері збережені для незміненої інтеграції PresetsManager, тому її прямі записи не мають гарантій нового валідованого локального шляху. F05/F06 та інші серверні дефекти не оголошуються виправленими.

Ручне рев'ю:

1. Neutral → Pistols: змінити вагу на 1000, додати GunRhino_HG, задати 2500; перейти Armor → Pistols. Перевірити значення й відносні відсотки. У Weapon/Armor перевірити вагу понад 100; для окремого Pistol kit spawn chance — межу 100.
2. У Generic settings змінити weapon maxAmmo, armor drop/helmet, перевірити після навігації. Некоректне значення має показати помилку й не замінити останнє коректне; blank override і 0 мають різну семантику.
3. Експортувати JSON, імпортувати його, перевірити активну таблицю й наступну зміну. Імпортувати defaults.json, а потім некоректний changed.json: другий має показати помилку без зміни роботи. Перевірити компактний Add Item.

Нижче збережено історичні звіти етапів 0–1; їхні лічильники, межі та описи дефектів стосуються відповідних попередніх станів коду.

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
