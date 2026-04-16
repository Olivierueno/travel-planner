import LoginForm from '@/components/LoginForm';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4">
        <LoginForm />
      </main>
      <Footer />
    </div>
  );
}
