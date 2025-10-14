import { useState } from "react";

interface MobileMenuProps {
  isAuthenticated?: boolean;
}

export function MobileMenu({ isAuthenticated = false }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
        aria-expanded={isOpen}
        aria-label="Toggle menu"
      >
        {!isOpen ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </button>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
          <div className="px-4 py-6 space-y-4">
            {!isAuthenticated && (
              <>
                <a
                  href="#features"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  Funkcje
                </a>
                <a
                  href="#how-it-works"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  Jak to działa
                </a>
                <a
                  href="#faq"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  FAQ
                </a>
              </>
            )}

            {isAuthenticated && (
              <a
                href="/generate"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                Generuj fiszki
              </a>
            )}

            <div className="pt-4 border-t border-gray-200 space-y-2">
              {!isAuthenticated ? (
                <>
                  <a
                    href="/login"
                    className="block w-full text-center px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Zaloguj się
                  </a>
                  <a
                    href="/register"
                    className="block w-full text-center px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Zarejestruj się
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="/generate"
                    className="block w-full text-center px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Generuj
                  </a>
                  <form method="POST" action="/logout">
                    <button
                      type="submit"
                      className="block w-full text-center px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Wyloguj
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
