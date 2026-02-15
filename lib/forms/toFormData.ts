type FormValue = string | number | boolean | null | undefined;

type FormValues = Record<string, FormValue>;

export function toFormData(values: FormValues) {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    formData.set(key, String(value));
  });

  return formData;
}
