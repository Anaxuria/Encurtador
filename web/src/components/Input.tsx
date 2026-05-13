import { useState } from "react";
import DangerIcon from "../assets/icon/icon-warning.svg";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
  errorMessage?: string;
  prefixText?: string;
}

export const Input = ({
  label,
  error = false,
  errorMessage,
  prefixText,
  ...props
}: InputProps) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <label
        className={`etext-xs ${error ? "text-danger" : focused ? "text-blue-base" : "text-gray-500"}`}
      >
        {label}
      </label>

      <div
        className={`w-full flex py-3 px-4 border rounded-lg etext-mdr text-gray-600 focus-within:outline-[1.5px] 
          ${error ? "border-danger focus-within:outline-danger" : "border-gray-300 focus-within:outline-blue-base"}`}
      >
        {prefixText && (
          <span className="text-gray-500 mr-0.5 whitespace-nowrap">
            {prefixText}
          </span>
        )}
        <input
          type="text"
          className="w-full bg-transparent focus:outline-none"
          placeholder={props.placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </div>

      {error && errorMessage && (
        <div className="flex items-center gap-2">
          <img src={DangerIcon} alt="Ícone de alerta" className="w-4 h-4" />
          <span className="etext-sm text-gray-500">{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
