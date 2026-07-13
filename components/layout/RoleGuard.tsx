import React from 'react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  // TODO: Implement in Phase 2
  const roles = allowedRoles;
  return (
    <>
      {children}
      <span className="hidden">{roles.join(', ')}</span>
    </>
  );
}
