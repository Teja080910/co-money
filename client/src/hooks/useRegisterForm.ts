import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

type FieldName = 'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword';

type FormValues = Record<FieldName, string>;
type FormErrors = Partial<Record<FieldName, string>>;
type TouchedFields = Record<FieldName, boolean>;

const initialValues: FormValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const initialTouched: TouchedFields = {
  firstName: false,
  lastName: false,
  email: false,
  password: false,
  confirmPassword: false,
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useRegisterForm() {
  const { t } = useTranslation();
  const [values, setValues] = useState<FormValues>(initialValues);
  const [touched, setTouched] = useState<TouchedFields>(initialTouched);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const allErrors = useMemo(() => {
    const errors: FormErrors = {};

    if (!values.firstName.trim()) {
      errors.firstName = t('auth.register.errors.firstNameRequired');
    } else if (values.firstName.trim().length < 2) {
      errors.firstName = t('auth.register.errors.firstNameShort');
    }

    if (!values.lastName.trim()) {
      errors.lastName = t('auth.register.errors.lastNameRequired');
    } else if (values.lastName.trim().length < 2) {
      errors.lastName = t('auth.register.errors.lastNameShort');
    }

    if (!values.email.trim()) {
      errors.email = t('auth.register.errors.emailRequired');
    } else if (!emailRegex.test(values.email.trim())) {
      errors.email = t('auth.register.errors.emailInvalid');
    }

    if (!values.password) {
      errors.password = t('auth.register.errors.passwordRequired');
    } else if (values.password.length < 8) {
      errors.password = t('auth.register.errors.passwordShort');
    }

    if (!values.confirmPassword) {
      errors.confirmPassword = t('auth.register.errors.confirmRequired');
    } else if (values.confirmPassword !== values.password) {
      errors.confirmPassword = t('auth.register.errors.confirmMismatch');
    }

    return errors;
  }, [t, values]);

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
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
  };

  const validity = {
    firstName: values.firstName.trim().length >= 2,
    lastName: values.lastName.trim().length >= 2,
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
