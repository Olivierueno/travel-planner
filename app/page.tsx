import LoginForm from '@/components/LoginForm';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4">
        <LoginForm />
      </main>
      <p className="text-center text-[10px] text-neutral-400 pb-4">
        &copy; {new Date().getFullYear()} UENO Systems. Privacy-first, usage-based pricing. Provided as-is.
      </p>
    </div>
  );
}
