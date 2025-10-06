import { Check, Shield, Code, Eye, AlertTriangle } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const features = [
  {
    icon: Shield,
    title: "Onchain verification",
    description: "Direct blockchain verification without intermediaries"
  },
  {
    icon: Eye,
    title: "Zero-knowledge privacy", 
    description: "Verify identity without exposing sensitive information"
  },
  {
    icon: Code,
    title: "Simple developer integration",
    description: "Easy-to-use APIs and comprehensive documentation"
  },
  {
    icon: AlertTriangle,
    title: "Event-based trap detection",
    description: "Advanced security monitoring and threat detection"
  }
];

export function FeaturesSection() {
  return (
    <section className="w-full bg-[#0A0A0A] py-20 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Features</h2>
          <p className="text-[#A3A3A3] text-lg max-w-2xl mx-auto">
            Built for the next generation of secure blockchain applications
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#FF6600]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <IconComponent className="w-5 h-5 text-[#FF6600]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-[#A3A3A3]">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF6600]/20 to-transparent rounded-3xl blur-3xl"></div>
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1684610529682-553625a1ffed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibG9ja2NoYWluJTIwbmV0d29yayUyMG5vZGVzJTIwdmlzdWFsaXphdGlvbnxlbnwxfHx8fDE3NTk1MzA5Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Blockchain network visualization"
              className="relative z-10 w-full h-96 object-cover rounded-3xl"
            />
            <div className="absolute top-4 right-4 bg-[#0A0A0A]/90 backdrop-blur-sm rounded-lg p-3 z-20">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-[#FF6600] rounded-full animate-pulse"></div>
                <span className="text-[#A3A3A3] text-sm">Live Network</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}