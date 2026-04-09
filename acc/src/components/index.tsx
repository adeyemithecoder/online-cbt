import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
  useEffect,
} from "react";
import { Loader2, X, AlertTriangle, Search } from "lucide-react";
import ReactSelect from "react-select";

// ─── Button ──────────────────────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "danger"
    | "success"
    | "warning"
    | "ghost"
    | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const btnBase =
  "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 cursor-pointer border-none whitespace-nowrap select-none active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100";

const btnVariant: Record<string, string> = {
  primary:
    "bg-[var(--color-primary)] text-[var(--color-bg)] font-semibold shadow-[0_2px_16px_rgba(77,181,255,0.35)] hover:bg-[var(--color-primary-variant)] hover:text-white hover:shadow-none transition-all",

  secondary:
    "bg-[var(--color-primary-variant)] text-[var(--color-light)] border border-[var(--color-border)] hover:border-[var(--color-primary-variant)] hover:text-white hover:bg-[var(--color-bg)] transition-all",

  danger:
    "bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger-variant)] hover:text-[var(--color-danger)] border border-[var(--color-danger)] transition-all",

  success:
    "bg-[var(--color-success)] text-white hover:bg-[var(--color-success-variant)] hover:text-[var(--color-success)] border border-[var(--color-success)] transition-all",

  warning:
    "bg-[var(--color-warning)] text-[var(--color-bg)] hover:bg-[var(--color-warning-variant)] hover:text-[var(--color-warning)] border border-[var(--color-warning)] transition-all",

  ghost:
    "bg-transparent text-[var(--color-light)] hover:bg-[var(--color-bg-deep)] hover:text-white border border-transparent hover:border-[var(--color-border)] transition-all",

  outline:
    "bg-transparent text-[var(--color-primary)] border border-[var(--color-primary-variant)] hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)] hover:border-[var(--color-primary)] transition-all",
};

const btnSize: Record<string, string> = {
  sm: "px-3.5 py-1.5 text-[12px]",
  md: "px-5 py-2.5 text-[14px]",
  lg: "px-7 py-3 text-[15px]",
  icon: "p-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${btnBase} ${btnVariant[variant]} ${btnSize[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin text-light" />
      ) : (
        leftIcon
      )}

      {children}

      {!loading && rightIcon}
    </button>
  );
}

// ─── Shared form-field classes ─────────────────────────────────────────────
const labelCls =
  "text-[11px] font-semibold text-[var(--color-white)] uppercase tracking-[0.06em]";

const inputCls = (error?: string, extra = "") =>
  [
    "w-full bg-[var(--color-bg-deep)] border rounded-lg px-3.5 py-[10px] text-[14px] text-[var(--color-white)]",
    "outline-none transition-all duration-200",
    "placeholder:text-light",
    "[&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:invert",
    "focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-variant)]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    error
      ? "border-[var(--color-danger)] shadow-[0_0_0_3px_var(--color-danger-variant)]"
      : "border-bg-deep shadow-[0_0_0_3px_rgba(255,255,255,0.15)]",
    extra,
  ].join(" ");

// ─── Input ───────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
  required?: boolean;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  required?: boolean;
  id?: string;
}
export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightElement,
  className = "",
  required,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  const extraCls = `${leftIcon ? "pl-[38px]" : ""} ${
    rightElement ? "pr-10" : ""
  } ${className}`;

  const isNumber = props.type === "number";

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className={labelCls}>
          {label}
          {required && <span className="text-(--color-primary) ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-light pointer-events-none flex">
            {leftIcon}
          </span>
        )}

        {isNumber ? (
          <input
            id={inputId}
            type="text"
            inputMode="numeric"
            name={props.name}
            disabled={props.disabled}
            placeholder={props.placeholder}
            className={inputCls(error, extraCls)}
            value={
              props.value !== "" && props.value !== undefined
                ? Number(String(props.value).replace(/,/g, "")).toLocaleString(
                    "en-NG",
                  )
                : (props.value as string)
            }
            onChange={(e) => {
              const raw = e.target.value.replace(/,/g, "");
              if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
                props.onChange?.({
                  ...e,
                  target: { ...e.target, value: raw, name: e.target.name },
                } as any);
              }
            }}
          />
        ) : (
          <input
            id={inputId}
            className={inputCls(error, extraCls)}
            {...props}
            onClick={(e) => {
              (e.target as HTMLInputElement).showPicker?.();
              props.onClick?.(e);
            }}
          />
        )}

        {rightElement && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex">
            {rightElement}
          </span>
        )}
      </div>

      {error && (
        <span className="text-[12px] text-danger flex items-center gap-1">
          <AlertTriangle size={12} /> {error}
        </span>
      )}

      {hint && !error && <span className="text-[12px] text-light">{hint}</span>}
    </div>
  );
}

