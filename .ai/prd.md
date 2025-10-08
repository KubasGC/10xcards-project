# Dokument wymagań produktu (PRD) - 10xCards

## 1. Przegląd produktu

10xCards to aplikacja internetowa zaprojektowana w celu usprawnienia procesu tworzenia fiszek edukacyjnych poprzez wykorzystanie sztucznej inteligencji. Aplikacja pozwala użytkownikom na szybkie generowanie fiszek na podstawie dostarczonego tekstu, a także na ich manualne tworzenie, edycję i organizację w zestawy. Celem produktu jest zminimalizowanie czasu potrzebnego na przygotowanie materiałów do nauki i zachęcenie do regularnego korzystania z metody powtórek interwałowych (spaced repetition). MVP skupia się na podstawowych funkcjonalnościach, oferując prosty system kont użytkowników do przechowywania fiszek oraz integrację z gotowym algorytmem powtórek.

## 2. Problem użytkownika

Głównym problemem, który rozwiązuje 10xCards, jest czasochłonność i wysiłek związany z manualnym tworzeniem wysokiej jakości fiszek. Wielu uczniów, studentów i osób uczących się samodzielnie rezygnuje z efektywnej metody nauki, jaką są fiszki i powtórki interwałowe, ponieważ proces ich przygotowania jest postrzegany jako bariera. Aplikacja ma na celu zautomatyzowanie i uproszczenie tego procesu, umożliwiając użytkownikom skupienie się na nauce, a nie na tworzeniu narzędzi.

## 3. Wymagania funkcjonalne

### 3.1. Zarządzanie kontem użytkownika
- Rejestracja nowego użytkownika za pomocą adresu e-mail i hasła.
- Logowanie do istniejącego konta.
- Możliwość wylogowania się z aplikacji.
- Możliwość zmiany hasła.

### 3.2. Zarządzanie zestawami fiszek
- Tworzenie nowych, pustych zestawów fiszek.
- Przeglądanie listy wszystkich utworzonych przez siebie zestawów.
- AI będzie automatycznie przypisywać kategorię do każdego zestawu (np. "medycyna", "historia") na podstawie jego zawartości w celach analitycznych.

### 3.3. Generowanie fiszek przez AI
- Dostępny formularz do wklejenia tekstu źródłowego (bez jego przechowywania).
- Opcjonalne pole tekstowe do dodania wskazówek dla AI, aby ukierunkować proces generowania.
- Dzienny limit 50 operacji generowania fiszek na użytkownika.
- Po osiągnięciu limitu wyświetlany jest stosowny komunikat.
- Wygenerowane fiszki (kandydaci) trafiają do dedykowanej sekcji "Oczekujące".

### 3.4. Zarządzanie kandydatami na fiszki
- Przeglądanie listy fiszek-kandydatów w sekcji "Oczekujące".
- Możliwość edycji treści każdej fiszki-kandydata.
- Możliwość akceptacji pojedynczych lub wielu fiszek-kandydatów.
- Po akceptacji, użytkownik może przypisać fiszki do istniejącego zestawu lub utworzyć nowy.
- Możliwość trwałego usunięcia (odrzucenia) fiszki-kandydata.

### 3.5. Manualne tworzenie i edycja fiszek
- Formularz do manualnego tworzenia fiszek z polami na przód i tył.
- Limit znaków: 200 dla przodu i 600 dla tyłu fiszki, z widocznym licznikiem.
- Możliwość edycji istniejących, zaakceptowanych fiszek w zestawach.
- Możliwość usuwania fiszek z zestawów.

### 3.6. System nauki
- Integracja z zewnętrzną biblioteką open-source do obsługi algorytmu powtórek interwałowych.
- Możliwość uruchomienia sesji nauki dla dowolnego zestawu fiszek.
- Interfejs do przeglądania fiszek (przód/tył) i oznaczania stopnia ich opanowania.

### 3.7. Interfejs i doświadczenie użytkownika (UI/UX)
- Interaktywny samouczek (onboarding) dla nowych użytkowników, prowadzący przez kluczowe funkcje.
- Dedykowana sekcja "Oczekujące" w głównym menu aplikacji.
- Czytelne komunikaty informujące o limitach (znaków w edytorze, dziennych generacji AI).

