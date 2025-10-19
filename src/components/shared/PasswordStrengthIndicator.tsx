interface PasswordStrengthIndicatorProps {
  password: string;
}

interface PasswordStrength {
  strength: string;
  color: string;
  width: string;
}

interface PasswordCheck {
  label: string;
  isValid: boolean;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const getPasswordStrength = (): PasswordStrength => {
    if (!password) return { strength: "", color: "bg-gray-200", width: "w-0" };

    const checks = {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;

    if (score === 4) return { strength: "Silne", color: "bg-green-500", width: "w-full" };
    if (score >= 3) return { strength: "Średnie", color: "bg-yellow-500", width: "w-3/4" };
    if (score >= 2) return { strength: "Słabe", color: "bg-orange-500", width: "w-1/2" };
    return { strength: "Bardzo słabe", color: "bg-red-500", width: "w-1/4" };
  };

  const getPasswordChecks = (): PasswordCheck[] => [
    {
      label: "Co najmniej 8 znaków",
      isValid: password.length >= 8,
    },
    {
      label: "Jedna duża litera",
      isValid: /[A-Z]/.test(password),
    },
    {
      label: "Jedna mała litera",
      isValid: /[a-z]/.test(password),
    },
    {
      label: "Jedna cyfra",
      isValid: /[0-9]/.test(password),
    },
  ];

  const passwordStrength = getPasswordStrength();
  const passwordChecks = getPasswordChecks();

  if (!password) return null;

  return (
    <div className="mt-2">
      {/* Strength Bar */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">Siła hasła:</span>
        <span className="text-xs font-medium text-gray-700">{passwordStrength.strength}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color} ${passwordStrength.width}`}
        />
      </div>

      {/* Requirements List */}
      <ul className="mt-2 space-y-1 text-xs text-gray-600">
        {passwordChecks.map((check, index) => (
          <li key={index} className="flex items-center gap-2">
            <svg
              className={`w-3 h-3 ${check.isValid ? "text-green-600" : "text-gray-400"}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
