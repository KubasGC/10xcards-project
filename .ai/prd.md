# Dokument wymagań produktu (PRD) - fiszkuj.pl
## 1. Przegląd produktu
Produkt fiszkuj.pl ułatwia tworzenie, organizację i naukę z fiszek poprzez wykorzystanie generatywnej sztucznej inteligencji oraz prostego, gotowego algorytmu powtórek. Celem jest zredukowanie bariery wejścia do metody spaced repetition dzięki szybkiemu generowaniu jakościowych fiszek i intuicyjnym przepływom akceptacji, edycji i nauki.

Zakres MVP:
- Generowanie kandydatów na fiszki przez AI z wklejonego tekstu i opcjonalnej wskazówki.
- Manualne tworzenie fiszek z licznikami znaków (200 przód, 600 tył).
- Przeglądanie, edycja i usuwanie zaakceptowanych fiszek.
- Prosty system kont użytkowników (rejestracja, logowanie, wylogowanie) z e-mail i hasłem.
- Grupowanie fiszek w zestawy, z automatyczną kategoryzacją zestawów przez AI w celach analitycznych.
- Sekcja Oczekujące do zarządzania niezaakceptowanymi kandydatami.
- Integracja z biblioteką open-source do spaced repetition; możliwość sesji nauki dla wybranego zestawu.
- Dzienne limity generacji AI (50 na użytkownika, reset o północy) i przejrzyste komunikaty o limitach.
- Zbieranie zanonimizowanych metadanych generacji (model, czas, tokeny, koszt) bez przechowywania treści wejściowych/wyjściowych.

Grupa docelowa:
- Szeroka, niedookreślona na etapie MVP. Użytkownicy potrzebujący szybkiego tworzenia fiszek do nauki dowolnych tematów.

Propozycja wartości:
- Szybkie i proste tworzenie jakościowych fiszek dzięki AI.
- Łatwe porządkowanie treści w zestawy i natychmiastowa nauka z wykorzystaniem spaced repetition.

Główne przepływy użytkownika (happy path):
1) Nowy użytkownik: rejestracja → wklejenie tekstu → dodanie wskazówki (opcjonalne, powinno być rzadko uzywane) → generacja i akceptacja kandydatów → przypisanie do zestawu → pierwsza sesja nauki.
2) Powracający użytkownik: logowanie → przegląd Oczekujące i/lub zestawów → nauka według harmonogramu algorytmu.

Założenia i zależności:
- Aplikacja web (desktop i mobile web), bez natywnych aplikacji mobilnych.
- Uwierzytelnianie: e-mail + hasło.
- Algorytm powtórek: integracja z zewnętrzną, open-source biblioteką (do wyboru na etapie implementacji).
- Generatywne AI: model i dostawca do konfiguracji, metadane anonimizowane, brak przechowywania promptów i wygenerowanych treści kandydatów po odrzuceniu.
- Koszty operacyjne poza zakresem MVP.

## 2. Problem użytkownika
Manualne tworzenie wysokiej jakości fiszek jest czasochłonne i nużące, co zmniejsza szansę na konsekwentne stosowanie skutecznej metody spaced repetition. Użytkownicy często rezygnują, zanim zbudują wystarczającą bazę fiszek. Brakuje narzędzia, które szybko przekształci surowe materiały (notatki, artykuły) w dobre fiszki i poprowadzi użytkownika przez proste kroki akceptacji i nauki.

Konsekwencje:
- Niska adopcja powtórek mimo ich skuteczności.
- Rozproszone, nieustrukturyzowane notatki zamiast gotowych fiszek.
- Nieregularne nauki z powodu bariery wstępnej.

Hipoteza produktu:
- Obniżenie kosztu czasowego tworzenia fiszek poprzez AI zwiększy odsetek użytkowników, którzy zaczną i utrzymają regularne powtórki.

## 3. Wymagania funkcjonalne
3.1. Konta i dostęp
- Rejestracja konta przez e-mail i hasło.
- Logowanie i wylogowanie.
- Dostęp do danych użytkownika tylko po zalogowaniu; ochrona tras i API.

3.2. Zestawy fiszek
- Tworzenie nowych zestawów.
- Przegląd listy zestawów użytkownika.
- Przegląd fiszek w zestawie.
- Automatyczna kategoryzacja zestawu przez AI na podstawie zawartości (na potrzeby analityczne).

