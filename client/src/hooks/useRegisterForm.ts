import { useMemo, useState } from 'react';

type FieldName = 'firstName' | 'lastName' | 'username' | 'password' | 'confirmPassword';

type FormValues = Record<FieldName, string>;
type FormErrors = Partial<Record<FieldName, string>>;
type TouchedFields = Record<FieldName, boolean>;

const initialValues: FormValues = {
  firstName: '',
  lastName: '',
  username: '',
  password: '',
  confirmPassword: '',
};

const initialTouched: TouchedFields = {
  firstName: false,
  lastName: false,
  username: false,
  password: false,
  confirmPassword: false,
};

const usernameRegex = /^[a-z0-9._-]+$/i;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.firstName.trim()) {
    errors.firstName = 'Inserisci il tuo nome.';
  } else if (values.firstName.trim().length < 2) {
    errors.firstName = 'Il nome deve avere almeno 2 caratteri.';
  }

  if (!values.lastName.trim()) {
    errors.lastName = 'Inserisci il tuo cognome.';
  } else if (values.lastName.trim().length < 2) {
    errors.lastName = 'Il cognome deve avere almeno 2 caratteri.';
  }

  if (!values.username.trim()) {
    errors.username = 'Inserisci nome utente.';
  } else if (values.username.trim().length < 3) {
    errors.username = 'Il nome utente deve avere almeno 3 caratteri.';
  } else if (!usernameRegex.test(values.username.trim())) {
    errors.username = 'Usa solo lettere, numeri, punto, trattino o underscore.';
  }

  if (!values.password) {
    errors.password = 'Inserisci una password.';
  } else if (values.password.length < 8) {
    errors.password = 'La password deve essere di almeno 8 caratteri.';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Conferma la password.';
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Le password non coincidono.';
  }

  return errors;
}

export function useRegisterForm() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [touched, setTouched] = useState<TouchedFields>(initialTouched);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const allErrors = useMemo(() => validate(values), [values]);

  const errors = useMemo(
    () =>
      Object.entries(allErrors).reduce<FormErrors>((acc, [field, error]) => {
        if (touched[field as FieldName] && error) {
          acc[field as FieldName] = error;
        }
        return acc;
      }, {}),
    [allErrors, touched],
  );

  const setFieldValue = (field: FieldName, nextValue: string) => {
    setValues(current => ({
      ...current,
      [field]: field === 'username' ? nextValue.trim().toLowerCase() : nextValue,
    }));
  };

  const touchField = (field: FieldName) => {
    setTouched(current => ({ ...current, [field]: true }));
  };

  const markAllTouched = () => {
    setTouched({
      firstName: true,
      lastName: true,
      username: true,
      password: true,
      confirmPassword: true,
    });
  };

  const validity = {
    firstName: values.firstName.trim().length >= 2,
    lastName: values.lastName.trim().length >= 2,
    username: values.username.trim().length >= 3 && usernameRegex.test(values.username.trim()),
    password: values.password.length >= 8,
    confirmPassword: values.confirmPassword.length > 0 && values.confirmPassword === values.password,
  };

  return {
    values,
    errors,
    validity,
    isValid: Object.keys(allErrors).length === 0,
    setFieldValue,
    touchField,
    markAllTouched,
    passwordVisible,
    confirmPasswordVisible,
    setPasswordVisible,
    setConfirmPasswordVisible,
  };
}
