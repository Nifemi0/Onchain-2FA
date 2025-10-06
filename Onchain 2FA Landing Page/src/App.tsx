import { useState } from "react";
import { LandingPage } from "./components/landing-page";
import { CodeDemoPage } from "./components/code-demo-page";
import { VerifyPage } from "./components/verify-page";

type Page = "landing" | "demo" | "verify";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("landing");
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [verificationResult, setVerificationResult] = useState<{
    isSuccess: boolean;
    otp: string;
  } | null>(null);

  const handleGetStarted = () => {
    setCurrentPage("demo");
  };

  const handleVerify = (otp: string) => {
    // Enhanced verification logic:
    // Success if OTP matches the generated code or is the demo code "123456"
    const isSuccess = otp === generatedCode || otp === "123456";
    
    setVerificationResult({ isSuccess, otp });
    setCurrentPage("verify");
  };

  const handleBack = () => {
    setCurrentPage("landing");
    setVerificationResult(null);
    setGeneratedCode("");
  };

  const handleRetry = () => {
    setCurrentPage("demo");
    setVerificationResult(null);
  };

  const handleCodeGenerated = (code: string) => {
    setGeneratedCode(code);
  };

  switch (currentPage) {
    case "demo":
      return (
        <CodeDemoPage 
          onVerify={handleVerify} 
          onBack={handleBack}
          onCodeGenerated={handleCodeGenerated}
        />
      );
    case "verify":
      return verificationResult ? (
        <VerifyPage 
          isSuccess={verificationResult.isSuccess}
          otp={verificationResult.otp}
          onBack={handleBack}
          onRetry={handleRetry}
        />
      ) : null;
    default:
      return <LandingPage onGetStarted={handleGetStarted} />;
  }
}