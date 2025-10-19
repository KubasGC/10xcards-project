import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should display login form on homepage", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check if login form is visible
    await expect(page.getByRole("navigation").getByRole("link", { name: "Zaloguj się" })).toBeVisible();

    await page.getByRole("navigation").getByRole("link", { name: "Zaloguj się" }).click();

    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/hasło/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /zaloguj się/i })).toBeVisible();
  });

  test("should switch to register form", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Click register link
    await page.getByRole("navigation").getByRole("link", { name: "Zarejestruj się" }).click();

    // Check if register form is visible
    await expect(page.getByRole("heading", { name: /zarejestruj się/i })).toBeVisible();
    await expect(page.getByLabel(/powtórz hasło/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /zarejestruj się/i })).toBeVisible();
  });

  test("should validate form fields", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Try to submit empty form
    await page.getByRole("button", { name: /zaloguj się/i }).click();

    // Check for validation messages
    await expect(page.getByText(/email jest wymagany/i)).toBeVisible();
    await expect(page.getByText(/hasło jest wymagane/i)).toBeVisible();
  });

  test("should navigate to dashboard after successful login", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Fill login form
    const userLogin = process.env.USER_LOGIN;
    const userPassword = process.env.USER_PASSWORD;

    if (!userLogin || !userPassword) {
      throw new Error("USER_LOGIN and USER_PASSWORD environment variables must be set");
    }

    await page.getByLabel(/email/i).fill(userLogin);
    await page.getByLabel(/hasło/i).fill(userPassword);

    // Submit form
    await page.getByRole("button", { name: /zaloguj się/i }).click();

    await page.waitForLoadState("networkidle");

    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });
});

test.describe("Flashcard Generation", () => {
  test("should generate flashcards from text input", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    const userLogin = process.env.USER_LOGIN;
    const userPassword = process.env.USER_PASSWORD;

    if (!userLogin || !userPassword) {
      throw new Error("USER_LOGIN and USER_PASSWORD environment variables must be set");
    }

    await page.getByLabel(/email/i).fill(userLogin);
    await page.getByLabel(/hasło/i).fill(userPassword);
    await page.getByRole("button", { name: /zaloguj się/i }).click();

    await page.waitForURL("/dashboard");

    // Navigate to generate page
    await page.goto("/generate");
    await page.waitForLoadState("networkidle");

    // Fill text input
    await page
      .getByLabel(/tekst do konwersji|tekst źródłowy/i)
      .fill(
        "Sejm Rzeczypospolitej Polskiej (Sejm RP), Sejm[1] – jedna z dwóch izb parlamentu Rzeczypospolitej Polskiej tradycyjnie określana jako: „izba niższa”. Izba Poselska wyłoniła się z Sejmu walnego w 1493 r.; od uchwalenia ustawy nihil novi (1505 r.) Sejm jest najwyższym organem władzy ustawodawczej w Polsce.  W III Rzeczypospolitej Sejm stanowi niższą izbę polskiego parlamentu. Składa się on z 460 posłów, wybieranych w wyborach powszechnych, równych, bezpośrednich i proporcjonalnych, w głosowaniu tajnym (wybory pięcioprzymiotnikowe)[2]. Kadencja Sejmu, zgodnie z Konstytucją, trwa 4 lata; biegnie od dnia pierwszego posiedzenia nowo wybranego Sejmu i trwa do dnia poprzedzającego dzień zebrania się Sejmu następnej kadencji. Zakończenie kadencji może także nastąpić w wyniku jej skrócenia przez Sejm (uchwałą podjętą większością 2/3 ustawowej liczby posłów na podstawie art. 98 ust. 3 Konstytucji) albo przez Prezydenta RP: obligatoryjnie (obowiązkowo), jeżeli procedura zasadnicza powoływania Rady Ministrów oraz obie procedury rezerwowe zakończą się fiaskiem lub fakultatywnie (nieobowiązkowo), jeżeli Prezydent, w ciągu 4 miesięcy od dnia przedłożenia projektu ustawy budżetowej Sejmowi przez Radę Ministrów, nie otrzyma jej do podpisu (na wydanie postanowienia w tej sprawie przysługuje głowie państwa czas 14 dni).  Bierne prawo wyborcze w wyborach do Sejmu RP uzyskuje się w wieku 21 lat, zgodnie z Konstytucją posłem nie może być osoba skazana za przestępstwo umyślne ścigane z oskarżenia publicznego na karę pozbawiania wolności (art. 99 ust. 3 Konstytucji RP), a także osoba ubezwłasnowolniona, pozbawiona praw publicznych lub wyborczych. Poza tym występuje w polskim porządku prawnym zasada incompatibilis, tj. nie można jednocześnie być posłem i pełnić określonych urzędów m.in. Rzecznika Praw Obywatelskich, sędziego, żołnierza czy policjanta.  Sejm działa w trybie permanencji (art. 109 Konstytucji RP), tj. w trakcie kadencji Sejm może zostać zwołany w każdym momencie bez zgody innych organów. Niższa izba obraduje pod przewodnictwem marszałka[3][4]. Jego obrady co do zasady są jawne, jednak Sejm może w szczególnych wypadkach uchwalić utajnienie obrad bezwzględną większością głosów[5]. Posiedzenia Sejmu odbywają się zazwyczaj co drugi lub co trzeci tydzień (tzw. tydzień sejmowy). Dłuższe przerwy zdarzają się w okresie wakacyjnym oraz świąteczno-noworocznym, a także pomiędzy ostatnim posiedzeniem Sejmu poprzedniej kadencji i pierwszym posiedzeniem nowej kadencji.  Urzędem wspierającym Sejm i jego organy w zakresie prawnym, organizacyjnym, finansowym i technicznym jest Kancelaria Sejmu.  Kompleks budynków Sejmu i Senatu jest usytuowany na skarpie wiślanej w rejonie ulic Wiejskiej, Górnośląskiej i Piotra Maszyńskiego w Warszawie."
      );

    // Submit form
    await page.getByRole("button", { name: "Generuj fiszki" }).click();
    await page.waitForLoadState("networkidle");

    // Should show generated flashcards
    await expect(page.getByText(/wygenerowane fiszki|fiszki/i)).toBeVisible();
  });
});
