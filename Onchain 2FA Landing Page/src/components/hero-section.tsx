import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Shield, Zap, Globe } from "lucide-react";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <section className="w-full bg-[#0A0A0A] py-20 px-6 lg:px-12 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#FF6600]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#FF6600]/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-[#FF6600]/10 border border-[#FF6600]/20 rounded-full">
            <Zap className="w-4 h-4 text-[#FF6600] mr-2" />
            <span className="text-[#FF6600] text-sm font-medium">Live Demo Available</span>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
              Onchain
              <span className="block text-transparent bg-gradient-to-r from-[#FF6600] to-[#FF7A00] bg-clip-text">
                2FA
              </span>
            </h1>
            <h2 className="text-xl lg:text-2xl text-[#A3A3A3] font-medium">
              Zero-Knowledge Two-Factor Authentication
            </h2>
            <p className="text-[#A3A3A3] text-lg max-w-lg leading-relaxed">
              Verify identities onchain using OTPs backed by zero-knowledge proofs. 
              Secure, private, and decentralized authentication for the next generation of web applications.
            </p>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-8 py-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#FF6600]" />
              <span className="text-white font-medium">100% Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#FF6600]" />
              <span className="text-white font-medium">Onchain Verified</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={onGetStarted}
              className="bg-gradient-to-r from-[#FF6600] to-[#FF7A00] hover:shadow-lg hover:shadow-[#FF6600]/30 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
            >
              Try Live Demo →
            </Button>
            <Button 
              variant="outline" 
              className="border-[#FF6600] text-[#FF6600] hover:bg-[#FF6600] hover:text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-[#FF6600]/25 bg-transparent"
            >
              View Documentation
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF6600]/20 to-transparent rounded-3xl blur-3xl animate-pulse"></div>
          <div className="relative z-10 bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl p-1 shadow-2xl">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1740477959006-798042a324aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGNyeXB0b2dyYXBoeSUyMGJsb2NrY2hhaW4lMjBkaWdpdGFsJTIwc2VjdXJpdHl8ZW58MXx8fHwxNzU5NTMwOTM3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Abstract cryptography and blockchain visualization"
              className="w-full h-96 object-cover rounded-xl"
            />
            {/* Overlay indicators */}
            <div className="absolute top-4 left-4 bg-[#0A0A0A]/90 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">Live Network</span>
              </div>
            </div>
            <div className="absolute bottom-4 right-4 bg-[#FF6600]/90 backdrop-blur-sm rounded-lg px-3 py-2">
              <span className="text-white text-sm font-medium">ZK Proofs</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}