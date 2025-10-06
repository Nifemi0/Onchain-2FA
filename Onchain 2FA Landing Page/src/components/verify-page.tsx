import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { CheckCircle, XCircle, ArrowLeft, RotateCcw, Shield, AlertTriangle, ExternalLink } from "lucide-react";

interface VerifyPageProps {
  isSuccess: boolean;
  otp: string;
  onBack: () => void;
  onRetry: () => void;
}

export function VerifyPage({ isSuccess, otp, onBack, onRetry }: VerifyPageProps) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [transactionHash] = useState(() => 
    `0x${Math.random().toString(16).substring(2, 18)}...${Math.random().toString(16).substring(2, 6)}`
  );

  useEffect(() => {
    const timer = setTimeout(() => setShowAnimation(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className={`absolute inset-0 transition-all duration-1000 ${
        isSuccess 
          ? 'bg-gradient-to-br from-[#FF6600]/5 to-transparent' 
          : 'bg-gradient-to-br from-red-500/5 to-transparent'
      }`}></div>
      
      <div className="w-full max-w-lg relative z-10">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-8 text-[#A3A3A3] hover:text-white hover:bg-[#1A1A1A] transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
        
        <Card className={`bg-[#1A1A1A] border shadow-2xl transition-all duration-500 ${
          showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } ${
          isSuccess 
            ? 'border-[#FF6600]/30 shadow-[#FF6600]/10' 
            : 'border-red-500/30 shadow-red-500/10'
        }`}>
          <CardHeader className="text-center space-y-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all duration-500 ${
              isSuccess 
                ? 'bg-gradient-to-br from-[#FF6600]/20 to-[#FF6600]/10 animate-pulse' 
                : 'bg-gradient-to-br from-red-500/20 to-red-500/10'
            }`}>
              {isSuccess ? (
                <CheckCircle className="w-12 h-12 text-[#FF6600] animate-bounce" />
              ) : (
                <XCircle className="w-12 h-12 text-red-500 animate-pulse" />
              )}
            </div>
            
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-white">
                {isSuccess ? "Verification Successful!" : "Verification Failed"}
              </CardTitle>
              <CardDescription className="text-[#A3A3A3] text-lg">
                {isSuccess 
                  ? "Your identity has been verified onchain using zero-knowledge proofs"
                  : "The OTP verification failed. Please check your code and try again."
                }
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* OTP Display */}
            <div className="bg-[#0A0A0A] border border-[#2E2E2E] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[#A3A3A3] flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  OTP Verification Code
                </p>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isSuccess 
                    ? 'bg-[#FF6600]/20 text-[#FF6600]' 
                    : 'bg-red-500/20 text-red-500'
                }`}>
                  {isSuccess ? 'VERIFIED' : 'FAILED'}
                </div>
              </div>
              <div className="flex justify-center gap-2">
                {otp.split('').map((digit, index) => (
                  <div 
                    key={index}
                    className={`w-12 h-12 border rounded-lg flex items-center justify-center text-white text-lg font-mono transition-all duration-300 ${
                      isSuccess 
                        ? 'border-[#FF6600]/50 bg-[#FF6600]/10' 
                        : 'border-red-500/50 bg-red-500/10'
                    }`}
                  >
                    {digit}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Status Card */}
            <div className={`p-6 rounded-xl border ${
              isSuccess 
                ? 'bg-gradient-to-br from-[#FF6600]/10 to-[#FF6600]/5 border-[#FF6600]/20' 
                : 'bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${
                  isSuccess ? 'bg-[#FF6600]/20' : 'bg-red-500/20'
                }`}>
                  {isSuccess ? (
                    <CheckCircle className="w-6 h-6 text-[#FF6600]" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <p className={`font-bold text-lg ${
                    isSuccess ? 'text-[#FF6600]' : 'text-red-500'
                  }`}>
                    {isSuccess ? "Onchain Verification Complete" : "Verification Failed"}
                  </p>
                  <p className="text-[#A3A3A3] text-sm leading-relaxed">
                    {isSuccess 
                      ? "Your identity has been cryptographically verified and recorded on the blockchain using zero-knowledge proofs. No sensitive data was exposed." 
                      : "The provided OTP code could not be verified. This could be due to an incorrect code, expired session, or network issues."
                    }
                  </p>
                  
                  {isSuccess && (
                    <div className="pt-4 border-t border-[#FF6600]/20 mt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#A3A3A3]">Transaction Hash:</span>
                        <div className="flex items-center gap-2">
                          <code className="text-[#FF6600] bg-[#FF6600]/10 px-2 py-1 rounded font-mono text-xs">
                            {transactionHash}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-[#FF6600] hover:text-[#FF7A00]"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-4">
              {!isSuccess && (
                <Button
                  onClick={onRetry}
                  className="w-full bg-gradient-to-r from-[#FF6600] to-[#FF7A00] hover:shadow-lg hover:shadow-[#FF6600]/30 text-white py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Try Again with New Code
                </Button>
              )}
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="flex-1 border-[#2E2E2E] text-[#A3A3A3] hover:bg-[#1A1A1A] hover:text-white py-4 rounded-xl font-semibold transition-all duration-300"
                >
                  Back to Home
                </Button>
                
                {isSuccess && (
                  <Button
                    onClick={onBack}
                    className="flex-1 bg-gradient-to-r from-[#FF6600] to-[#FF7A00] hover:shadow-lg hover:shadow-[#FF6600]/30 text-white py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    Continue to Dashboard
                  </Button>
                )}
              </div>
            </div>
            
            {/* Success Footer */}
            {isSuccess && (
              <div className="text-center pt-6 border-t border-[#2E2E2E]">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-green-500 font-medium">Verification Complete</p>
                </div>
                <p className="text-[#A3A3A3] text-sm leading-relaxed">
                  Your secure session is now active. All future interactions will be protected 
                  by your verified onchain identity.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}