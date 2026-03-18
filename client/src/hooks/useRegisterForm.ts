import { useMemo, useState } from 'react';

type FieldName = 'fullName' | 'email' | 'password' | 'confirmPassword';

type FormValues = Record<FieldName, string>;
type FormErrors = Partial<Record<FieldName, string>>;
type TouchedFields = Record<FieldName, boolean>;

const initialValues: FormValues = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const initialTouched: TouchedFields = {
  fullName: false,
  email: false,
  password: false,
  confirmPassword: false,
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.fullName.trim()) {
    errors.fullName = 'Tell us what to call you.';
  } else if (values.fullName.trim().length < 2) {
    errors.fullName = 'Your name should be at least 2 characters.';
  }

  if (!values.email.trim()) {
    errors.email = 'Enter the email you want to use.';
  } else if (!emailRegex.test(values.email.trim())) {
    errors.email = 'Use a valid email address.';
  }

  if (!values.password) {
    errors.password = 'Choose a password.';
  } else if (values.password.length < 8) {
    errors.password = 'Use at least 8 characters.';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Re-enter your password.';
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Those passwords do not match yet.';
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
      [field]: field === 'email' ? nextValue.trim().toLowerCase() : nextValue,
    }));
  };

  const touchField = (field: FieldName) => {
    setTouched(current => ({ ...current, [field]: true }));
  };

  const markAllTouched = () => {
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
  };

  const validity = {
    fullName: values.fullName.trim().length >= 2,
    email: emailRegex.test(values.email.trim()),
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
