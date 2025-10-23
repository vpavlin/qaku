import logo from "../assets/logo.svg"

interface LogoSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const LogoSpinner = ({ size = "md", className = "" }: LogoSpinnerProps) => {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-28 h-28"
  }

  return (
    <div style={{ perspective: '1000px' }}>
      <img 
        src={logo} 
        alt="Loading..." 
        className={`animate-spin-y ${sizeClasses[size]} ${className}`}
        style={{ transformStyle: 'preserve-3d' }}
      />
    </div>
  )
}

export default LogoSpinner
