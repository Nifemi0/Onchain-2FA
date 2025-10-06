import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";
import { ArrowLeft } from "lucide-react";

interface AuthPageProps {
  onVerify: (otp: string) => void;
  onBack: () => void;
}

export function AuthPage({ onVerify, onBack }: AuthPageProps) {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      setIsLoading(true);
      // Simulate verification delay
      setTimeout(() => {
        setIsLoading(false);
        onVerify(otp);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 text-[#A3A3A3] hover:text-white hover:bg-[#1A1A1A]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
        
        <Card className="bg-[#1A1A1A] border-[#2E2E2E] shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="w-12 h-12 bg-[#FF6600] rounded-xl flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-lg">2FA</span>
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Onchain 2FA
            </CardTitle>
            <CardDescription className="text-[#A3A3A3]">
              Enter your one-time password to continue.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">
                  One-Time Password
                </label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    className="gap-2"
                  >
                    <InputOTPGroup className="gap-2">
                      <InputOTPSlot 
                        index={0} 
                        className="w-12 h-12 border-[#2E2E2E] bg-[#0A0A0A] text-white focus:border-[#FF6600] focus:ring-[#FF6600]" 
                      />
                      <InputOTPSlot 
                        index={1} 
                        className="w-12 h-12 border-[#2E2E2E] bg-[#0A0A0A] text-white focus:border-[#FF6600] focus:ring-[#FF6600]" 
                      />
                      <InputOTPSlot 
                        index={2} 
                        className="w-12 h-12 border-[#2E2E2E] bg-[#0A0A0A] text-white focus:border-[#FF6600] focus:ring-[#FF6600]" 
                      />
                      <InputOTPSlot 
                        index={3} 
                        className="w-12 h-12 border-[#2E2E2E] bg-[#0A0A0A] text-white focus:border-[#FF6600] focus:ring-[#FF6600]" 
                      />
                      <InputOTPSlot 
                        index={4} 
                        className="w-12 h-12 border-[#2E2E2E] bg-[#0A0A0A] text-white focus:border-[#FF6600] focus:ring-[#FF6600]" 
                      />
                      <InputOTPSlot 
                        index={5} 
                        className="w-12 h-12 border-[#2E2E2E] bg-[#0A0A0A] text-white focus:border-[#FF6600] focus:ring-[#FF6600]" 
                      />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={otp.length !== 6 || isLoading}
                className="w-full bg-[#FF6600] hover:bg-[#FF7A00] text-white py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-[#FF6600]/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Verifying..." : "Verify OTP"}
              </Button>
            </form>
            
            <div className="text-center">
              <p className="text-[#A3A3A3] text-sm">
                Didn't receive a code?{" "}
                <button className="text-[#FF6600] hover:text-[#FF7A00] font-medium">
                  Resend
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}