## 4. Granice produktu

### 4.1. Funkcje zawarte w MVP
- Generowanie fiszek przez AI na podstawie tekstu wklejonego przez użytkownika.
- Manualne tworzenie, edycja i usuwanie fiszek.
- Prosty system kont użytkowników (e-mail/hasło) do przechowywania danych.
- Organizacja fiszek w zestawy.
- Integracja z gotowym, zewnętrznym algorytmem powtórek interwałowych.
- Aplikacja dostępna wyłącznie w wersji webowej.

### 4.2. Funkcje wykluczone z MVP
- Zaawansowany, autorski algorytm powtórek (np. na wzór SuperMemo, Anki).
- Import plików w formatach takich jak PDF, DOCX, itp.
- Funkcje społecznościowe, takie jak współdzielenie zestawów fiszek między użytkownikami.
- Integracje z zewnętrznymi platformami edukacyjnymi.
- Dedykowane aplikacje mobilne (iOS, Android).
- Zaawansowany edytor tekstu (tylko czysty tekst).

## 5. Historyjki użytkowników

### 5.1. Zarządzanie kontem

- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto w aplikacji przy użyciu mojego adresu e-mail i hasła, aby móc zapisywać swoje fiszki.
- Kryteria akceptacji:
  1. Formularz rejestracji zawiera pola na adres e-mail, hasło i potwierdzenie hasła.
  2. System waliduje poprawność formatu adresu e-mail.
  3. System sprawdza, czy hasła w obu polach są identyczne.
  4. Po pomyślnej rejestracji, użytkownik jest automatycznie zalogowany i przekierowany do panelu głównego.
  5. W przypadku, gdy e-mail jest już zajęty, wyświetlany jest odpowiedni komunikat błędu.

- ID: US-002
- Tytuł: Logowanie użytkownika
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na swoje konto przy użyciu e-maila i hasła, aby uzyskać dostęp do moich zestawów fiszek.
- Kryteria akceptacji:
  1. Formularz logowania zawiera pola na adres e-mail i hasło.
  2. Po poprawnym wprowadzeniu danych, użytkownik zostaje przekierowany do panelu głównego.
  3. W przypadku podania błędnych danych, wyświetlany jest odpowiedni komunikat.

- ID: US-003
- Tytuł: Wylogowanie użytkownika
- Opis: Jako zalogowany użytkownik, chcę mieć możliwość wylogowania się z mojego konta, aby zabezpieczyć swoje dane.
- Kryteria akceptacji:
  1. W interfejsie użytkownika znajduje się widoczny przycisk "Wyloguj".
  2. Po kliknięciu przycisku, sesja użytkownika jest kończona i zostaje on przekierowany na stronę główną (lub stronę logowania).

### 5.2. Onboarding

- ID: US-004
- Tytuł: Samouczek dla nowego użytkownika
- Opis: Jako nowy użytkownik, po pierwszym zalogowaniu, chcę zostać przeprowadzony przez krótki, interaktywny samouczek, aby szybko zrozumieć kluczowe funkcje aplikacji.
- Kryteria akceptacji:
  1. Samouczek uruchamia się automatycznie po pierwszej rejestracji.
  2. Samouczek w formie interaktywnych okienek (np. "modal", "tooltip") wskazuje kluczowe elementy interfejsu.
  3. Samouczek obejmuje ścieżkę: wklejenie tekstu -> użycie wskazówki dla AI -> akceptacja fiszek -> dodanie do zestawu -> rozpoczęcie nauki.
  4. Użytkownik ma możliwość pominięcia samouczka w dowolnym momencie.

### 5.3. Generowanie fiszek

- ID: US-005
- Tytuł: Generowanie fiszek przez AI z tekstu
- Opis: Jako użytkownik, chcę wkleić fragment tekstu do formularza i zainicjować proces generowania fiszek, aby szybko otrzymać propozycje do nauki.
- Kryteria akceptacji:
  1. Na stronie głównej lub w dedykowanej sekcji znajduje się pole tekstowe (`textarea`) do wklejania tekstu.
  2. Po wklejeniu tekstu i kliknięciu przycisku "Generuj", system wysyła zapytanie do AI.
  3. W trakcie generowania wyświetlany jest wskaźnik ładowania.
  4. Po zakończeniu procesu, wygenerowane fiszki-kandydaci są wyświetlane na liście w sekcji "Oczekujące".

