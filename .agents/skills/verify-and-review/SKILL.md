---
name: verify-and-review
description: Запускает обязательную проверку после реализации: lint/test/build/typecheck, сравнение diff с планом, проверка acceptance criteria, поиск scope creep, краткий review summary. Использовать после кодовых изменений перед handoff или human review.
---

Используй этот skill после любой завершенной кодовой задачи, прежде чем считать ее готовой к review.

Не используй этот skill:
- до того, как есть реальные изменения;
- вместо planning;
- вместо docs update, если уже есть green implementation;
- как оправдание не запускать реальные проверки.

## Обязательный порядок работы

1. Прочитай:
   - утвержденный план;
   - acceptance criteria;
   - корневой и локальный `AGENTS.md`.

2. Сверь фактический diff с планом:
   - что должно было измениться;
   - что реально изменилось;
   - есть ли scope creep;
   - не забыты ли тесты и docs.

3. Запусти точные команды из `AGENTS.md`:
   - lint;
   - test;
   - build;
   - typecheck / format checks, если есть;
   - targeted smoke checks для текущей фичи.

4. Проверь качество реализации:
   - соответствует ли acceptance criteria;
   - нет ли очевидных regressions;
   - нет ли missing error handling;
   - нет ли пропущенных auth/permission checks;
   - не затронуты ли unrelated files без причины.

5. Если находишь маленькую, очевидную и локальную проблему, напрямую вызванную этой задачей:
   - можешь исправить ее;
   - потом обязательно перезапусти релевантные проверки.
   Если проблема крупная или выводит задачу за scope — остановись и зафиксируй проблему.

## Формат результата

Верни:

# Verification Report

## Status
- ready_for_review / needs_rework / blocked

## Plan coverage
- что из плана выполнено
- что не выполнено

## Acceptance criteria
- критерий -> pass/fail

## Commands run
- команда
- результат

## Tests added/updated
## Scope creep check
## Risks / findings
## Recommended next step

## Правила
- Не скрывай красные проверки.
- Не подгоняй вывод под “зеленый” статус.
- Если команды из `AGENTS.md` отсутствуют или не работают, явно отметь это как setup gap.
- Если фича security-sensitive, отдельно выдели auth/tenant/access findings.
