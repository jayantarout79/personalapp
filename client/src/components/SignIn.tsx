import { useState, type FormEvent } from "react";
import { signIn } from "../auth";

type SignInProps = {
  onSignedIn: (token: string) => void;
};

export function SignIn({ onSignedIn }: SignInProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await signIn(email, password);
      onSignedIn(session.access_token);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to sign in.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card signin-card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Secure access</p>
          <h3>Sign in to Finance Tracker</h3>
          <p className="muted">Use your Supabase credentials. No sign-up here.</p>
        </div>
      </div>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="form-field form-field-full">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
        </label>
        <label className="form-field form-field-full">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </label>
        {error && (
          <p className="muted" style={{ color: "#DC2626" }}>
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}
