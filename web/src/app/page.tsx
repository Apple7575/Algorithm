import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Algo-PT</h1>
        <p className="text-xl text-muted-foreground max-w-md">
          AI-powered personalized algorithm learning system with spaced repetition and
          intelligent coaching.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="py-2 px-6 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="py-2 px-6 border border-primary text-primary rounded-md font-medium hover:bg-primary/10"
          >
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
