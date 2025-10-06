import { Shield, Key, CheckCircle, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Shield,
    title: "User enters OTP",
    description: "User provides their one-time password for verification",
    detail: "Secure input through encrypted channels"
  },
  {
    icon: Key,
    title: "Oracle verifies with zero-knowledge proof",
    description: "System validates the OTP using privacy-preserving cryptography",
    detail: "No sensitive data leaves your device"
  },
  {
    icon: CheckCircle,
    title: "Smart contract confirms",
    description: "Blockchain confirms identity without exposing sensitive data",
    detail: "Immutable onchain verification"
  }
];

export function HowItWorksSection() {
  return (
    <section className="w-full bg-[#1A1A1A] py-24 px-6 lg:px-12 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/50 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-6 py-3 bg-[#FF6600]/10 border border-[#FF6600]/20 rounded-full mb-6">
            <span className="text-[#FF6600] font-medium">How It Works</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Three Steps to 
            <span className="block text-transparent bg-gradient-to-r from-[#FF6600] to-[#FF7A00] bg-clip-text">
              Secure Verification
            </span>
          </h2>
          <p className="text-[#A3A3A3] text-lg max-w-3xl mx-auto leading-relaxed">
            Our zero-knowledge 2FA system provides bulletproof security through a simple, 
            three-step process that keeps your data private while ensuring complete verification.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connection lines for desktop */}
          <div className="hidden md:block absolute top-24 left-1/3 right-1/3 h-px bg-gradient-to-r from-[#FF6600]/0 via-[#FF6600]/50 to-[#FF6600]/0"></div>
          <div className="hidden md:block absolute top-24 left-1/3 w-px h-8 bg-[#FF6600]/30 transform -translate-x-8"></div>
          <div className="hidden md:block absolute top-24 right-1/3 w-px h-8 bg-[#FF6600]/30 transform translate-x-8"></div>
          
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div 
                key={index}
                className="bg-[#0A0A0A] border border-[#2E2E2E] rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-500 hover:border-[#FF6600]/30 group hover:-translate-y-2"
              >
                {/* Step number */}
                <div className="absolute -top-4 left-8 bg-gradient-to-r from-[#FF6600] to-[#FF7A00] text-white px-4 py-1 rounded-full text-sm font-bold">
                  Step {index + 1}
                </div>
                
                <div className="w-20 h-20 bg-gradient-to-br from-[#FF6600]/20 to-[#FF6600]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <IconComponent className="w-10 h-10 text-[#FF6600]" />
                </div>
                
                <h4 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#FF6600] group-hover:to-[#FF7A00] group-hover:bg-clip-text transition-all duration-300">
                  {step.title}
                </h4>
                
                <p className="text-[#A3A3A3] mb-4 leading-relaxed">
                  {step.description}
                </p>
                
                <div className="pt-4 border-t border-[#2E2E2E] group-hover:border-[#FF6600]/30 transition-colors duration-300">
                  <p className="text-[#FF6600] text-sm font-medium flex items-center justify-center gap-2">
                    {step.detail}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-[#A3A3A3] mb-6">
            Ready to experience the future of authentication?
          </p>
          <div className="inline-flex items-center px-6 py-3 bg-[#FF6600]/10 border border-[#FF6600]/20 rounded-full">
            <div className="w-2 h-2 bg-[#FF6600] rounded-full animate-pulse mr-3"></div>
            <span className="text-[#FF6600] font-medium">Zero downtime • 99.9% uptime • Enterprise ready</span>
          </div>
        </div>
      </div>
    </section>
  );
}