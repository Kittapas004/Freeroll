import { LoginForm } from "@/components/login-form";

import '@/app/globals.css';

export default function LoginPage() {
  
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10 relative">
      <div className="flex flex-row items-center gap-4 absolute top-4 right-4">
        
      </div>  
      <div className="flex w-full max-w-sm flex-col gap-6 items-center">
          <div className="flex items-center justify-center rounded-md text-primary-foreground">
            <img src="TurmeRic-logo.png" className="bg-transparent" alt="Logo"/>
          </div>
        <LoginForm />
      </div>
    </div>
  )
}