// ─── Select (react-select) ────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  placeholder?: string;
  required?: boolean;
  options: { value: string; label: string }[];
}

export function Select({
  label,
  error,
  placeholder,
  options,
  className = "",
  required,
  id,
  value,
  onChange,
  disabled,
}: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
  const rsOptions = options?.map((o) => ({ value: o.value, label: o.label }));
  const rsValue = rsOptions?.find((o) => o.value === value) ?? null;

  const handleChange = (selected: any) => {
    if (onChange) {
      onChange({
        target: { value: selected ? selected.value : "" },
      } as React.ChangeEvent<HTMLSelectElement>);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className={labelCls}>
          {label}
          {required && <span className="text-(--color-primary) ml-1">*</span>}
        </label>
      )}

      <ReactSelect
        inputId={selectId}
        options={rsOptions}
        value={rsValue}
        onChange={handleChange}
        placeholder={placeholder ?? "Select..."}
        isDisabled={disabled}
        classNamePrefix="rs"
        unstyled
        menuPlacement="auto"
        maxMenuHeight={200}
        styles={{
          menuList: (base) => ({
            ...base,
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.3) transparent",
          }),
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        }}
        menuPortalTarget={document.body}
        classNames={{
          control: ({ isFocused }) =>
            [
              inputCls(error, className),
              "flex items-center cursor-pointer",
              isFocused
                ? "!border-[var(--color-primary)] !shadow-[0_0_0_3px_var(--color-primary-variant)]"
                : "!shadow-[0_0_0_3px_rgba(255,255,255,0.15)]",
            ].join(" "),

          valueContainer: () => "flex-1 flex items-center gap-1",

          singleValue: () => "text-[var(--color-white)] text-[14px]",

          placeholder: () => "text-light text-[14px]",

          indicatorsContainer: () => "flex items-center pr-1",

          dropdownIndicator: () =>
            "text-light hover:text-[var(--color-white)] transition-colors",

          menu: () =>
            "mt-1.5 bg-[var(--color-bg-deep)] border border-bg-deep rounded-xl shadow-2xl overflow-hidden",

          menuList: () => "py-1",

          option: ({ isFocused, isSelected }) =>
            [
              "px-3.5 py-2.5 text-[13.5px] cursor-pointer transition-colors bg-bg",
              isSelected
                ? "bg-[var(--color-primary-variant)] text-(--color-primary) font-medium"
                : isFocused
                  ? "!bg-transparent text-[var(--color-white)]"
                  : "text-light",
            ].join(" "),

          noOptionsMessage: () => "px-3.5 py-2.5 text-[13px] text-light",
        }}
      />

      {error && <span className="text-[12px] text-danger">{error}</span>}
    </div>
  );
}

// ─── Textarea ──────────────────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}
export function Textarea({
  label,
  error,
  hint,
  className = "",
  required,
  id,
  ...props
}: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className={labelCls}>
          {label}
          {required && <span className="text-(--color-primary) ml-1">*</span>}
        </label>
      )}

      <textarea
        id={textareaId}
        className={inputCls(error, `resize-y min-h-[100px] ${className}`)}
        {...props}
      />

      {error && <span className="text-[12px] text-danger">{error}</span>}

      {hint && !error && <span className="text-[12px] text-light">{hint}</span>}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  hideClose?: boolean;
}

