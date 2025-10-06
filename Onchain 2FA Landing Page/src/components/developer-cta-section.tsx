import { Button } from "./ui/button";
import { BookOpen, Code, Terminal, Zap, ArrowRight, Github } from "lucide-react";

const features = [
  {
    icon: Code,
    title: "Simple SDK",
    description: "One-line integration with comprehensive TypeScript support"
  },
  {
    icon: Terminal,
    title: "CLI Tools",
    description: "Deploy and manage your 2FA infrastructure from the command line"
  },
  {
    icon: Zap,
    title: "Fast Setup",
    description: "Get up and running in under 5 minutes with our quickstart guide"
  }
];

export function DeveloperCtaSection() {
  return (
    <section className="w-full bg-[#0A0A0A] py-24 px-6 lg:px-12 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF6600]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FF6600]/3 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-6 py-3 bg-[#FF6600]/10 border border-[#FF6600]/20 rounded-full mb-6">
            <BookOpen className="w-5 h-5 text-[#FF6600] mr-2" />
            <span className="text-[#FF6600] font-medium">Developer Resources</span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Built for 
            <span className="block text-transparent bg-gradient-to-r from-[#FF6600] to-[#FF7A00] bg-clip-text">
              Developers
            </span>
          </h2>
          
          <p className="text-xl text-[#A3A3A3] max-w-3xl mx-auto leading-relaxed mb-12">
            Comprehensive documentation, SDKs, and tools to integrate Onchain 2FA 
            into your applications. From proof-of-concept to production scale.
          </p>
          
          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-6 hover:border-[#FF6600]/30 transition-all duration-300 group">
                  <div className="w-12 h-12 bg-[#FF6600]/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="w-6 h-6 text-[#FF6600]" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-[#A3A3A3] text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button className="bg-gradient-to-r from-[#FF6600] to-[#FF7A00] hover:shadow-lg hover:shadow-[#FF6600]/30 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105">
              Read Documentation
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <Button 
              variant="outline"
              className="border-[#2E2E2E] text-white hover:bg-[#1A1A1A] hover:border-[#FF6600] px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
            >
              <Github className="w-5 h-5 mr-2" />
              View on GitHub
            </Button>
          </div>
          
          {/* Code Preview */}
          <div className="mt-16 bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl p-8 text-left max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-[#A3A3A3] text-sm">integration.ts</span>
            </div>
            <pre className="text-sm text-[#A3A3A3] font-mono leading-relaxed">
              <code>
{`import { OnchainAuth } from '@onchain2fa/sdk';

const auth = new OnchainAuth({
  apiKey: 'your-api-key',
  network: 'mainnet'
});

// Verify user with OTP
const result = await auth.verify({
  otp: userInput,
  userId: 'user-123'
});

console.log(result.verified); // true`}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}