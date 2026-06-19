import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Check, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/register")({ component: Register });

const accountSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  mobile: z.string().trim().min(7).max(20),
  password: z.string().min(6).max(72),
});

const personalSchema = z.object({
  date_of_birth: z.string().min(1, "Date of birth required"),
  address: z.string().trim().min(1, "Address required"),
  skills: z.string().trim().min(1, "Skills required"),
  internship_domain: z.string().trim().min(1, "Domain required"),
});

const collegeSchema = z.object({
  college_name: z.string().trim().min(1),
  degree: z.string().trim().min(1),
  branch: z.string().trim().min(1),
  year_of_passing: z.string().regex(/^\d{4}$/),
});

function Register() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [account, setAccount] = useState({ name: "", email: "", mobile: "", password: "" });
  const [personal, setPersonal] = useState({ date_of_birth: "", address: "", skills: "", internship_domain: "" });
  const [college, setCollege] = useState({ college_name: "", degree: "", branch: "", year_of_passing: "" });

  const submitAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const r = accountSchema.safeParse(account);
    if (!r.success) return toast.error(r.error.issues[0].message);
    setStep(2);
  };

  const submitPersonal = (e: React.FormEvent) => {
    e.preventDefault();
    const r = personalSchema.safeParse(personal);
    if (!r.success) return toast.error(r.error.issues[0].message);
    setStep(3);
  };

  const submitCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = collegeSchema.safeParse(college);
    if (!r.success) return toast.error(r.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: account.email,
      password: account.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { name: account.name, mobile: account.mobile },
      },
    });
    if (error) { setLoading(false); return toast.error(error.message); }

    // Save pending onboarding data; flushed to DB after email verification (use-auth)
    try {
      localStorage.setItem("pendingOnboarding", JSON.stringify({
        email: account.email,
        personal,
        college: { ...college, year_of_passing: parseInt(college.year_of_passing, 10) },
      }));
    } catch { /* ignore */ }

    setLoading(false);
    toast.success("Verification email sent. Please verify to finish registration.");
    nav({ to: "/verify-email", search: { email: account.email, next: "/dashboard" } });
  };

  const progress = (step / 3) * 100;

  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <Link to="/" className="mb-6 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-semibold">Prima Interns</span>
        </Link>

        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Step {step} of 3</p>

        <div className="my-4">
          <Progress value={progress} />
        </div>

        <div className="mb-6 flex items-center gap-2 text-sm">
          {[
            { n: 1, t: "Account" },
            { n: 2, t: "Personal" },
            { n: 3, t: "College & Email" },
          ].map((s, i) => (
            <div key={s.n} className="flex flex-1 items-center gap-2">
              <div className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
                step > s.n ? "bg-success text-success-foreground"
                : step === s.n ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
              }`}>
                {step > s.n ? <Check className="h-4 w-4" /> : s.n}
              </div>
              <span className={step >= s.n ? "font-medium" : "text-muted-foreground"}>{s.t}</span>
              {i < 2 && <div className="mx-1 h-px flex-1 bg-border" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <form onSubmit={submitAccount} className="space-y-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" required value={account.name} onChange={(e) => setAccount({ ...account, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="mobile">Mobile number</Label>
              <Input id="mobile" required value={account.mobile} onChange={(e) => setAccount({ ...account, mobile: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={account.password} onChange={(e) => setAccount({ ...account, password: e.target.value })} />
            </div>
            <Button type="submit" className="w-full">Continue</Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={submitPersonal} className="space-y-4">
            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" type="date" required value={personal.date_of_birth} onChange={(e) => setPersonal({ ...personal, date_of_birth: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" required value={personal.address} onChange={(e) => setPersonal({ ...personal, address: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input id="skills" required placeholder="React, Node.js, SQL" value={personal.skills} onChange={(e) => setPersonal({ ...personal, skills: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="domain">Internship Domain</Label>
              <Input id="domain" required placeholder="Frontend Development" value={personal.internship_domain} onChange={(e) => setPersonal({ ...personal, internship_domain: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button type="submit" className="flex-1">Continue</Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={submitCollege} className="space-y-4">
            <div>
              <Label htmlFor="college">College Name</Label>
              <Input id="college" required value={college.college_name} onChange={(e) => setCollege({ ...college, college_name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="degree">Degree</Label>
              <Input id="degree" required placeholder="B.Tech" value={college.degree} onChange={(e) => setCollege({ ...college, degree: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="branch">Branch</Label>
              <Input id="branch" required placeholder="Computer Science" value={college.branch} onChange={(e) => setCollege({ ...college, branch: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="year">Year of Passing</Label>
              <Input id="year" type="number" required min="2000" max="2099" value={college.year_of_passing} onChange={(e) => setCollege({ ...college, year_of_passing: e.target.value })} />
            </div>
            <p className="text-xs text-muted-foreground">A verification link will be sent to <strong>{account.email}</strong> when you submit.</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)} disabled={loading}>Back</Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Creating..." : "Create & Verify Email"}
              </Button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already registered? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
