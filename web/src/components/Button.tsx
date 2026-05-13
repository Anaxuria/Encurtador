interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  variant: "primary" | "secondary";
  disabled?: boolean;
  img?: string;
}

export const Button = ({
  label,
  variant,
  disabled = false,
  img,
  ...props
}: ButtonProps) => {
  return (
    <>
      {variant === "primary" ? (
        <button
          className="w-full flex items-center justify-center p-3.75 bg-blue-base hover:bg-blue-dark rounded-lg cursor-pointer disabled:opacity-50 
          disabled:cursor-not-allowed disabled:hover:bg-blue-base"
          disabled={disabled}
          {...props}
        >
          {img ? (
            <img src={img} className="w-4 h-4 disabled:opacity-50" />
          ) : (
            <></>
          )}
          {label ? <span className="text-white etext-md">{label}</span> : <></>}
        </button>
      ) : (
        <button
          className="w-fit flex gap-1.5 items-center justify-center p-2 bg-gray-200 rounded-sm cursor-pointer border border-transparent hover:border-blue-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-transparent"
          disabled={disabled}
          {...props}
        >
          {img ? (
            <img src={img} className="w-4 h-4 disabled:opacity-50" />
          ) : (
            <></>
          )}
          {label ? (
            <span className="text-gray-500 etext-smb">{label}</span>
          ) : (
            <></>
          )}
        </button>
      )}
    </>
  );
};
