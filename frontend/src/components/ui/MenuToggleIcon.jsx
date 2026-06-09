import * as React from "react"

export const MenuToggleIcon = ({ isOpen, className }) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M3 12H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-all duration-300 origin-center ${
          isOpen ? "rotate-45 translate-y-0" : "-translate-y-1.5"
        }`}
      />
      <path
        d="M3 12H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-all duration-300 origin-center ${
          isOpen ? "-rotate-45" : "translate-y-1.5"
        }`}
      />
    </svg>
  )
}
