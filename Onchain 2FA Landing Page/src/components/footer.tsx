import { Github, Twitter, Mail, FileText, Shield, Zap, ExternalLink } from "lucide-react";

const socialLinks = [
  { name: "GitHub", href: "#", icon: Github },
  { name: "Twitter", href: "#", icon: Twitter },
  { name: "Contact", href: "#", icon: Mail }
];

const resourceLinks = [
  { name: "Documentation", href: "#" },
  { name: "API Reference", href: "#" },
  { name: "SDK Downloads", href: "#" },
  { name: "Examples", href: "#" }
];

const companyLinks = [
  { name: "About", href: "#" },
  { name: "Security", href: "#" },
  { name: "Privacy Policy", href: "#" },
  { name: "Terms of Service", href: "#" }
];

export function Footer() {
  return (
    <footer className="w-full bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] border-t border-[#2E2E2E] py-16 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FF6600] to-[#FF7A00] rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-bold text-xl">Onchain 2FA</span>
            </div>
            <p className="text-[#A3A3A3] leading-relaxed">
              The future of authentication. Secure, private, and decentralized 
              identity verification powered by zero-knowledge proofs.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-500 text-sm font-medium">Live on Mainnet</span>
            </div>
          </div>
          
          {/* Resources */}
          <div className="space-y-6">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#FF6600]" />
              Resources
            </h3>
            <ul className="space-y-3">
              {resourceLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-[#A3A3A3] hover:text-[#FF6600] transition-colors duration-200 flex items-center gap-2 group"
                  >
                    {link.name}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Company */}
          <div className="space-y-6">
            <h3 className="text-white font-bold text-lg">Company</h3>
            <ul className="space-y-3">
              {companyLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-[#A3A3A3] hover:text-[#FF6600] transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Connect */}
          <div className="space-y-6">
            <h3 className="text-white font-bold text-lg">Connect</h3>
            <div className="space-y-4">
              {socialLinks.map((link, index) => {
                const IconComponent = link.icon;
                return (
                  <a
                    key={index}
                    href={link.href}
                    className="flex items-center space-x-3 text-[#A3A3A3] hover:text-[#FF6600] transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 bg-[#2E2E2E] rounded-lg flex items-center justify-center group-hover:bg-[#FF6600]/20 transition-colors duration-200">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span className="group-hover:translate-x-1 transition-transform duration-200">{link.name}</span>
                  </a>
                );
              })}
            </div>
            
            {/* Newsletter */}
            <div className="pt-4 border-t border-[#2E2E2E]">
              <p className="text-[#A3A3A3] text-sm mb-3">Stay updated with the latest features</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter email"
                  className="flex-1 bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-sm text-white placeholder-[#A3A3A3] focus:border-[#FF6600] focus:outline-none"
                />
                <button className="bg-[#FF6600] hover:bg-[#FF7A00] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-[#2E2E2E] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#A3A3A3] text-sm">
            © 2024 Onchain 2FA. All rights reserved. Built with zero-knowledge technology.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[#A3A3A3]">Powered by</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#FF6600] rounded-sm"></div>
              <span className="text-white font-medium">Zero-Knowledge Proofs</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}