3.3. Fiszki – generowanie przez AI
- Formularz: wklejenie tekstu źródłowego i opcjonalna wskazówka (prompt guide).
- Generowanie listy kandydatów na fiszki.
- Możliwość edycji kandydata przed akceptacją.
- Akceptacja lub odrzucenie pojedynczych kandydatów.
- Przypisanie zaakceptowanych fiszek do istniejącego lub nowego zestawu.
- Limit generacji: 50 na użytkownika dziennie; reset o północy; jasny komunikat po przekroczeniu.
- Sekcja Oczekujące: dostęp do niezaakceptowanych kandydatów, z możliwością edycji, akceptacji i odrzucenia.
- Brak trwałego przechowywania wklejonego tekstu źródłowego ani odrzuconych kandydatów.

3.4. Fiszki – tworzenie i zarządzanie manualne
- Formularz z licznikami znaków: przód do 200 znaków, tył do 600 znaków.
- Walidacja i natychmiastowa informacja o przekroczeniu limitów.
- Edycja i usuwanie zaakceptowanych fiszek.

3.5. Nauka (spaced repetition)
- Integracja z otwartą biblioteką spaced repetition.
- Rozpoczęcie sesji nauki dla wybranego zestawu.
- Prezentacja fiszek zaplanowanych na dany dzień przez algorytm.
- Rejestrowanie wyników odpowiedzi użytkownika zgodnie z biblioteką.

3.6. Limity i komunikaty
- Dzienne limity generacji AI (50), reset o północy.
- Komunikat po osiągnięciu limitu, z informacją o czasie resetu i możliwości tworzenia manualnego.

3.7. Analityka i kategoryzacja
- Zbieranie zanonimizowanych metadanych generacji (model, czas, tokeny, koszt). Bez treści wejściowych/wyjściowych.
- Automatyczna kategoryzacja zestawów przez AI dla celów analitycznych.

3.8. Prywatność i bezpieczeństwo
- Przechowywane wyłącznie zaakceptowane fiszki i dane konta.
- Brak przechowywania wklejonych tekstów źródłowych.
- Ochrona zasobów po zalogowaniu, bezpieczne przechowywanie haseł.

## 4. Granice produktu
Poza zakresem MVP:
- Zaawansowany, własny algorytm powtórek (np. SuperMemo, Anki).
- Import wielu formatów (PDF, DOCX itp.).
- Współdzielenie zestawów między użytkownikami.
- Integracje z zewnętrznymi platformami edukacyjnymi.
- Aplikacje mobilne natywne (tylko web).

Ograniczenia i założenia:
- Limit 50 generacji AI na dobę na użytkownika; reset o północy.
- Dane źródłowe użytkownika nie są przechowywane; tylko zaakceptowane fiszki trafiają do bazy.
- Metadane generacji są zanonimizowane; brak przechowywania treści promptów i outputów kandydatów.
- Wybór biblioteki spaced repetition i konstrukcja promptu zostaną ustalone na etapie implementacji.

Niefunkcjonalne (MVP):
- Dostępność podstawowa (web, responsywność).
- Wydajność wystarczająca do komfortowej pracy pojedynczego użytkownika; brak wymogów skalowania ponad MVP.
- Podstawowe logowanie błędów i monitoring stabilności.

Otwarte kwestie:
- Wybór konkretnej biblioteki spaced repetition (open-source).
- Struktura promptu łącząca tekst źródłowy i wskazówki użytkownika dla najlepszej jakości fiszek.

## 5. Historyjki użytkowników
US-001
Tytuł: Rejestracja konta e-mail + hasło
Opis: Jako nowy użytkownik chcę utworzyć konto używając e-maila i hasła, aby móc zapisywać moje fiszki.
Kryteria akceptacji:
- Formularz wymaga unikalnego e-maila i hasła spełniającego politykę haseł.
- Po pomyślnej rejestracji użytkownik jest zalogowany lub kierowany do logowania.
- Błędy walidacji są czytelnie prezentowane.

US-002
Tytuł: Logowanie
Opis: Jako użytkownik chcę zalogować się e-mailem i hasłem, aby uzyskać dostęp do moich danych.
Kryteria akceptacji:
- Poprawne dane logują i przekierowują do strony głównej.
- Błędne dane zwracają bezpieczny komunikat o błędzie i pozostają na stronie logowania.

US-003
Tytuł: Wylogowanie
Opis: Jako użytkownik chcę się wylogować, aby zakończyć sesję na współdzielonym urządzeniu.
Kryteria akceptacji:
- Wylogowanie unieważnia sesję i przekierowuje do ekranu powitalnego lub logowania.

