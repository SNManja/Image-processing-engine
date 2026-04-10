import React from "react";
import "./ToggleSwitch.css";

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  title?: string;
};

export default function ToggleSwitch({ checked, onChange, label, title }: ToggleSwitchProps) {
  function toggle() {
    onChange(!checked);
  }

  function onKey(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  }

  return (
    <div className="toggle-switch-wrapper" title={title}>
      {label && <span className="toggle-label">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`switch ${checked ? "on" : "off"}`}
        onClick={toggle}
        onKeyDown={onKey}
      >
        <span className="switch-thumb" />
      </button>
    </div>
  );
}
