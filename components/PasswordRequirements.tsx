type Requirement = {
  label: string;
  met: boolean;
};

type PasswordRequirementsProps = {
  password: string;
};

const PasswordRequirements = ({ password }: PasswordRequirementsProps) => {
  const requirements: Requirement[] = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
  ];

  if (!password) return null;

  return (
    <ul className="flex flex-col gap-1">
      {requirements.map(({ label, met }) => (
        <li key={label} className="flex items-center gap-2 text-medium">
          <div
            className={`badge badge-sm ${
              met ? "badge-success" : "badge-error"
            }`}
          >
            {met ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
          </div>
          <span className="text-gray-800">{label}</span>
        </li>
      ))}
    </ul>
  );
};

export default PasswordRequirements;
