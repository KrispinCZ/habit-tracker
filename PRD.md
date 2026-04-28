# PRD: Habit Tracker

## Problém
Chci sledovat své denní, týdenní a měsíční zvyky a vidět historii jejich dodržování. Zároveň chci sdílet konkrétní zvyk s kýmkoliv přes zabezpečenou URL — bez nutnosti registrace pro diváka.

## Cílový uživatel
Primárně jeden uživatel (já), s možností sdílet jednotlivé zvyky read-only linkem s kýmkoliv.

## User Stories
- Jako uživatel chci přidat nový zvyk s názvem a frekvencí, abych ho mohl začít sledovat.
- Jako uživatel chci označit zvyk jako splněný nebo nesplněný pro konkrétní den, abych měl přesnou historii.
- Jako uživatel chci sdílet konkrétní zvyk přes unikátní URL, aby ostatní viděli mou historii bez přihlášení.
- Jako uživatel chci smazat zvyk (soft delete s potvrzením), abych ho přestal vidět, ale data zůstala v DB.
- Jako divák chci otevřít sdílenou URL a vidět historii zvyku bez nutnosti registrace.

## MVP Scope

### In scope
- Vytvoření zvyku: název, frekvence (denně/týdně/měsíčně), cílový den pro týdně/měsíčně
- Přehled aktivních zvyků s historií dodržování (✓/✗ grid)
- Zaznamenání: označit jako splněno nebo nesplněno pro daný den (explicitní akce)
- Sdílení zvyku: unikátní read-only URL přes náhodný token
- Smazání zvyku: soft delete (deleted_at), s potvrzením, data zůstávají v DB

### Out of scope
- Email / push notifikace a připomínky
- Více dnů v týdnu najednou (např. 3× týdně)
- Statistiky a analytics dashboard
- Multi-user / týmové sdílení
- Import/export dat

## Datový model

### Tabulka: habits
| Sloupec | Typ | Popis |
|---------|-----|-------|
| id | integer (PK, identity) | Primární klíč |
| user_id | uuid | Odkaz na auth.users (pro budoucí auth) |
| title | text | Název zvyku |
| frequency | habit_frequency | Enum: daily / weekly / monthly |
| target_day | integer | NULL pro daily; 1–7 ISO dow pro weekly; 1–31 pro monthly |
| share_token | text UNIQUE | Token pro veřejné sdílení (gen_random_uuid()) |
| deleted_at | timestamptz | NULL = aktivní; hodnota = smazáno (soft delete) |
| created_at | timestamptz | Čas vytvoření |

### Tabulka: habit_logs
| Sloupec | Typ | Popis |
|---------|-----|-------|
| id | integer (PK, identity) | Primární klíč |
| habit_id | integer (FK → habits) | Odkaz na zvyk |
| log_date | date | Datum záznamu |
| status | habit_status | Enum: done / missed |
| created_at | timestamptz | Čas vytvoření |

Constraint: `UNIQUE(habit_id, log_date)` — jeden záznam na zvyk na den.

## SQL pro Supabase
Viz `migrations/001_initial.sql`
