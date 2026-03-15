import { redirect } from "next/navigation";

export default async function VerifyEmailPage({ searchParams, }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {

const params = await searchParams;

  // this redirects anyone trying to type into the search bar '/verify-email' directly.
  if (params.from !== "signup") {
    redirect("/sign-up");
  }

  return (
    <div className="flex mt-12 font-body items-center justify-center">
      <div className="text-center max-w-md p-6">
        <h1 className="text-2xl font-bold font-body mb-4">Check your email</h1>
        <p className="text-gray-600">
          We've sent you a verification link. Please check your email and click the link to verify your account.
        </p>
      </div>
    </div>
  );
}