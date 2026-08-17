import type { PropsWithChildren } from 'react';

const AuthLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex min-h-svh flex-col bg-background px-4 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8">
        <img
          src="/logo.png"
          alt="WindWise"
          width={944}
          height={264}
          decoding="async"
          className="h-12 w-auto mx-auto lg:h-16 dark:invert dark:hue-rotate-180"
        />
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
