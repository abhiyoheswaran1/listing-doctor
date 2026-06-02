import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

type FieldProps = {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
};

export function Field({ label, hint, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label>
        {label}
        {required ? <span className="ml-1 text-danger">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-[11px] font-medium leading-4 text-muted">{hint}</p> : null}
    </div>
  );
}

export function TextInput({
  label,
  hint,
  required,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & Omit<FieldProps, "children">) {
  return (
    <Field label={label} hint={hint} required={required}>
      <input {...props} />
    </Field>
  );
}

export function SelectInput({
  label,
  hint,
  required,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & Omit<FieldProps, "children">) {
  return (
    <Field label={label} hint={hint} required={required}>
      <select {...props}>{children}</select>
    </Field>
  );
}

export function TextAreaInput({
  label,
  hint,
  required,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & Omit<FieldProps, "children">) {
  return (
    <Field label={label} hint={hint} required={required}>
      <textarea {...props} />
    </Field>
  );
}
