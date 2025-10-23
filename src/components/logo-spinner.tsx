import logo from "../assets/logo.svg"

interface LogoSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const LogoSpinner = ({ size = "md", className = "" }: LogoSpinnerProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  }

  return (
    <img 
      src={logo} 
      alt="Loading..." 
      className={`animate-spin ${sizeClasses[size]} ${className}`}
    />
  )
}

export default LogoSpinner
