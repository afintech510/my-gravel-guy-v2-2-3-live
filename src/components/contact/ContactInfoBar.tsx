import React from 'react';
import { Phone, Mail, Clock } from 'lucide-react';

const ContactInfoBar: React.FC = () => {
  return (
    <section className="py-10 bg-[#0a0c0f] border-t border-[rgba(255,255,255,0.1)]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-6 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-4">
            <div className="w-12 h-12 bg-[#BADF24]/10 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-[#BADF24]" />
            </div>
            <div>
              <p className="text-[#B7C0CC] text-sm">Phone</p>
              <a href="tel:+18446240400" className="text-[#F5F7FA] font-semibold hover:text-[#BADF24]">
                (844) 624-0400
              </a>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-4">
            <div className="w-12 h-12 bg-[#BADF24]/10 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-[#BADF24]" />
            </div>
            <div>
              <p className="text-[#B7C0CC] text-sm">Email</p>
              <a href="mailto:support@mygravelguy.com" className="text-[#F5F7FA] font-semibold hover:text-[#BADF24]">
                support@mygravelguy.com
              </a>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-4">
            <div className="w-12 h-12 bg-[#BADF24]/10 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#BADF24]" />
            </div>
            <div>
              <p className="text-[#B7C0CC] text-sm">Hours (Eastern)</p>
              <p className="text-[#F5F7FA] font-semibold">Mon-Fri 8am-5pm • Sat 8am-1pm</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.1)]">
          <p className="text-[#B7C0CC] text-sm text-center">
            <strong className="text-[#F5F7FA]">Business Entity:</strong> MyGravelGuy.com is a service provided by Eastern Building Supply Inc.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ContactInfoBar;
