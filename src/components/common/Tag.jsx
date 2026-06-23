export default function Tag({ children, variant = 'amber', className = '' }) {
  return (
    <span className={`tag tag-${variant} ${className}`}>
      {children}
    </span>
  );
}