const modalWidth: Record<string, string> = {
  sm: "max-w-[420px]",
  md: "max-w-[560px]",
  lg: "max-w-[720px]",
  xl: "max-w-[900px]",
};

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  hideClose = false,
}: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`animate-scale-in bg-bg-deep border border-bg-deep rounded-2xl w-full ${modalWidth[size]} max-h-[90vh] overflow-hidden flex flex-col shadow-2xl`}
      >
        {(title || !hideClose) && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-bg-deep">
            {title && (
              <h3 className="text-[17px] font-semibold text-white m-0">
                {title}
              </h3>
            )}

            {!hideClose && (
              <button
                onClick={onClose}
                className="ml-auto p-2 rounded-lg text-light hover:text-white hover:bg-bg transition-all cursor-pointer bg-transparent border-none"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} size="sm" hideClose>
      <div className="p-7">
        <div className="flex justify-center mb-5">
          <div
            className={`rounded-full p-4 ${
              variant === "danger"
                ? "bg-danger-variant ring-4 ring-danger-variant/60"
                : "bg-primary-variant ring-4 ring-primary-variant/60"
            }`}
          >
            <AlertTriangle
              size={28}
              className={variant === "danger" ? "text-danger" : "text-primary"}
            />
          </div>
        </div>

        <div className="text-center mb-7">
          <h4 className="text-[20px] font-semibold text-white m-0 mb-2">
            {title}
          </h4>

          <p className="text-[14px] text-light leading-relaxed m-0">
            {message}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>

          <Button
            variant={variant}
            loading={loading}
            onClick={onConfirm}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
interface BadgeProps {
  children: ReactNode;
  variant?: "success" | "danger" | "warning" | "info" | "neutral";
  dot?: boolean;
}

const badgeVariant: Record<string, string> = {
  success: "bg-success-variant text-success border border-success-variant",

  danger: "bg-white text-danger border border-danger-variant",

  warning: "bg-warning-variant text-warning border border-warning-variant",

  info: "bg-primary-variant text-white border border-primary-variant",

  neutral: "bg-primary text-black border border-primary-variant",
};

export function Badge({
  children,
  variant = "neutral",
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold tracking-[0.03em] uppercase ${badgeVariant[variant]}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />}
      {children}
    </span>
  );
}

// ─── Loader ───────────────────────────────────────────────────────────────────
export function Loader({ size = 24, text }: { size?: number; text?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 p-10">
      <Loader2 size={size} className="animate-spin text-primary" />
      {text && <p className="text-[13px] text-light m-0">{text}</p>}
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({
  width = "100%",
  height = "16px",
  radius = "6px",
}: {
  width?: string;
  height?: string;
  radius?: string;
}) {
  return (
    <div className="shimmer" style={{ width, height, borderRadius: radius }} />
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 gap-3 text-center">
      {icon && <div className="text-light mb-1">{icon}</div>}

      <p className="text-[15px] font-medium text-light m-0">{title}</p>

      {description && (
        <p className="text-[13px] text-light/80 max-w-[320px] leading-relaxed m-0">
          {description}
        </p>
      )}

      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ─── SearchInput ──────────────────────────────────────────────────────────────
interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
}: SearchInputProps) {
  return (
    <div className="relative">
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-light pointer-events-none"
      />

      <input
        className={inputCls(undefined, "pl-9 w-[280px]")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

// ─── StatusToggle ─────────────────────────────────────────────────────────────
interface StatusToggleProps {
  active: boolean;
  onToggle: () => void;
  loading?: boolean;
  label?: string;
}

export function StatusToggle({
  active,
  onToggle,
  loading,
  label,
}: StatusToggleProps) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className="flex items-center gap-2 bg-transparent border-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed py-1"
    >
      <div
        className={`relative w-9 h-5 rounded-full shrink-0 transition-colors duration-200 ${
          active ? "bg-primary" : "bg-bg"
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${
            active ? "left-[18px]" : "left-0.5"
          }`}
        />
      </div>

      {label && <span className="text-[13px] text-light">{label}</span>}
    </button>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {icon && (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary-variant border border-primary-variant flex items-center justify-center text-primary shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-[18px] sm:text-[22px] font-semibold text-white m-0 leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[12px] sm:text-[13px] text-light m-0 mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex items-center gap-2 shrink-0">{action}</div>
      )}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({
  children,
  className = "",
  padding = true,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div
      className={`bg-bg-deep border border-bg-deep rounded-2xl ${
        padding ? "p-4 sm:p-6" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  icon,
  accent = false,
  sub,
  className = "",
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: boolean;
  sub?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl p-3 sm:p-5 border flex items-start justify-between gap-2 sm:gap-4 ${
        accent
          ? "bg-gradient-to-br from-primary-variant to-primary-variant/40 border-primary-variant"
          : "bg-bg-deep border-bg-deep"
      } ${className}`}
    >
      <div className="min-w-0">
        <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.06em] text-light m-0 mb-1.5">
          {label}
        </p>
        <p
          className={`text-[18px] sm:text-[22px] font-bold m-0 leading-none truncate ${
            accent ? "text-primary" : "text-white"
          }`}
        >
          {value}
        </p>
        {sub && (
          <p className="text-[11px] sm:text-[12px] text-light m-0 mt-1 truncate">
            {sub}
          </p>
        )}
      </div>
      <div
        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
          accent ? "bg-primary-variant text-primary" : "bg-bg text-light"
        }`}
      >
        {icon}
      </div>
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function Table({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`overflow-x-auto -mx-0 ${className}`}>
      <table className="w-full min-w-[480px] border-collapse text-[12.5px] sm:text-[13.5px]">
        {children}
      </table>
    </div>
  );
}

export function Th({
  children,
  className = "",
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      className={`text-left px-3 sm:px-4 py-2.5 sm:py-3 text-white text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.06em] border-b whitespace-nowrap ${className}`}
      style={{
        borderColor: "var(--color-bg-deep)",
        backgroundColor: "var(--color-bg)",
        opacity: 0.7,
      }}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className = "",
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      {...props}
      className={`px-3 sm:px-4 py-3 sm:py-3.5 border-b border-bg-deep/60 text-white align-middle ${className}`}
    >
      {children}
    </td>
  );
}

export function Tr({
  children,
  onClick,
  clickable,
}: {
  children: ReactNode;
  onClick?: () => void;
  clickable?: boolean;
}) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors ${
        clickable ? "cursor-pointer hover:bg-bg/40" : "hover:bg-bg/20"
      }`}
    >
      {children}
    </tr>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider({ label }: { label?: string }) {
  if (!label)
    return <hr className="border-none border-t border-bg-deep my-4" />;

  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-bg-deep" />

      <span className="text-[11px] text-light uppercase tracking-[0.08em]">
        {label}
      </span>

      <div className="flex-1 h-px bg-bg-deep" />
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { value: string; label: string; icon?: ReactNode }[];
  active: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1 p-1 bg-bg-deep/50 rounded-xl border border-bg-deep w-full sm:w-fit overflow-x-auto scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[12px] sm:text-[13px] font-medium transition-all cursor-pointer border-none whitespace-nowrap shrink-0 ${
            active === tab.value
              ? "bg-bg text-white shadow-sm"
              : "bg-transparent text-light hover:text-white"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── SectionTitle ─────────────────────────────────────────────────────────────
export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start sm:items-center justify-between gap-2 mb-3 sm:mb-4">
      <h3 className="text-[13px] sm:text-[14px] font-semibold text-white m-0 uppercase tracking-[0.05em]">
        {children}
      </h3>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
