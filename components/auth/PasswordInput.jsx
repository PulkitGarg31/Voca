"use client";
import { useState } from "react";

// Password input with a show/hide toggle. Forwards value/onChange like a normal
// controlled input; extra props (required, minLength, placeholder) pass through.
export default function PasswordInput({ value, onChange, placeholder = "••••••••", ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input pr-11"
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md text-faint hover:text-accent focus-visible:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 transition-colors"
      >
        {show ? (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 4.2A9.5 9.5 0 0112 4c5 0 9 4.5 9 8a12 12 0 01-2.2 3.3M6.1 6.1A12.4 12.4 0 003 12c0 3.5 4 8 9 8a9.8 9.8 0 003.9-.8" /></svg>
        ) : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
        )}
      </button>
    </div>
  );
}
