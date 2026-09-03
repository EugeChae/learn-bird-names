import Link from "next/link";
import type { ReactNode } from "react";

// ─── Button · 공용 버튼 개체 ──────────────────────────────────────────────────
// 귀여운 도감 톤: 알약(pill) + 부드러운 그림자 + 눌리는 마이크로 인터랙션.
// href를 주면 next/link(a), 아니면 button으로 렌더한다.

type Variant = "primary" | "soft" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "bg-green-600 text-white shadow-soft hover:bg-green-700",
  soft: "bg-leaf-soft text-leaf hover:brightness-95",
  outline:
    "border-2 border-green-200 bg-white text-green-800 hover:border-green-400 hover:bg-green-50",
  danger: "border-2 border-blush/40 bg-white text-petal hover:bg-blush-soft",
};

const SIZE: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-6 py-3 text-lg",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold " +
  "transition-[transform,background-color,box-shadow,filter] duration-150 " +
  "hover:-translate-y-0.5 active:scale-[0.97] " +
  "disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  className?: string;
  children: ReactNode;
}

type ButtonProps = BaseProps & {
  href?: undefined;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  "aria-label"?: string;
};

type LinkProps = BaseProps & { href: string };

export default function Button(props: ButtonProps | LinkProps) {
  const {
    variant = "primary",
    size = "md",
    fullWidth,
    leadingIcon,
    className = "",
    children,
  } = props;
  const cls = `${BASE} ${VARIANT[variant]} ${SIZE[size]} ${
    fullWidth ? "w-full" : ""
  } ${className}`;

  if ("href" in props && props.href !== undefined) {
    return (
      <Link href={props.href} className={cls}>
        {leadingIcon}
        {children}
      </Link>
    );
  }

  const { type = "button", onClick, disabled } = props;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={props["aria-label"]}
      className={cls}
    >
      {leadingIcon}
      {children}
    </button>
  );
}
