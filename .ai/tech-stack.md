Frontend - Astro z React dla komponentów interaktywnych:
- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:
- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

AI - Komunikacja z modelami przez usługę Openrouter.ai:
- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta
- Pozwala na ustawianie limitów finansowych na klucze API

Testowanie:
- Vitest jako framework testowy dla testów jednostkowych i integracyjnych - szybkie wykonanie dzięki integracji z Vite, kompatybilne API z Jest, wbudowane wsparcie dla TypeScript
- Playwright do testów end-to-end - rekomendowany przez Astro, wsparcie dla wielu przeglądarek, auto-waiting dla elementów, doskonałe narzędzia deweloperskie
- Testing Library (@testing-library/react, @testing-library/user-event) do testowania komponentów React - testowanie jak użytkownik, unikanie testowania implementacji
- Mock Service Worker (MSW) do mockowania API w testach jednostkowych - izolacja od zewnętrznych zależności
- Coverage reporting z Vitest (v8 provider) - monitoring pokrycia kodu z progami 80% dla statements/functions/lines

CI/CD i Hosting:
- Github Actions do tworzenia pipeline'ów CI/CD z automatycznym uruchamianiem testów
- DigitalOcean do hostowania aplikacji za pośrednictwem obrazu docker