- ID: US-006
- Tytuł: Użycie wskazówki dla AI
- Opis: Jako użytkownik, podczas generowania fiszek, chcę mieć możliwość dodania krótkiej wskazówki dla AI, na czym powinna się skupić, aby zwiększyć trafność wygenerowanych propozycji.
- Kryteria akceptacji:
  1. Obok pola na tekst źródłowy znajduje się opcjonalne pole "Wskazówka dla AI".
  2. Treść tego pola jest łączona z tekstem źródłowym w ramach promptu wysyłanego do modelu językowego.

- ID: US-007
- Tytuł: Obsługa dziennego limitu generacji AI
- Opis: Jako użytkownik, po wykorzystaniu dziennego limitu 50 generacji, chcę otrzymać jasny komunikat o tym fakcie oraz o czasie, kiedy limit zostanie odnowiony.
- Kryteria akceptacji:
  1. System śledzi liczbę operacji generowania dla każdego użytkownika w ciągu doby.
  2. Próba wykonania 51. generacji w danym dniu jest blokowana.
  3. Użytkownikowi wyświetla się komunikat informujący o wyczerpaniu limitu, dokładnym czasie jego resetu (o północy) oraz o możliwości dalszego, manualnego tworzenia fiszek.
  4. Limit resetuje się automatycznie o północy (w odpowiedniej strefie czasowej).

### 5.4. Zarządzanie fiszkami

- ID: US-008
- Tytuł: Przeglądanie i akceptacja kandydatów na fiszki
- Opis: Jako użytkownik, chcę móc przejrzeć listę fiszek wygenerowanych przez AI w sekcji "Oczekujące" i zaakceptować te, które mi odpowiadają.
- Kryteria akceptacji:
  1. W menu głównym znajduje się link do sekcji "Oczekujące".
  2. W tej sekcji wyświetlana jest lista wszystkich niezaakceptowanych fiszek-kandydatów.
  3. Każda fiszka na liście ma widoczny przód i tył.
  4. Przy każdej fiszce znajduje się przycisk lub checkbox do jej zaznaczenia.
  5. Po zaznaczeniu wybranych fiszek, dostępny jest przycisk "Dodaj do zestawu".
  6. Po kliknięciu, pojawia się okno dialogowe pozwalające wybrać istniejący zestaw lub stworzyć nowy.

- ID: US-009
- Tytuł: Edycja kandydata na fiszkę
- Opis: Jako użytkownik, chcę mieć możliwość szybkiej edycji treści fiszki zasugerowanej przez AI jeszcze przed jej ostatecznym zaakceptowaniem, aby poprawić drobne błędy lub dostosować ją do moich potrzeb.
- Kryteria akceptacji:
  1. Każda fiszka-kandydat w sekcji "Oczekujące" ma przycisk "Edytuj".
  2. Po kliknięciu, pola przodu i tyłu fiszki stają się edytowalne.
  3. Użytkownik może zmodyfikować tekst, a następnie zapisać zmiany.
  4. Zapisana, zmodyfikowana fiszka może zostać normalnie zaakceptowana i dodana do zestawu.

- ID: US-010
- Tytuł: Odrzucanie kandydata na fiszkę
- Opis: Jako użytkownik, chcę mieć możliwość trwałego usunięcia propozycji fiszki z listy "Oczekujące", jeśli uznam ją za nieprzydatną.
- Kryteria akceptacji:
  1. Każda fiszka-kandydat ma przycisk "Usuń" lub "Odrzuć".
  2. Po kliknięciu i potwierdzeniu operacji, fiszka jest trwale usuwana z listy kandydatów.

