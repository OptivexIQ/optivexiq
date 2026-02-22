export type PasswordRequirement = {
  key:
    | "length"
    | "lowercase"
    | "uppercase"
    | "number"
    | "special"
    | "noEmail"
    | "noUsername";
  label: string;
  valid: boolean;
};

type PasswordPolicyInput = {
  password: string;
  email?: string | null;
  name?: string | null;
};

const hasLowercase = /[a-z]/;
const hasUppercase = /[A-Z]/;
const hasNumber = /[0-9]/;
const hasSpecial = /[^a-zA-Z0-9]/;

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
  const normalizedUsername = normalize(input.name);
  const emailLocalPart = normalizedEmail.split("@")[0] ?? "";
  const emailTokens = [
    normalizedEmail,
    emailLocalPart,
    ...tokenize(emailLocalPart),
  ].filter(Boolean);
  const usernameTokens = [
    normalizedUsername,
    normalizedUsername.replace(/\s+/g, ""),
    ...tokenize(normalizedUsername),
  ].filter(Boolean);

  const lengthValid = password.length >= 12;
  const lowercaseValid = hasLowercase.test(password);
  const uppercaseValid = hasUppercase.test(password);
  const numberValid = hasNumber.test(password);
  const specialValid = hasSpecial.test(password);
  const noEmailValid = emailTokens.every(
    (token) => !contains(normalizedPassword, token),
  );
  const noUsernameValid = usernameTokens.every(
    (token) => !contains(normalizedPassword, token),
  );

  const requirements: PasswordRequirement[] = [
    {
      key: "length",
      label: "Includes 12 characters",
      valid: lengthValid,
    },
    {
      key: "lowercase",
      label: "Lowercase letter",
      valid: lowercaseValid,
    },
    {
      key: "uppercase",
      label: "Uppercase letter",
      valid: uppercaseValid,
    },
    {
      key: "number",
      label: "Number",
      valid: numberValid,
    },
    {
      key: "special",
      label: "Special character",
      valid: specialValid,
    },
    {
      key: "noEmail",
      label: "Not your email",
      valid: noEmailValid,
    },
    {
      key: "noUsername",
      label: "Not your username",
      valid: noUsernameValid,
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
