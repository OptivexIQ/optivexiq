export type PasswordRequirement = {
  key: "length" | "numberOrSymbol" | "noEmail" | "noName";
  label: string;
  valid: boolean;
};

type PasswordPolicyInput = {
  password: string;
  email?: string | null;
  name?: string | null;
};

const numberOrSymbol = /[0-9]|[^a-zA-Z0-9]/;

function normalize(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function contains(haystack: string, needle: string) {
  if (!needle) {
    return false;
  }

  return haystack.includes(needle);
}

function tokenize(value: string) {
  return value
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

export function evaluatePasswordPolicy(input: PasswordPolicyInput) {
  const password = input.password ?? "";
  const normalizedPassword = password.toLowerCase();
  const normalizedEmail = normalize(input.email);
  const normalizedName = normalize(input.name);
  const emailLocalPart = normalizedEmail.split("@")[0] ?? "";
  const emailTokens = [
    normalizedEmail,
    emailLocalPart,
    ...tokenize(emailLocalPart),
  ].filter(Boolean);
  const nameTokens = [
    normalizedName,
    normalizedName.replace(/\s+/g, ""),
    ...tokenize(normalizedName),
  ].filter(Boolean);

  const lengthValid = password.length >= 8;
  const numberOrSymbolValid = numberOrSymbol.test(password);
  const noEmailValid = emailTokens.every(
    (token) => !contains(normalizedPassword, token),
  );
  const noNameValid = nameTokens.every(
    (token) => !contains(normalizedPassword, token),
  );

  const requirements: PasswordRequirement[] = [
    {
      key: "length",
      label: "At least 8 characters",
      valid: lengthValid,
    },
    {
      key: "numberOrSymbol",
      label: "Includes a number or symbol",
      valid: numberOrSymbolValid,
    },
    {
      key: "noEmail",
      label: "Does not include your email",
      valid: noEmailValid,
    },
    {
      key: "noName",
      label: "Does not include your name",
      valid: noNameValid,
    },
  ];

  return {
    requirements,
    isValid: requirements.every((item) => item.valid),
    strength: getPasswordStrength(requirements),
  };
}

export function getPasswordStrength(requirements: PasswordRequirement[]) {
  const score = requirements.reduce(
    (total, item) => total + (item.valid ? 1 : 0),
    0,
  );

  if (score <= 1) {
    return "Weak";
  }

  if (score <= 3) {
    return "Medium";
  }

  return "Strong";
}