- ID: US-011
- Tytuł: Manualne tworzenie fiszki
- Opis: Jako użytkownik, chcę mieć możliwość ręcznego stworzenia nowej fiszki i dodania jej do wybranego zestawu.
- Kryteria akceptacji:
  1. W interfejsie (np. na stronie zestawu) znajduje się przycisk "Dodaj nową fiszkę".
  2. Formularz zawiera pola na przód (limit 200 znaków) i tył (limit 600 znaków).
  3. Pod polami tekstowymi widoczne są dynamicznie aktualizujące się liczniki znaków.
  4. Po wypełnieniu i zapisaniu, nowa fiszka jest dodawana do bieżącego zestawu.

### 5.5. Organizacja i nauka

- ID: US-012
- Tytuł: Tworzenie nowego zestawu fiszek
- Opis: Jako użytkownik, chcę móc tworzyć nowe, tematyczne zestawy, aby w sposób uporządkowany organizować moje fiszki.
- Kryteria akceptacji:
  1. Dostępny jest przycisk "Stwórz nowy zestaw".
  2. Użytkownik podaje nazwę dla nowego zestawu.
  3. Pusty zestaw jest tworzony i pojawia się na liście moich zestawów.

- ID: US-013
- Tytuł: Przeglądanie listy zestawów
- Opis: Jako użytkownik, chcę widzieć listę wszystkich moich zestawów fiszek, aby łatwo nawigować między nimi i wybierać materiał do nauki.
- Kryteria akceptacji:
  1. W panelu głównym aplikacji wyświetlana jest lista wszystkich zestawów utworzonych przez użytkownika.
  2. Każdy element listy zawiera nazwę zestawu i liczbę fiszek w nim zawartych.
  3. Kliknięcie na zestaw przenosi do widoku jego zawartości.

- ID: US-014
- Tytuł: Rozpoczynanie sesji nauki
- Opis: Jako użytkownik, chcę móc rozpocząć sesję nauki dla wybranego zestawu, a aplikacja, korzystając z algorytmu powtórek, zdecyduje, które fiszki pokazać mi danego dnia.
- Kryteria akceptacji:
  1. Na stronie każdego zestawu znajduje się przycisk "Rozpocznij naukę".
  2. Po kliknięciu, uruchamiany jest interfejs nauki.
  3. Aplikacja, na podstawie danych z biblioteki spaced repetition, prezentuje fiszki, które wymagają powtórki.
  4. Jeśli żadna fiszka nie wymaga powtórki danego dnia, użytkownik otrzymuje stosowny komunikat.

- ID: US-015
- Tytuł: Interfejs sesji nauki
- Opis: Jako użytkownik, w trakcie sesji nauki, chcę widzieć przód fiszki, móc samodzielnie ją odsłonić, a następnie ocenić, jak dobrze ją znam, aby algorytm mógł zaplanować kolejną powtórkę.
- Kryteria akceptacji:
  1. Na ekranie wyświetlany jest przód fiszki.
  2. Po kliknięciu przycisku "Pokaż odpowiedź", odsłaniany jest tył fiszki.
  3. Dostępne są przyciski do oceny znajomości fiszki (np. "Nie wiem", "Trudne", "Dobrze", "Łatwe").
  4. Po dokonaniu oceny, aplikacja zapisuje informację i przechodzi do kolejnej fiszki lub kończy sesję, jeśli to była ostatnia.

## 6. Metryki sukcesu

1. Kryterium: 75% fiszek wygenerowanych przez AI jest akceptowanych przez użytkownika.
   - Sposób mierzenia: W systemie będzie śledzony stosunek liczby fiszek, które użytkownik zaakceptował (przenosząc je ze stanu "oczekujące" do zestawu, wliczając w to fiszki edytowane), do całkowitej liczby fiszek-kandydatów wygenerowanych przez AI dla tego użytkownika. Metryka będzie agregowana dla całej bazy użytkowników.

2. Kryterium: Użytkownicy tworzą 75% swoich fiszek z wykorzystaniem AI.
   - Sposób mierzenia: Dla każdego użytkownika będzie mierzony stosunek liczby fiszek utworzonych za pomocą ścieżki AI (zaakceptowani kandydaci) do całkowitej liczby fiszek posiadanych przez użytkownika (suma fiszek z AI i utworzonych manualnie). Metryka będzie agregowana dla całej bazy użytkowników.