US-004
Tytuł: Ochrona zasobów po zalogowaniu
Opis: Jako użytkownik niezalogowany, próbując wejść na chronioną stronę, chcę zostać przekierowany do logowania.
Kryteria akceptacji:
- Dostęp do stron z fiszkami, zestawami, Oczekujące i nauką wymaga zalogowania.
- Niezalogowany użytkownik jest przekierowany do logowania bez wycieku informacji o zasobie.

US-005
Tytuł: Utworzenie zestawu
Opis: Jako użytkownik chcę utworzyć nowy zestaw, aby porządkować fiszki tematycznie.
Kryteria akceptacji:
- Formularz tworzy zestaw z nazwą (wymagana) i opcjonalnym opisem.
- Zestaw pojawia się na liście zestawów.

US-006
Tytuł: Przegląd moich zestawów
Opis: Jako użytkownik chcę zobaczyć listę moich zestawów, aby wybrać jeden do nauki lub edycji.
Kryteria akceptacji:
- Lista zestawów zawiera nazwę, liczbę fiszek i kategorię.
- Możliwość sortowania lub filtrowania w podstawowym zakresie (opcjonalnie w MVP, minimum: lista).

US-007
Tytuł: Przegląd fiszek w zestawie
Opis: Jako użytkownik chcę przeglądać fiszki w konkretnym zestawie, aby je edytować lub uczyć się.
Kryteria akceptacji:
- Widok zestawu pokazuje listę fiszek z możliwością edycji i usuwania.

US-008
Tytuł: Automatyczna kategoryzacja zestawu
Opis: Jako właściciel zestawu chcę, aby system automatycznie przypisał kategorię do zestawu na podstawie jego treści.
Kryteria akceptacji:
- Po dodaniu/akceptacji fiszek kategoria jest przypisywana przez AI.
- Kategoria jest widoczna przy zestawie i używana w analityce.

US-009
Tytuł: Generacja kandydatów na fiszki z tekstu
Opis: Jako użytkownik chcę wkleić tekst i opcjonalną wskazówkę, aby AI wygenerowało kandydatów.
Kryteria akceptacji:
- Formularz przyjmuje tekst i opcjonalną wskazówkę.
- Wynikiem jest lista kandydatów; każdy zawiera przód i tył propozycji fiszki.
- Metadane generacji są rejestrowane anonimowo (model, czas, tokeny, koszt).

US-010
Tytuł: Limit dzienny generacji i komunikat
Opis: Jako użytkownik po wyczerpaniu 50 generacji dziennie chcę jasnego komunikatu i informacji o resecie.
Kryteria akceptacji:
- Po osiągnięciu limitu pojawia się komunikat z czasem resetu.
- Formularz generacji jest niedostępny do północy, ale manualne tworzenie fiszek pozostaje dostępne.

US-011
Tytuł: Edycja kandydata przed akceptacją
Opis: Jako użytkownik chcę poprawić wygenerowaną fiszkę przed zapisaniem.
Kryteria akceptacji:
- Edytor kandydatów posiada liczniki znaków (200/600) i walidację limitów.
- Zapis edycji uaktualnia kandydata do akceptacji.

US-012
Tytuł: Akceptacja lub odrzucenie kandydatów
Opis: Jako użytkownik chcę zdecydować, które kandydaty zapisać jako fiszki, a które odrzucić.
Kryteria akceptacji:
- Każdy kandydat ma akcje: zaakceptuj, odrzuć.
- Akceptacja przenosi do wyboru zestawu (istniejący lub nowy).
- Odrzucenie usuwa kandydata trwale bez przechowywania treści.

US-013
Tytuł: Sekcja Oczekujące
Opis: Jako użytkownik chcę wrócić do niezaakceptowanych kandydatów, aby je ponownie przejrzeć, edytować i zaakceptować lub odrzucić.
Kryteria akceptacji:
- Ekran Oczekujące pokazuje listę aktualnych kandydatów.
- Dostępne akcje: edytuj, zaakceptuj, odrzuć.

US-014
Tytuł: Manualne tworzenie fiszki
Opis: Jako użytkownik chcę ręcznie dodać fiszkę z limitem znaków i widocznymi licznikami.
Kryteria akceptacji:
- Formularz wymusza 200 znaków na przód i 600 na tył.
- Liczniki znaków aktualizują się w czasie rzeczywistym.
- Po zapisie fiszka trafia do wybranego zestawu.

US-015
Tytuł: Edycja zaakceptowanej fiszki
Opis: Jako użytkownik chcę edytować istniejącą fiszkę w zestawie.
Kryteria akceptacji:
- Edycja respektuje limity znaków i liczniki.
- Zapis aktualizuje fiszkę w zestawie.

