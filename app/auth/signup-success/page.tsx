import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center p-2">
              <Image
                src="/pelican-logo-transparent.png"
                alt="Pelican AI"
                width={32}
                height={32}
                className="w-full h-full object-contain brightness-110 saturate-125"
              />
            </div>
            <h1 className="text-2xl font-bold">Check your email</h1>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Thank you for signing up!</CardTitle>
              <CardDescription>Check your email to confirm your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You&apos;ve successfully signed up for Pelican AI. Please check your email to confirm your account
                before signing in.
              </p>
              <div className="flex flex-col gap-2">
                <Button variant="outline" asChild className="w-full bg-transparent">
                  <Link href="/auth/login">Back to Login</Link>
                </Button>
                <Button variant="outline" asChild className="w-full bg-transparent">
                  <Link href="/">Go Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
