import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";
import { ArrowLeft, RefreshCw, Copy, Check, Zap, Lock } from "lucide-react";

interface CodeDemoPageProps {
  onVerify: (otp: string) => void;
  onBack: () => void;
  onCodeGenerated: (code: string) => void;
}

export function CodeDemoPage({ onVerify, onBack, onCodeGenerated }: CodeDemoPageProps) {
  const [generatedCode, setGeneratedCode] = useState("");
  const [inputOtp, setInputOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate a random 6-digit code
  const generateCode = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate generation time
    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    onCodeGenerated(code);
    setInputOtp(""); // Clear input when new code is generated
    setIsGenerating(false);
  };

  // Generate initial code on mount
  useEffect(() => {
    generateCode();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputOtp.length === 6) {
      setIsLoading(true);
      // Simulate verification delay
      setTimeout(() => {
        setIsLoading(false);
        onVerify(inputOtp);
      }, 1000);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleUseGeneratedCode = () => {
    setInputOtp(generatedCode);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-6">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-8 text-[#A3A3A3] hover:text-white hover:bg-[#1A1A1A] transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Live Demo
          </h1>
          <p className="text-[#A3A3A3] text-lg max-w-2xl mx-auto">
            Experience how Onchain 2FA works. Generate a secure OTP and verify it using zero-knowledge proofs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Code Generation Section */}
          <Card className="bg-[#1A1A1A] border-[#2E2E2E] shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-[#FF6600]/30">
            <CardHeader className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FF6600] to-[#FF7A00] rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#FF6600]/25">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Code Generator
              </CardTitle>
              <CardDescription className="text-[#A3A3A3]">
                Your secure onchain 2FA code is generated using zero-knowledge proofs.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-white">
                  Generated OTP Code
                </label>
                
                {/* Generated Code Display */}
                <div className="relative">
                  <div className="flex justify-center">
                    <div className="flex gap-3">
                      {(isGenerating ? "------" : generatedCode).split('').map((digit, index) => (
                        <div 
                          key={index}
                          className={`w-14 h-14 border rounded-xl flex items-center justify-center text-white text-xl font-mono transition-all duration-300 ${
                            isGenerating 
                              ? 'border-[#FF6600] bg-[#FF6600]/10 animate-pulse' 
                              : 'border-[#2E2E2E] bg-[#0A0A0A] hover:border-[#FF6600]/50'
                          }`}
                        >
                          {isGenerating ? (
                            <div className="w-2 h-2 bg-[#FF6600] rounded-full animate-bounce" style={{animationDelay: `${index * 0.1}s`}} />
                          ) : (
                            digit
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {!isGenerating && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#FF6600]/0 via-[#FF6600]/5 to-[#FF6600]/0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={generateCode}
                    disabled={isGenerating}
                    variant="outline"
                    className="flex-1 border-[#2E2E2E] bg-[#0A0A0A] text-white hover:bg-[#1A1A1A] hover:border-[#FF6600] transition-all duration-200 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? 'Generating...' : 'Generate New'}
                  </Button>
                  <Button
                    onClick={handleCopyCode}
                    disabled={isGenerating || !generatedCode}
                    variant="outline"
                    className="flex-1 border-[#2E2E2E] bg-[#0A0A0A] text-white hover:bg-[#1A1A1A] hover:border-[#FF6600] transition-all duration-200 disabled:opacity-50"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>

                <Button
                  onClick={handleUseGeneratedCode}
                  disabled={isGenerating || !generatedCode}
                  className="w-full bg-gradient-to-r from-[#FF6600] to-[#FF7A00] hover:shadow-lg hover:shadow-[#FF6600]/30 text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                >
                  Use This Code for Verification →
                </Button>
              </div>

              {/* Info Section */}
              <div className="bg-[#0A0A0A] border border-[#2E2E2E] rounded-lg p-4">
                <h4 className="text-sm font-medium text-white mb-2">Zero-Knowledge Proof</h4>
                <p className="text-sm text-[#A3A3A3]">
                  This code is backed by cryptographic proofs that verify your identity without revealing sensitive information onchain.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Code Verification Section */}
          <Card className="bg-[#1A1A1A] border-[#2E2E2E] shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-[#FF6600]/30">
            <CardHeader className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FF6600] to-[#FF7A00] rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#FF6600]/25">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Verify Code
              </CardTitle>
              <CardDescription className="text-[#A3A3A3]">
                Enter the generated code to complete onchain verification.
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
                      value={inputOtp}
                      onChange={setInputOtp}
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
                  disabled={inputOtp.length !== 6 || isLoading}
                  className="w-full bg-gradient-to-r from-[#FF6600] to-[#FF7A00] hover:shadow-lg hover:shadow-[#FF6600]/30 text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </Button>
              </form>

              {/* Help Text */}
              <div className="bg-[#0A0A0A] border border-[#2E2E2E] rounded-lg p-4">
                <h4 className="text-sm font-medium text-white mb-2">Demo Instructions</h4>
                <ul className="text-sm text-[#A3A3A3] space-y-1">
                  <li>• Use the generated code from the left panel</li>
                  <li>• Or try "123456" for a preset demo</li>
                  <li>• Any other code will show failure state</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}