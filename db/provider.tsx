// The schema is created synchronously in client.ts at DB open, so there's nothing
// async to wait for here — just render. (Kept as a component so _layout.tsx is unchanged.)
export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