US-016
Tytuł: Usunięcie fiszki
Opis: Jako użytkownik chcę usunąć fiszkę z zestawu, gdy jest niepotrzebna.
Kryteria akceptacji:
- Usunięcie usuwa fiszkę trwale z zestawu.
- Opcjonalne potwierdzenie usunięcia.

US-017
Tytuł: Rozpoczęcie sesji nauki
Opis: Jako użytkownik chcę rozpocząć naukę w wybranym zestawie zgodnie z algorytmem powtórek.
Kryteria akceptacji:
- System wybiera fiszki zaplanowane na dziś przez bibliotekę spaced repetition.
- Interfejs pozwala przełączać przód/tył, a następnie ocenić odpowiedź.

US-018
Tytuł: Ocena odpowiedzi i zapis postępów
Opis: Jako użytkownik chcę ocenić swoją odpowiedź, aby algorytm zaktualizował harmonogram powtórek.
Kryteria akceptacji:
- Dostępne poziomy oceny zgodne z biblioteką (np. dobry/zły lub skala).
- Wynik jest zapisywany i wpływa na następny termin powtórki.

US-019
Tytuł: Przypisanie zaakceptowanych fiszek do zestawu
Opis: Jako użytkownik chcę po akceptacji kandydata wybrać istniejący zestaw lub utworzyć nowy.
Kryteria akceptacji:
- Po akceptacji pojawia się wybór zestawu lub opcja utworzenia nowego.
- Fiszki są przypisane i widoczne w docelowym zestawie.

US-020
Tytuł: Walidacja tekstu wejściowego dla generacji
Opis: Jako użytkownik chcę, aby aplikacja informowała mnie, gdy mój tekst wejściowy jest zbyt długi lub niepoprawny.
Kryteria akceptacji:
- Zbyt długi lub pusty tekst powoduje czytelny komunikat i blokadę przycisku generacji.
- Wskazówka jest opcjonalna; jej brak nie blokuje generacji.

US-021
Tytuł: Zachowanie przy utracie połączenia podczas generacji
Opis: Jako użytkownik chcę jasny komunikat i możliwość ponowienia próby, gdy wystąpi błąd sieciowy.
Kryteria akceptacji:
- Błąd sieciowy prezentuje komunikat i przycisk ponów lub anuluj.
- Brak duplikacji kandydatów po wielokrotnych próbach.

US-022
Tytuł: Prywatność danych wejściowych
Opis: Jako użytkownik chcę mieć pewność, że wklejone teksty nie są przechowywane na stałe.
Kryteria akceptacji:
- System nie zapisuje treści wejściowych na stałe.
- Odrzuceni kandydaci nie są przechowywani; zaakceptowane fiszki są trwałe.

US-023
Tytuł: Analityka generacji (anonimowa)
Opis: Jako właściciel produktu chcę zbierać metadane generacji w sposób anonimowy, aby optymalizować koszty i jakość.
Kryteria akceptacji:
- Zbierane są metryki: model, czas generacji, tokeny, koszt.
- Brak treści wejściowych i wyjściowych w logach/analityce.

US-024
Tytuł: Dostęp do Oczekujące z menu głównego
Opis: Jako użytkownik chcę mieć stały dostęp do sekcji Oczekujące z głównego menu.
Kryteria akceptacji:
- W menu głównym znajduje się pozycja prowadząca do Oczekujące.
- Widoczna liczba oczekujących kandydatów (opcjonalnie w MVP, minimum: link).

## 6. Metryki sukcesu
Kryteria główne:
- 75% fiszek wygenerowanych przez AI jest akceptowanych przez użytkownika.
  - Pomiar: stosunek liczby zaakceptowanych fiszek (przeniesionych z Oczekujące do zestawów) do całkowitej liczby wygenerowanych kandydatów dla danego użytkownika i w agregacie.
- 75% fiszek tworzą użytkownicy z wykorzystaniem AI.
  - Pomiar: stosunek liczby fiszek utworzonych przez ścieżkę AI do liczby fiszek utworzonych manualnie per użytkownik i w agregacie.

Wskaźniki wspierające (pomocnicze dla optymalizacji, poza kryteriami sukcesu):
- Średnia liczba zaakceptowanych fiszek na jedną generację.
- Odsetek użytkowników, którzy wygenerowali co najmniej jedną akceptowaną fiszkę.
- Czas od rejestracji do pierwszej sesji nauki.
- Zużycie limitów generacji (średnia i odchylenie); odsetek użytkowników osiągających dzienny limit.
- Rozkład kategorii zestawów dla celów analitycznych (bez treści).

